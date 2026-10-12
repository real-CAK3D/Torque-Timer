package com.realcak3d.blipling.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.realcak3d.blipling.core.GameEvent
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.SensorHub
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.random.Random

private enum class Game(val title: String, val icon: String, val blurb: String) {
    CATCHER("Byte Catcher", "🧺", "Tilt the phone (or drag) to catch falling bytes. Dodge the bugs!"),
    SIMON("Signal Simon", "🚦", "Repeat the antenna light pattern. It gets longer every round."),
    REFLEX("Quick Blip", "⚡", "Tap the moment the blip turns green. 5 rounds."),
    MEMORY("Code Match", "🃏", "Flip cards to find matching pairs."),
}

@Composable
fun GamesScreen(repo: GameRepository, hub: SensorHub) {
    var game by rememberSaveable { mutableStateOf<Game?>(null) }
    var result by remember { mutableStateOf<String?>(null) }
    val g by rememberGame(repo)

    fun finish(key: String, score: Int, won: Boolean, summary: String) {
        val ev = repo.act { n -> gameFinished(key, score, won, n) }
        val coins = ev.filterIsInstance<GameEvent.Coins>().sumOf { it.amount }
        result = "$summary  ·  +$coins 🪙"
        game = null
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        val current = game
        if (current == null) {
            ScreenTitle("Games", "Play to earn coins and make ${g.buddy.name.ifBlank { "your buddy" }} happy (uses some energy)")
            result?.let { Box(Modifier.fillMaxWidth().padding(horizontal = 12.dp)) { SpeechBubble(it) }; Spacer(Modifier.height(8.dp)) }
            if (g.buddy.hatched && g.buddy.stats.energy < 10) {
                Text("${g.buddy.name} is too tired to play. Let them sleep!", color = Pal.red, modifier = Modifier.padding(16.dp))
            }
            Game.entries.forEach { gm ->
                Row(
                    Modifier.padding(horizontal = 12.dp, vertical = 5.dp).fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(Pal.panel)
                        .border(1.dp, Pal.line, RoundedCornerShape(18.dp))
                        .clickable { if (!g.buddy.hatched || g.buddy.stats.energy >= 10) { result = null; game = gm } }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(gm.icon, fontSize = 34.sp)
                    Column(Modifier.padding(start = 12.dp).weight(1f)) {
                        Text(gm.title, color = Pal.text, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        Text(gm.blurb, color = Pal.sub, fontSize = 12.sp)
                        Text("Best: ${g.bestScores[gm.name.lowercase()] ?: 0}", color = Pal.amber, fontSize = 12.sp)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Text("More games live in Chat: riddles, guess-the-number, rock-paper-scissors, dice and coin flips.", color = Pal.sub, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp))
        } else {
            Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("${current.icon} ${current.title}", color = Pal.text, fontSize = 20.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text("✕ Quit", color = Pal.sub, modifier = Modifier.clickable { game = null }.padding(8.dp))
            }
            when (current) {
                Game.CATCHER -> ByteCatcher(hub) { score -> finish("catcher", score, score >= 15, "Caught $score bytes") }
                Game.SIMON -> SignalSimon(hub) { rounds -> finish("simon", rounds * 6, rounds >= 5, "Reached round $rounds") }
                Game.REFLEX -> QuickBlip(hub) { avgMs -> finish("reflex", ((900 - avgMs).coerceAtLeast(10) / 10).toInt(), avgMs < 400, "Average ${avgMs} ms") }
                Game.MEMORY -> CodeMatch(hub) { moves -> finish("memory", (60 - moves).coerceAtLeast(5), moves <= 16, "Cleared in $moves moves") }
            }
        }
    }
}

private data class Faller(val x: Float, var y: Float, val speed: Float, val bug: Boolean, val icon: String)

@Composable
private fun ByteCatcher(hub: SensorHub, onDone: (Int) -> Unit) {
    val body by hub.body.readings.collectAsStateWithLifecycle()
    val tilt by rememberUpdatedState(body.tiltX)
    var basket by remember { mutableFloatStateOf(0.5f) }
    var score by remember { mutableIntStateOf(0) }
    var timeLeft by remember { mutableLongStateOf(30_000L) }
    val items = remember { mutableStateListOf<Faller>() }
    var tick by remember { mutableLongStateOf(0L) }
    val done by rememberUpdatedState(onDone)

    LaunchedEffect(Unit) {
        var last = 0L
        var spawn = 0L
        while (timeLeft > 0) {
            withFrameMillis { t ->
                if (last == 0L) last = t
                val dt = (t - last).coerceAtMost(50); last = t
                timeLeft -= dt
                basket = (basket - tilt * 0.0009f * dt).coerceIn(0.06f, 0.94f)
                spawn += dt
                if (spawn > 520) {
                    spawn = 0
                    val bug = Random.nextInt(5) == 0
                    items += Faller(Random.nextFloat() * 0.9f + 0.05f, -0.05f, 0.00025f + Random.nextFloat() * 0.0003f + (30_000 - timeLeft) / 30_000f * 0.0003f, bug,
                        if (bug) "🐛" else listOf("💾", "🍪", "🔋", "⭐", "🍕").random())
                }
                val gone = mutableListOf<Faller>()
                for (f in items.toList()) {
                    f.y += f.speed * dt
                    if (f.y > 0.86f && f.y < 0.95f && kotlin.math.abs(f.x - basket) < 0.1f) {
                        if (f.bug) { score = (score - 3).coerceAtLeast(0); hub.haptics.buzz(80, 220) } else { score++; hub.haptics.buzz(12, 80) }
                        gone += f
                    } else if (f.y > 1.05f) gone += f
                }
                if (gone.isNotEmpty()) items.removeAll { f -> gone.any { it === f } }
                tick = t
            }
        }
        done(score)
    }
    Text("Score $score   ·   ${timeLeft / 1000}s", color = Pal.amber, fontFamily = Mono, modifier = Modifier.padding(horizontal = 16.dp))
    Box(
        Modifier.padding(12.dp).fillMaxWidth().aspectRatio(0.8f).clip(RoundedCornerShape(18.dp)).background(Pal.panel)
            .pointerInput(Unit) { detectDragGestures { change, drag -> basket = (basket + drag.x / size.width).coerceIn(0.06f, 0.94f); change.consume() } }
    ) {
        Canvas(Modifier.fillMaxSize()) {
            tick.let { }
            val paint = android.graphics.Paint().apply { textSize = size.width * 0.07f; textAlign = android.graphics.Paint.Align.CENTER }
            items.forEach { f -> drawContext.canvas.nativeCanvas.drawText(f.icon, f.x * size.width, f.y * size.height, paint) }
            val bx = basket * size.width
            drawRoundRect(Pal.mint, Offset(bx - size.width * 0.1f, size.height * 0.9f), Size(size.width * 0.2f, size.height * 0.04f), androidx.compose.ui.geometry.CornerRadius(12f))
            drawContext.canvas.nativeCanvas.drawText("🧺", bx, size.height * 0.9f, paint)
        }
    }
}

@Composable
private fun SignalSimon(hub: SensorHub, onDone: (Int) -> Unit) {
    val colors = listOf(Pal.red, Pal.amber, Pal.mint, Pal.sky)
    val seq = remember { mutableStateListOf<Int>() }
    var showing by remember { mutableStateOf(true) }
    var lit by remember { mutableIntStateOf(-1) }
    var pos by remember { mutableIntStateOf(0) }
    var round by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val done by rememberUpdatedState(onDone)

    suspend fun play() {
        showing = true
        delay(600)
        for (i in seq) { lit = i; hub.haptics.beep(android.media.ToneGenerator.TONE_DTMF_1 + i, 220); delay(420); lit = -1; delay(180) }
        showing = false; pos = 0
    }
    LaunchedEffect(Unit) { seq += Random.nextInt(4); round = 1; play() }

    Text(if (showing) "Watch…" else "Your turn! Round $round", color = Pal.amber, modifier = Modifier.padding(horizontal = 16.dp))
    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        for (row in 0..1) Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            for (col in 0..1) {
                val i = row * 2 + col
                Box(
                    Modifier.weight(1f).aspectRatio(1f).clip(RoundedCornerShape(24.dp))
                        .background(colors[i].copy(alpha = if (lit == i) 1f else 0.28f))
                        .clickable(enabled = !showing) {
                            lit = i
                            hub.haptics.beep(android.media.ToneGenerator.TONE_DTMF_1 + i, 150)
                            scope.launch { delay(150); if (lit == i) lit = -1 }
                            if (seq[pos] == i) {
                                pos++
                                if (pos == seq.size) { round++; seq += Random.nextInt(4); scope.launch { play() } }
                            } else {
                                hub.haptics.buzz(300, 255)
                                done(round - 1)
                            }
                        }
                )
            }
        }
    }
}

@Composable
private fun QuickBlip(hub: SensorHub, onDone: (Long) -> Unit) {
    var state by remember { mutableStateOf("wait") } // wait, ready, go, early
    var round by remember { mutableIntStateOf(1) }
    var goAt by remember { mutableLongStateOf(0L) }
    val times = remember { mutableStateListOf<Long>() }
    val done by rememberUpdatedState(onDone)
    LaunchedEffect(round, state == "wait") {
        if (state != "wait") return@LaunchedEffect
        delay(700)
        state = "ready"
        delay(Random.nextLong(1200, 3500))
        if (state == "ready") { state = "go"; goAt = System.currentTimeMillis(); hub.haptics.buzz(20, 120) }
    }
    val color = when (state) { "go" -> Pal.mint; "early" -> Pal.red; else -> Pal.panel2 }
    Text("Round $round / 5   ${times.lastOrNull()?.let { "· last ${it} ms" } ?: ""}", color = Pal.amber, modifier = Modifier.padding(horizontal = 16.dp))
    Box(
        Modifier.padding(12.dp).fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(200.dp)).background(color)
            .clickable {
                when (state) {
                    "go" -> {
                        times += System.currentTimeMillis() - goAt
                        if (times.size >= 5) done(times.average().toLong()) else { round++; state = "wait" }
                    }
                    "ready" -> { state = "early"; hub.haptics.buzz(200, 200) }
                    "early" -> { state = "wait" }
                    else -> {}
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(when (state) { "go" -> "TAP!"; "early" -> "Too early! Tap to retry"; "ready" -> "Wait for green…"; else -> "Get ready" }, color = Pal.text, fontSize = 22.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CodeMatch(hub: SensorHub, onDone: (Int) -> Unit) {
    val icons = remember { (listOf("📶", "🔵", "🛰️", "💾", "🍪", "🔋", "📦", "⭐").flatMap { listOf(it, it) }).shuffled() }
    val open = remember { mutableStateListOf<Int>() }
    val matched = remember { mutableStateListOf<Int>() }
    var moves by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val done by rememberUpdatedState(onDone)
    Text("Moves: $moves", color = Pal.amber, modifier = Modifier.padding(horizontal = 16.dp))
    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        for (r in 0 until 4) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            for (c in 0 until 4) {
                val i = r * 4 + c
                val shown = i in open || i in matched
                Box(
                    Modifier.weight(1f).aspectRatio(0.8f).clip(RoundedCornerShape(12.dp))
                        .background(if (i in matched) Pal.mint.copy(alpha = 0.25f) else if (shown) Pal.panel2 else Pal.mintDim)
                        .clickable(enabled = !shown && open.size < 2) {
                            open += i
                            hub.haptics.buzz(10, 60)
                            if (open.size == 2) {
                                moves++
                                val (a, b) = open[0] to open[1]
                                if (icons[a] == icons[b]) {
                                    matched += a; matched += b; open.clear()
                                    hub.haptics.buzz(30, 150)
                                    if (matched.size == icons.size) done(moves)
                                } else scope.launch { delay(700); open.clear() }
                            }
                        },
                    contentAlignment = Alignment.Center,
                ) { Text(if (shown) icons[i] else "?", fontSize = 26.sp, color = Color.White) }
            }
        }
    }
}
