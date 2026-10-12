package com.realcak3d.blipling.ui

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.realcak3d.blipling.core.FoodFactory
import com.realcak3d.blipling.core.Phrases
import com.realcak3d.blipling.core.RadarTracker
import com.realcak3d.blipling.core.SignalInfo
import com.realcak3d.blipling.core.SignalKind
import com.realcak3d.blipling.core.Topic
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.SensorHub
import kotlinx.coroutines.delay
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.log10
import kotlin.math.min
import kotlin.math.sin

@Composable
fun RadarScreen(repo: GameRepository, hub: SensorHub) {
    var mode by rememberSaveable { mutableStateOf("bt") }
    val wifi by hub.wifi.results.collectAsStateWithLifecycle()
    val bt by hub.bt.devices.collectAsStateWithLifecycle()
    val wifiStatus by hub.wifi.status.collectAsStateWithLifecycle()
    val btStatus by hub.bt.status.collectAsStateWithLifecycle()
    val body by hub.body.readings.collectAsStateWithLifecycle()
    val signals = if (mode == "bt") bt else wifi
    var targetId by rememberSaveable { mutableStateOf<String?>(null) }
    val tracker = remember { RadarTracker() }
    // Default to the nearest signal, and follow it until the user picks another.
    val target: SignalInfo? = signals.firstOrNull { it.id == targetId } ?: signals.firstOrNull()
    if (tracker.targetId != target?.id) tracker.reset(target?.id)

    val headingNow by rememberUpdatedState(body.heading)
    val targetNow by rememberUpdatedState(target)
    var hint by remember { mutableStateOf("Hold the phone flat and turn slowly in a full circle.") }
    var lastPing by remember { mutableLongStateOf(0L) }

    // Sample RSSI against compass heading while sweeping.
    LaunchedEffect(target?.id, target?.rssi, mode) {
        val tg = targetNow ?: return@LaunchedEffect
        tracker.add(headingNow, tg.rssi)
    }
    // Pulse: ping + vibration faster as the signal gets stronger, harder when facing it.
    LaunchedEffect(mode) {
        var lastTrend = 0
        while (true) {
            val tg = targetNow
            if (tg == null) { delay(500); continue }
            if (mode == "bt") tracker.add(headingNow, tg.rssi)
            val st = RadarTracker.strength(tg.rssi)
            val bearing = tracker.bearing()
            val facing = bearing != null && RadarTracker.facing(headingNow, bearing)
            val boost = if (facing) 1f else 0.55f
            hub.haptics.ping((st * boost).coerceIn(0.05f, 1f))
            lastPing = System.currentTimeMillis()
            val trend = tracker.trend()
            if (trend != 0 && trend != lastTrend) {
                hint = Phrases.say(if (trend > 0) Topic.RADAR_HOT else Topic.RADAR_COLD, repo.engine.ctx(System.currentTimeMillis()))
            }
            lastTrend = trend
            if (tg.rssi > -42) {
                val ev = repo.act { n -> onRadarLock(tg, n) }
                if (ev.isNotEmpty()) hint = "🎯 LOCKED ON to ${tg.name.ifBlank { "the signal" }}!"
            }
            delay((1400 - st * 1250).toLong().coerceIn(120, 1400))
        }
    }

    Column(Modifier.fillMaxSize()) {
        ScreenTitle("Radar", "Find the nearest signal — the buddy's antenna sniffs it out")
        Row(Modifier.padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("bt" to "🔵 Bluetooth (${bt.size})", "wifi" to "📶 Wi-Fi (${wifi.size})").forEach { (m, label) ->
                Text(
                    label, color = if (mode == m) Pal.bg else Pal.text, fontWeight = FontWeight.Bold, fontSize = 13.sp,
                    modifier = Modifier.clip(RoundedCornerShape(50)).background(if (mode == m) Pal.mint else Pal.panel2)
                        .clickable { mode = m; targetId = null }.padding(horizontal = 14.dp, vertical = 8.dp)
                )
            }
        }
        Text(if (mode == "bt") btStatus else wifiStatus, color = Pal.sub, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))

        Box(Modifier.fillMaxWidth().padding(horizontal = 12.dp).aspectRatio(1f)) {
            RadarCanvas(signals, target, tracker, body.heading, lastPing, Modifier.fillMaxSize())
        }
        // Target readout
        Panel(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            if (target == null) {
                Text("No signals yet. Make sure Bluetooth / Wi-Fi and Location are on, and permissions are granted (More → Settings).", color = Pal.sub, fontSize = 13.sp)
            } else {
                val bearing = tracker.bearing()
                val dist = RadarTracker.distanceMeters(target.rssi, target.kind)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(target.name.ifBlank { "(unnamed)" }, color = Pal.text, fontWeight = FontWeight.Bold, fontSize = 16.sp, maxLines = 1)
                        Text("${target.rssi} dBm · ~${"%.1f".format(dist)} m${if (target.frequencyMhz > 0) " · ${target.frequencyMhz} MHz" else ""}", color = Pal.sub, fontSize = 12.sp, fontFamily = Mono)
                        Text(
                            if (bearing == null) "Sweep: ${(tracker.coverage() * 100).toInt()}% of the circle"
                            else "Best guess: ${bearing.toInt()}° ${compassName(bearing)} · confidence ${(tracker.confidence() * 100).toInt()}%",
                            color = Pal.amber, fontSize = 12.sp,
                        )
                    }
                    SignalBars(target.rssi)
                }
                Spacer(Modifier.height(6.dp))
                Text(hint, color = Pal.mint, fontSize = 13.sp)
            }
        }
        LazyColumn(Modifier.fillMaxWidth().weight(1f).padding(horizontal = 12.dp)) {
            items(signals.take(60), key = { it.id }) { s ->
                val sel = s.id == target?.id
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 3.dp).clip(RoundedCornerShape(12.dp))
                        .background(if (sel) Pal.mint.copy(alpha = 0.15f) else Pal.panel)
                        .clickable { targetId = s.id }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(if (s.kind == SignalKind.WIFI) (if (s.secured) "🔒" else "🔓") else "🔵", modifier = Modifier.width(28.dp))
                    Column(Modifier.weight(1f)) {
                        Text(s.name.ifBlank { "(hidden)" }, color = Pal.text, fontSize = 14.sp, maxLines = 1)
                        Text(s.id, color = Pal.sub, fontSize = 10.sp, fontFamily = Mono)
                    }
                    Text("${s.rssi}", color = Pal.text, fontFamily = Mono, fontSize = 13.sp)
                    Spacer(Modifier.width(8.dp))
                    SignalBars(s.rssi)
                }
            }
        }
    }
}

fun compassName(deg: Float): String = listOf("N", "NE", "E", "SE", "S", "SW", "W", "NW")[(((deg + 22.5f) % 360f) / 45f).toInt().coerceIn(0, 7)]

@Composable
fun SignalBars(rssi: Int) {
    val lvl = when { rssi > -50 -> 4; rssi > -62 -> 3; rssi > -74 -> 2; rssi > -86 -> 1; else -> 0 }
    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        for (i in 1..4) Box(Modifier.width(5.dp).height((5 + i * 4).dp).clip(RoundedCornerShape(2.dp)).background(if (i <= lvl) Pal.mint else Pal.line))
    }
}

@Composable
private fun RadarCanvas(signals: List<SignalInfo>, target: SignalInfo?, tracker: RadarTracker, heading: Float, lastPing: Long, modifier: Modifier) {
    var frame by remember { mutableLongStateOf(0L) }
    LaunchedEffect(Unit) { while (true) withFrameMillis { frame = System.currentTimeMillis() } }
    val label = remember { Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER; typeface = Typeface.MONOSPACE } }
    Canvas(modifier) {
        val now = frame
        val c = Offset(size.width / 2, size.height / 2)
        val r = min(size.width, size.height) / 2 * 0.96f
        drawCircle(Brush.radialGradient(listOf(Color(0xFF0F2A24), Color(0xFF07130F)), c, r), r, c)
        for (k in 1..4) drawCircle(Pal.mint.copy(alpha = 0.18f), r * k / 4f, c, style = Stroke(1.5f))
        drawLine(Pal.mint.copy(alpha = 0.12f), Offset(c.x - r, c.y), Offset(c.x + r, c.y), 1.5f)
        drawLine(Pal.mint.copy(alpha = 0.12f), Offset(c.x, c.y - r), Offset(c.x, c.y + r), 1.5f)

        // Compass labels rotate against the phone heading so north stays north.
        label.textSize = r * 0.08f
        for ((i, name) in listOf("N", "E", "S", "W").withIndex()) {
            val a = Math.toRadians((i * 90f - heading - 90f).toDouble())
            label.color = (if (name == "N") Pal.red else Pal.mint).toArgb()
            drawContext.canvas.nativeCanvas.drawText(name, c.x + cos(a).toFloat() * r * 0.9f, c.y + sin(a).toFloat() * r * 0.9f + label.textSize / 3, label)
        }

        // Sweep
        val sweep = (now % 3000L) / 3000f * 360f
        rotate(sweep, c) {
            drawArc(Brush.sweepGradient(listOf(Color.Transparent, Pal.mint.copy(alpha = 0.0f), Pal.mint.copy(alpha = 0.35f)), c), -60f, 60f, true, Offset(c.x - r, c.y - r), androidx.compose.ui.geometry.Size(r * 2, r * 2))
            drawLine(Pal.mint.copy(alpha = 0.7f), c, Offset(c.x + r, c.y), 2f)
        }

        // Ping ripple from the last pulse
        val since = (now - lastPing).coerceAtLeast(0)
        if (since < 900) {
            val f = since / 900f
            drawCircle(Pal.amber.copy(alpha = (1 - f) * 0.6f), r * (0.08f + f * 0.9f), c, style = Stroke(3f))
        }

        fun radiusFor(s: SignalInfo): Float {
            val d = RadarTracker.distanceMeters(s.rssi, s.kind)
            return (log10(d + 1) / log10(51.0)).toFloat().coerceIn(0.05f, 1f) * r * 0.92f
        }

        // Other signals: we only know distance, so they orbit at a stable pseudo-angle.
        signals.take(40).forEach { s ->
            if (s.id == target?.id) return@forEach
            val ang = ((FoodFactory.hash(s.id) ushr 3) % 360).toFloat()
            val a = Math.toRadians((ang - heading - 90f).toDouble())
            val rr = radiusFor(s)
            drawCircle(Pal.sky.copy(alpha = 0.45f), r * 0.018f, Offset(c.x + cos(a).toFloat() * rr, c.y + sin(a).toFloat() * rr))
        }

        // Target
        if (target != null) {
            val rr = radiusFor(target)
            val bearing = tracker.bearing()
            val pulse = 0.5f + 0.5f * sin(now / 1000f * (4f + RadarTracker.strength(target.rssi) * 14f))
            if (bearing != null) {
                val rel = bearing - heading
                val a = Math.toRadians((rel - 90f).toDouble())
                val p = Offset(c.x + cos(a).toFloat() * rr, c.y + sin(a).toFloat() * rr)
                val conf = tracker.confidence().coerceIn(0.2f, 1f)
                // Uncertainty wedge
                drawArc(Pal.amber.copy(alpha = 0.10f + 0.12f * conf), rel - 90f - (60f - conf * 45f), (120f - conf * 90f), true, Offset(c.x - r, c.y - r), androidx.compose.ui.geometry.Size(r * 2, r * 2))
                drawCircle(Pal.amber.copy(alpha = 0.35f * pulse), r * (0.05f + 0.04f * pulse), p)
                drawCircle(Pal.amber, r * 0.03f, p)
                // Direction arrow from the center
                val tip = Offset(c.x + cos(a).toFloat() * r * 0.28f, c.y + sin(a).toFloat() * r * 0.28f)
                drawLine(Pal.amber, c, tip, 6f, StrokeCap.Round)
                val head = Path().apply {
                    val ah = Math.toRadians((rel - 90f + 150f).toDouble()); val ah2 = Math.toRadians((rel - 90f - 150f).toDouble())
                    moveTo(tip.x + cos(a).toFloat() * r * 0.05f, tip.y + sin(a).toFloat() * r * 0.05f)
                    lineTo(tip.x + cos(ah).toFloat() * r * 0.06f, tip.y + sin(ah).toFloat() * r * 0.06f)
                    lineTo(tip.x + cos(ah2).toFloat() * r * 0.06f, tip.y + sin(ah2).toFloat() * r * 0.06f)
                    close()
                }
                drawPath(head, Pal.amber)
            } else {
                // Unknown direction yet: a pulsing ring at the estimated distance.
                drawCircle(Pal.amber.copy(alpha = 0.25f + 0.35f * pulse), rr, c, style = Stroke(3f + 4f * pulse))
            }
            label.color = Pal.text.toArgb(); label.textSize = r * 0.065f
            drawContext.canvas.nativeCanvas.drawText("${target.rssi} dBm", c.x, c.y + r * 0.5f, label)
        }
        // Phone direction marker
        val tri = Path().apply { moveTo(c.x, c.y - r * 0.08f); lineTo(c.x - r * 0.04f, c.y + r * 0.03f); lineTo(c.x + r * 0.04f, c.y + r * 0.03f); close() }
        drawPath(tri, Pal.mint)
    }
}
