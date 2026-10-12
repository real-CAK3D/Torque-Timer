package com.realcak3d.blipling.ui

import android.graphics.Paint
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.background
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.realcak3d.blipling.core.C
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.SensorHub
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

val constellationColors = mapOf(
    "GPS" to Color(0xFF4FC3F7), "GLONASS" to Color(0xFFFF6FA5), "Galileo" to Color(0xFFFFD54F), "BeiDou" to Color(0xFFFF8A65),
    "QZSS" to Color(0xFFB388FF), "SBAS" to Color(0xFF90A4AE), "NavIC" to Color(0xFF2EE6A6), "Unknown" to Color.White,
)

@Composable
fun SkyScreen(repo: GameRepository, hub: SensorHub) {
    val g by rememberGame(repo)
    val sats by hub.gnss.satellites.collectAsStateWithLifecycle()
    val loc by hub.gnss.location.collectAsStateWithLifecycle()
    val status by hub.gnss.status.collectAsStateWithLifecycle()
    val body by hub.body.readings.collectAsStateWithLifecycle()
    val paint = remember { Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER } }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        ScreenTitle("Sky", "Satellites your buddy can see right now. Go outside for more!")
        Text(status, color = Pal.sub, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp))
        Box(Modifier.fillMaxWidth().padding(12.dp).aspectRatio(1f)) {
            Canvas(Modifier.fillMaxSize()) {
                val c = Offset(size.width / 2, size.height / 2)
                val r = min(size.width, size.height) / 2 * 0.95f
                drawCircle(Brush.radialGradient(listOf(Color(0xFF14204A), Color(0xFF060A18)), c, r), r, c)
                for (el in listOf(0, 30, 60)) drawCircle(Color.White.copy(alpha = 0.12f), r * (90 - el) / 90f, c, style = Stroke(1.5f))
                paint.textSize = r * 0.07f
                for ((i, n) in listOf("N", "E", "S", "W").withIndex()) {
                    val a = Math.toRadians((i * 90f - body.heading - 90f).toDouble())
                    paint.color = (if (n == "N") Pal.red else Color.White.copy(alpha = 0.6f)).toArgb()
                    drawContext.canvas.nativeCanvas.drawText(n, c.x + cos(a).toFloat() * r * 0.92f, c.y + sin(a).toFloat() * r * 0.92f + paint.textSize / 3, paint)
                }
                sats.forEach { s ->
                    val rr = r * (90f - s.elevation.coerceIn(0f, 90f)) / 90f
                    val a = Math.toRadians((s.azimuth - body.heading - 90f).toDouble())
                    val p = Offset(c.x + cos(a).toFloat() * rr, c.y + sin(a).toFloat() * rr)
                    val col = constellationColors[s.constellation] ?: Color.White
                    val rad = r * (0.02f + (s.cn0 / 50f).coerceIn(0f, 1f) * 0.025f)
                    drawCircle(col.copy(alpha = 0.25f), rad * 2.2f, p)
                    if (s.usedInFix) drawCircle(col, rad, p) else drawCircle(col, rad, p, style = Stroke(3f))
                    paint.color = Color.White.copy(alpha = 0.7f).toArgb(); paint.textSize = r * 0.045f
                    drawContext.canvas.nativeCanvas.drawText("${s.svid}", p.x, p.y - rad * 1.6f, paint)
                }
            }
        }
        Panel(Modifier.padding(horizontal = 12.dp), title = "In view") {
            val by = sats.groupBy { it.constellation }
            if (by.isEmpty()) Text("Nothing yet. GPS needs a view of the sky, and it can take a minute.", color = Pal.sub, fontSize = 13.sp)
            by.entries.sortedByDescending { it.value.size }.forEach { (name, list) ->
                Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(10.dp).clip(CircleShape).background(constellationColors[name] ?: Color.White))
                    Text("  $name", color = Pal.text, fontSize = 14.sp, modifier = Modifier.weight(1f))
                    Text("${list.size} seen · ${list.count { it.usedInFix }} locked · best ${list.maxOf { it.cn0 }.toInt()} dB-Hz", color = Pal.sub, fontSize = 12.sp, fontFamily = Mono)
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Position") {
            val l = loc
            if (l == null) Text("Waiting for a fix…", color = Pal.sub, fontSize = 13.sp) else {
                KeyValue("Latitude", "%.5f".format(l.latitude))
                KeyValue("Longitude", "%.5f".format(l.longitude))
                if (l.hasAltitude()) KeyValue("Altitude", "%.0f m".format(l.altitude))
                KeyValue("Accuracy", "±%.0f m".format(l.accuracy))
                if (l.hasSpeed()) KeyValue("Speed", "%.1f km/h".format(l.speed * 3.6f))
            }
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Space log") {
            KeyValue("Most satellites at once", "${g.count(C.SATS_MAX)}")
            KeyValue("Stargazing sessions", "${g.count(C.STARGAZES)}")
            KeyValue("Systems met", g.constellations.sorted().joinToString().ifBlank { "none yet" })
            KeyValue("Highest altitude", "${g.count(C.ALTITUDE_MAX)} m")
        }
        Spacer(Modifier.height(16.dp))
    }
}
