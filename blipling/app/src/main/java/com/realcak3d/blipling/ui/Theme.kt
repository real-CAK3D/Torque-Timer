package com.realcak3d.blipling.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object Pal {
    val bg = Color(0xFF0B1220)
    val panel = Color(0xFF131D30)
    val panel2 = Color(0xFF1A2740)
    val line = Color(0xFF26385A)
    val mint = Color(0xFF2EE6A6)
    val mintDim = Color(0xFF1B8F69)
    val amber = Color(0xFFFFD54F)
    val pink = Color(0xFFFF6FA5)
    val sky = Color(0xFF4FC3F7)
    val violet = Color(0xFFB388FF)
    val red = Color(0xFFFF5370)
    val text = Color(0xFFE6F1FF)
    val sub = Color(0xFF8DA2C0)
}

private val scheme = darkColorScheme(
    primary = Pal.mint, onPrimary = Pal.bg, secondary = Pal.amber, onSecondary = Pal.bg, tertiary = Pal.pink,
    background = Pal.bg, onBackground = Pal.text, surface = Pal.panel, onSurface = Pal.text,
    surfaceVariant = Pal.panel2, onSurfaceVariant = Pal.sub, outline = Pal.line, error = Pal.red,
    surfaceContainer = Pal.panel, surfaceContainerHigh = Pal.panel2, surfaceContainerHighest = Pal.panel2,
    surfaceContainerLow = Pal.panel, surfaceContainerLowest = Pal.bg,
)

@Composable
fun BliplingTheme(content: @Composable () -> Unit) = MaterialTheme(colorScheme = scheme, content = content)

val Mono = FontFamily.Monospace

@Composable
fun Panel(modifier: Modifier = Modifier, title: String? = null, content: @Composable () -> Unit) {
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Pal.panel)
            .border(1.dp, Pal.line, RoundedCornerShape(18.dp))
            .padding(14.dp)
    ) {
        if (title != null) {
            Text(title.uppercase(), color = Pal.sub, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
            Spacer(Modifier.height(8.dp))
        }
        content()
    }
}

@Composable
fun StatBar(label: String, icon: String, value: Double, color: Color, modifier: Modifier = Modifier) {
    val v = (value / 100.0).toFloat().coerceIn(0f, 1f)
    val c = if (v < 0.2f) Pal.red else color
    Row(modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(icon, fontSize = 15.sp, modifier = Modifier.width(24.dp))
        Text(label, color = Pal.sub, fontSize = 12.sp, modifier = Modifier.width(74.dp))
        Box(
            Modifier
                .weight(1f)
                .height(10.dp)
                .clip(RoundedCornerShape(5.dp))
                .background(Pal.panel2)
        ) {
            Box(
                Modifier
                    .fillMaxWidth(v)
                    .height(10.dp)
                    .clip(RoundedCornerShape(5.dp))
                    .background(c)
            )
        }
        Text("${value.toInt()}", color = Pal.text, fontSize = 12.sp, fontFamily = Mono, modifier = Modifier.width(34.dp).padding(start = 6.dp))
    }
}

@Composable
fun Chip(text: String, color: Color = Pal.mint, modifier: Modifier = Modifier) {
    Text(
        text,
        color = color,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.14f))
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(50))
            .padding(horizontal = 9.dp, vertical = 3.dp)
    )
}

@Composable
fun KeyValue(k: String, v: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(k, color = Pal.sub, fontSize = 13.sp)
        Text(v, color = Pal.text, fontSize = 13.sp, fontFamily = Mono)
    }
}

@Composable
fun ScreenTitle(title: String, subtitle: String? = null) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
        Text(title, color = Pal.text, fontSize = 24.sp, fontWeight = FontWeight.Black)
        if (subtitle != null) Text(subtitle, color = Pal.sub, fontSize = 13.sp)
    }
}

fun hsv(h: Float, s: Float, v: Float, a: Float = 1f): Color = Color.hsv(((h % 360f) + 360f) % 360f, s.coerceIn(0f, 1f), v.coerceIn(0f, 1f), a)
