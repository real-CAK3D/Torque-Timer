package com.realcak3d.blipling.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.realcak3d.blipling.core.Anim
import com.realcak3d.blipling.core.GameData
import com.realcak3d.blipling.core.Sex
import com.realcak3d.blipling.core.Stage
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.SensorHub

fun GameData.look(now: Long) = BuddyLook(
    hue = buddy.hue, stage = buddy.stage(now), pattern = buddy.pattern, sex = buddy.sex, accessory = buddy.accessory,
    asleep = buddy.asleep, sick = buddy.sick, poops = buddy.poops, dirty = buddy.stats.hygiene < 30,
    happiness = buddy.stats.happiness, weight = buddy.weight, tantrum = buddy.tantrum, seed = buddy.seed, dead = buddy.dead,
)

@Composable
fun HomeScreen(repo: GameRepository, hub: SensorHub, go: (Screen) -> Unit) {
    val g by rememberGame(repo)
    val speech by repo.speech.collectAsStateWithLifecycle()
    val body by hub.body.readings.collectAsStateWithLifecycle()
    val wifi by hub.wifi.results.collectAsStateWithLifecycle()
    val bt by hub.bt.devices.collectAsStateWithLifecycle()
    val now = System.currentTimeMillis()
    val b = g.buddy
    var eggTaps by rememberSaveable { mutableIntStateOf(0) }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 16.dp)) {
        // Header
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    if (b.hatched) "${b.name} ${b.sex.symbol}" else "Mystery Egg",
                    color = Pal.text, fontSize = 24.sp, fontWeight = FontWeight.Black,
                )
                Text(
                    if (b.hatched) "Lv ${b.level} · ${b.stage(now).label} · ${b.ageYears(now)} yrs · ${repo.engine.mood(now)}"
                    else "Generation ${b.generation} · waiting to hatch",
                    color = Pal.sub, fontSize = 13.sp,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("❤️".repeat(b.lives.coerceIn(0, 5)) + "🖤".repeat((5 - b.lives).coerceIn(0, 5)), fontSize = 12.sp)
                Text("🪙 ${g.coins}", color = Pal.amber, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            }
        }
        if (b.hatched) {
            XpBar(b.xp, b.xpToNext(), Modifier.padding(horizontal = 16.dp))
        }

        // Stage + speech
        Box(Modifier.fillMaxWidth().height(330.dp)) {
            RoomBackdrop(Modifier.fillMaxSize(), night = repo.engine.isNight(now), asleep = b.asleep)
            val antenna = ((wifi.size + bt.size) / 25f).coerceIn(0f, 1f)
            BuddyView(
                look = g.look(now), anim = speech.anim, animAt = speech.at,
                modifier = Modifier.fillMaxSize(),
                lookAt = Offset(-body.tiltX / 6f, body.tiltY / 9f - 0.3f),
                antennaGlow = antenna,
                eggCracks = eggTaps,
                onTap = {
                    if (!b.hatched) {
                        if (b.name.isNotBlank()) {
                            eggTaps++
                            hub.haptics.buzz(20, 80 + eggTaps * 15)
                            if (eggTaps >= 7) { eggTaps = 0; repo.act { n -> hatch(g.buddy.name, g.buddy.sex, n) } }
                            else repo.say(listOf("*wobble*", "*crack*", "*tap tap*", "*the egg feels warm*").random(), Anim.SHOCK)
                        } else repo.say("Name me first! ↓")
                    } else {
                        hub.haptics.buzz(15, 60)
                        repo.act { n -> pet(n) }
                    }
                },
            )
            if (speech.text.isNotBlank()) {
                AnimatedContent(
                    targetState = speech.text, label = "speech",
                    transitionSpec = { fadeIn() togetherWith fadeOut() },
                    modifier = Modifier.align(Alignment.TopCenter).padding(12.dp),
                ) { text -> SpeechBubble(text) }
            }
            Text(
                listOfNotNull(
                    if (wifi.isNotEmpty()) "📶 ${wifi.size}" else null,
                    if (bt.isNotEmpty()) "🔵 ${bt.size}" else null,
                    if (body.charging) "⚡" else null,
                    if (body.stepsSession > 0) "👟 ${body.stepsSession}" else null,
                ).joinToString("   "),
                color = Pal.sub, fontSize = 12.sp, fontFamily = Mono,
                modifier = Modifier.align(Alignment.BottomStart).padding(12.dp),
            )
        }

        when {
            b.dead -> GameOverPanel(repo, g)
            !b.hatched -> HatchPanel(repo, g, eggTaps, go)
            else -> {
                ActionRow(repo, hub, g, go)
                Spacer(Modifier.height(10.dp))
                Panel(Modifier.padding(horizontal = 12.dp), title = "Vitals") {
                    val s = b.stats
                    StatBar("Fullness", "🍔", s.fullness, Pal.amber)
                    StatBar("Happiness", "😊", s.happiness, Pal.pink)
                    StatBar("Energy", "⚡", s.energy, Pal.sky)
                    StatBar("Hygiene", "🫧", s.hygiene, Pal.mint)
                    StatBar("Health", "❤️", s.health, Pal.red)
                }
                Spacer(Modifier.height(10.dp))
                Panel(Modifier.padding(horizontal = 12.dp), title = "Traits") {
                    val s = b.stats
                    StatBar("Fitness", "💪", s.fitness, Pal.violet)
                    StatBar("Smarts", "🧠", s.smarts, Pal.sky)
                    StatBar("Social", "🤝", s.social, Pal.pink)
                    StatBar("Discipline", "🎖️", s.discipline, Pal.amber)
                    Spacer(Modifier.height(4.dp))
                    Text("${b.personality.label}: ${b.personality.blurb}", color = Pal.sub, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun XpBar(xp: Int, need: Int, modifier: Modifier = Modifier) {
    val f = (xp.toFloat() / need).coerceIn(0f, 1f)
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text("XP", color = Pal.amber, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(24.dp))
        Box(Modifier.weight(1f).height(6.dp).clip(RoundedCornerShape(3.dp)).background(Pal.panel2)) {
            Box(Modifier.fillMaxWidth(f).height(6.dp).clip(RoundedCornerShape(3.dp)).background(Pal.amber))
        }
        Text(" $xp/$need", color = Pal.sub, fontSize = 11.sp, fontFamily = Mono)
    }
}

@Composable
fun SpeechBubble(text: String) {
    Text(
        text,
        color = Pal.bg,
        fontSize = 15.sp,
        fontWeight = FontWeight.SemiBold,
        textAlign = TextAlign.Center,
        modifier = Modifier
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFFF4FFF9))
            .padding(horizontal = 14.dp, vertical = 9.dp)
    )
}

@Composable
fun RoomBackdrop(modifier: Modifier, night: Boolean, asleep: Boolean) {
    androidx.compose.foundation.Canvas(modifier) {
        val top = if (night || asleep) Color(0xFF0A0F1F) else Color(0xFF12233D)
        val bottom = if (night || asleep) Color(0xFF111A30) else Color(0xFF1B3354)
        drawRect(androidx.compose.ui.graphics.Brush.verticalGradient(listOf(top, bottom)))
        // Radar grid floor
        val floorY = size.height * 0.8f
        drawRect(Color(0xFF0E1A2E), Offset(0f, floorY), androidx.compose.ui.geometry.Size(size.width, size.height - floorY))
        for (i in 0..10) {
            val x = size.width * i / 10f
            drawLine(Pal.mint.copy(alpha = 0.10f), Offset(size.width / 2 + (x - size.width / 2) * 0.4f, floorY), Offset(x, size.height), 1.5f)
        }
        for (j in 1..3) {
            val y = floorY + (size.height - floorY) * (j / 3.5f)
            drawLine(Pal.mint.copy(alpha = 0.08f), Offset(0f, y), Offset(size.width, y), 1.5f)
        }
        if (night || asleep) {
            val r = kotlin.random.Random(7)
            repeat(40) { drawCircle(Color.White.copy(alpha = 0.2f + r.nextFloat() * 0.5f), 1f + r.nextFloat() * 1.6f, Offset(r.nextFloat() * size.width, r.nextFloat() * floorY * 0.8f)) }
            drawCircle(Color(0xFFFFF3C4), 18f, Offset(size.width * 0.85f, size.height * 0.15f))
            drawCircle(top, 16f, Offset(size.width * 0.85f + 8f, size.height * 0.15f - 4f))
        }
    }
}

private data class Act(val icon: String, val label: String, val onClick: () -> Unit)

@Composable
private fun ActionRow(repo: GameRepository, hub: SensorHub, g: GameData, go: (Screen) -> Unit) {
    val b = g.buddy
    val darkRoom = hub.body.readings.value.lux in 0f..5f
    val actions = buildList {
        add(Act("🍔", "Feed") { go(Screen.SCAN) })
        add(Act("🥣", "Kibble ${g.inventory["kibble"] ?: 0}") { repo.act { n -> useItem("kibble", n) } })
        add(Act("🎮", "Play") { go(Screen.GAMES) })
        add(Act("🧽", if (b.poops > 0) "Clean ${b.poops}💩" else "Bathe") { repo.act { n -> clean(n) } })
        add(Act(if (b.asleep) "☀️" else "🌙", if (b.asleep) "Wake" else "Sleep") { repo.act { n -> toggleSleep(n, darkRoom) } })
        if (b.sick) add(Act("💊", "Medicine") { repo.act { n -> medicine(n) } })
        if (b.tantrum) add(Act("☝️", "Scold") { repo.act { n -> scold(n) } })
        add(Act("👏", "Praise") { repo.act { n -> praise(n) } })
        add(Act("💬", "Talk") { go(Screen.CHAT) })
        add(Act("📡", "Radar") { go(Screen.RADAR) })
    }
    Column(Modifier.padding(horizontal = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        actions.chunked(4).forEach { row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (icon, label, onClick) ->
                    Column(
                        Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Pal.panel)
                            .border(1.dp, Pal.line, RoundedCornerShape(14.dp))
                            .clickable { hub.haptics.buzz(10, 50); onClick() }
                            .padding(vertical = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(icon, fontSize = 22.sp)
                        Text(label, color = Pal.text, fontSize = 11.sp, maxLines = 1)
                    }
                }
                repeat(4 - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
private fun HatchPanel(repo: GameRepository, g: GameData, taps: Int, go: (Screen) -> Unit) {
    var name by remember { mutableStateOf(g.buddy.name) }
    var sex by remember { mutableStateOf(g.buddy.sex) }
    val named = g.buddy.name.isNotBlank()
    Panel(Modifier.padding(horizontal = 12.dp), title = if (named) "Hatch ${g.buddy.name}" else "A new egg!") {
        if (!named) {
            Text("Every Blipling is unique: color, pattern and personality are rolled when the egg is laid.", color = Pal.sub, fontSize = 13.sp)
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = name, onValueChange = { name = it.take(16) }, label = { Text("Name") }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Pal.mint, unfocusedBorderColor = Pal.line),
            )
            Spacer(Modifier.height(10.dp))
            Text("Sex", color = Pal.sub, fontSize = 12.sp)
            Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                (Sex.entries.map { it to "${it.symbol} ${it.label}" } + (null to "🎲 Random")).forEach { (opt, label) ->
                    val sel = opt == sex && opt != null
                    Text(
                        label, color = if (sel) Pal.bg else Pal.text, fontSize = 13.sp,
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .background(if (sel) Pal.mint else Pal.panel2)
                            .clickable { sex = opt ?: Sex.entries.random() }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
            Text("Name ideas: " + listOf("Blip", "Pixel", "Sprocket", "Nova", "Byte", "Mochi", "Gizmo", "Pip", "Zuzu", "Static", "Waffle", "Echo").shuffled().take(4).joinToString(), color = Pal.sub, fontSize = 12.sp)
            Spacer(Modifier.height(10.dp))
            Button(
                onClick = {
                    val n = name.trim().ifBlank { listOf("Blip", "Pixel", "Nova", "Byte").random() }
                    repo.act { _ -> this.g.buddy.name = n; this.g.buddy.sex = sex; emptyList() }
                    repo.say("*the egg wiggles at the sound of \"$n\"*", Anim.SHOCK)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Pal.mint, contentColor = Pal.bg),
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Name the egg", fontWeight = FontWeight.Bold) }
        } else {
            Text("Warm the egg by tapping it (${taps}/7), or scan any barcode or QR code to hatch it instantly with a first meal!", color = Pal.text, fontSize = 14.sp)
            Spacer(Modifier.height(10.dp))
            Button(onClick = { go(Screen.SCAN) }, colors = ButtonDefaults.buttonColors(containerColor = Pal.amber, contentColor = Pal.bg), modifier = Modifier.fillMaxWidth()) {
                Text("📷  Scan to hatch", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun GameOverPanel(repo: GameRepository, g: GameData) {
    val m = g.graveyard.firstOrNull()
    Panel(Modifier.padding(horizontal = 12.dp), title = "Rest in pixels") {
        Text("🪦 ${m?.name ?: g.buddy.name}", color = Pal.text, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        if (m != null) Text("Level ${m.level} · ${m.ageYears} years · gen ${m.generation} · ${m.cause}", color = Pal.sub, fontSize = 13.sp)
        Spacer(Modifier.height(8.dp))
        Text("All lives are used up. Your achievements, coins and items carry over to the next generation.", color = Pal.sub, fontSize = 13.sp)
        Spacer(Modifier.height(10.dp))
        Button(
            onClick = { repo.act { n -> startNextGeneration(n); emptyList() }; repo.say("*a new egg appears*") },
            colors = ButtonDefaults.buttonColors(containerColor = Pal.mint, contentColor = Pal.bg), modifier = Modifier.fillMaxWidth(),
        ) { Text("🥚  Start the next generation", fontWeight = FontWeight.Bold) }
    }
}

/** Little helper used by several screens. */
@Composable
fun BigButton(text: String, color: Color = Pal.mint, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(
        modifier
            .clip(RoundedCornerShape(14.dp))
            .background(color)
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 16.dp),
        contentAlignment = Alignment.Center,
    ) { Text(text, color = Pal.bg, fontWeight = FontWeight.Bold) }
}

val Stage.emoji get() = when (this) { Stage.EGG -> "🥚"; Stage.BABY -> "🍼"; Stage.CHILD -> "🧒"; Stage.TEEN -> "🛹"; Stage.ADULT -> "🧑"; Stage.ELDER -> "🧓" }
