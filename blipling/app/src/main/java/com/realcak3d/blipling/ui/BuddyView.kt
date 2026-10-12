package com.realcak3d.blipling.ui

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import com.realcak3d.blipling.core.Anim
import com.realcak3d.blipling.core.Pattern
import com.realcak3d.blipling.core.Sex
import com.realcak3d.blipling.core.Stage
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

data class BuddyLook(
    val hue: Float = 160f,
    val stage: Stage = Stage.ADULT,
    val pattern: Pattern = Pattern.PLAIN,
    val sex: Sex = Sex.MYSTERY,
    val accessory: String? = null,
    val asleep: Boolean = false,
    val sick: Boolean = false,
    val poops: Int = 0,
    val dirty: Boolean = false,
    val happiness: Double = 70.0,
    val weight: Double = 12.0,
    val tantrum: Boolean = false,
    val seed: Long = 0L,
    val dead: Boolean = false,
)

private const val ANIM_MS = 1800L

/**
 * The buddy, drawn entirely with vector shapes so it scales to any screen and recolors freely.
 * [lookAt] is -1..1 in both axes and steers the pupils (from tilt or touch).
 */
@Composable
fun BuddyView(
    look: BuddyLook,
    anim: Anim,
    animAt: Long,
    modifier: Modifier = Modifier,
    lookAt: Offset = Offset.Zero,
    antennaGlow: Float = 0.3f,
    eggCracks: Int = 0,
    onTap: (Offset) -> Unit = {},
) {
    var frame by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            androidx.compose.runtime.withFrameMillis { frame = System.currentTimeMillis() }
        }
    }
    val tap by rememberUpdatedState(onTap)
    val blink = remember { BlinkClock() }
    val textPaint = remember { Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface = Typeface.DEFAULT_BOLD; textAlign = Paint.Align.CENTER } }

    Canvas(
        modifier.pointerInput(Unit) { detectTapGestures { tap(it) } }
    ) {
        val now = frame
        val t = (now % 600_000L) / 1000f
        val since = now - animAt
        val active = if (since in 0..ANIM_MS) anim else Anim.NONE
        val p = (since.toFloat() / ANIM_MS).coerceIn(0f, 1f)
        if (look.stage == Stage.EGG) {
            drawEgg(look, t, eggCracks, active, p)
        } else {
            drawBuddy(look, t, active, p, lookAt, blink.closedAmount(now), antennaGlow, textPaint)
        }
    }
}

/** Random natural blinking, every 2-6 s. */
private class BlinkClock {
    private var next = System.currentTimeMillis() + 2500
    private var start = 0L
    fun closedAmount(now: Long): Float {
        if (now >= next) { start = now; next = now + 2000 + Random.nextLong(4000) }
        val d = now - start
        return if (d in 0..140) (1f - abs(d - 70) / 70f) else 0f
    }
}

private fun DrawScope.drawEgg(look: BuddyLook, t: Float, cracks: Int, anim: Anim, p: Float) {
    val u = min(size.width, size.height) / 100f
    val cx = size.width / 2; val cy = size.height * 0.56f
    val wobble = (if ((t % 4f) < 0.6f) sin(t * 30f) * 7f else 0f) + (if (anim != Anim.NONE) sin(p * 40f) * 10f * (1 - p) else 0f)
    drawOval(Color.Black.copy(alpha = 0.25f), Offset(cx - 22 * u, cy + 26 * u), Size(44 * u, 8 * u))
    rotate(wobble, Offset(cx, cy + 28 * u)) {
        val w = 44 * u; val h = 56 * u
        val egg = Path().apply {
            moveTo(cx, cy - h / 2)
            cubicTo(cx + w * 0.42f, cy - h / 2, cx + w / 2, cy + h * 0.05f, cx + w / 2, cy + h * 0.15f)
            cubicTo(cx + w / 2, cy + h * 0.42f, cx + w * 0.28f, cy + h / 2, cx, cy + h / 2)
            cubicTo(cx - w * 0.28f, cy + h / 2, cx - w / 2, cy + h * 0.42f, cx - w / 2, cy + h * 0.15f)
            cubicTo(cx - w / 2, cy + h * 0.05f, cx - w * 0.42f, cy - h / 2, cx, cy - h / 2)
            close()
        }
        drawPath(egg, Brush.radialGradient(listOf(Color(0xFFFFFBEF), Color(0xFFF1E3C4), Color(0xFFCDB894)), Offset(cx - w * 0.15f, cy - h * 0.2f), w * 0.9f))
        clipPath(egg) {
            val r = Random(look.seed)
            repeat(7) {
                val sx = cx + (r.nextFloat() - 0.5f) * w; val sy = cy + (r.nextFloat() - 0.5f) * h
                drawCircle(hsv(look.hue, 0.55f, 0.85f, 0.75f), (3 + r.nextFloat() * 5) * u, Offset(sx, sy))
            }
            drawOval(Color.White.copy(alpha = 0.5f), Offset(cx - w * 0.3f, cy - h * 0.38f), Size(w * 0.18f, h * 0.22f))
        }
        // Cracks appear as the egg is warmed.
        val crack = Color(0xFF5D4A2E)
        val pts = listOf(Offset(-0.35f, -0.05f), Offset(-0.22f, 0.04f), Offset(-0.1f, -0.06f), Offset(0.02f, 0.05f), Offset(0.14f, -0.05f), Offset(0.26f, 0.04f), Offset(0.36f, -0.04f))
        val segs = cracks.coerceIn(0, pts.size - 1)
        for (i in 0 until segs) {
            drawLine(crack, Offset(cx + pts[i].x * w, cy + pts[i].y * h), Offset(cx + pts[i + 1].x * w, cy + pts[i + 1].y * h), 2.2f * u / 2, StrokeCap.Round)
        }
        drawPath(egg, Color(0xFF8C7650), style = Stroke(1.2f * u))
    }
}

private fun DrawScope.drawBuddy(
    look: BuddyLook, t: Float, anim: Anim, p: Float, lookAt: Offset, blink: Float, antennaGlow: Float, textPaint: Paint,
) {
    val u = min(size.width, size.height) / 100f
    val s = look.stage.scale
    val fat = (0.88f + ((look.weight - 8.0) / 40.0).toFloat().coerceIn(0f, 0.4f))
    val hue = if (look.hue < 0) (t * 25f) % 360f else look.hue
    val elder = look.stage == Stage.ELDER
    val sat = if (elder) 0.38f else if (look.dead) 0.05f else 0.62f
    val base = hsv(hue, sat, 0.88f)
    val light = hsv(hue, sat * 0.45f, 1f)
    val dark = hsv(hue, sat * 1.1f, 0.55f)

    // Motion: idle bob, plus reaction-specific moves.
    val breathe = sin(t * 2.2f) * 0.025f
    var bob = sin(t * 2.2f) * 1.2f * u
    var squashX = 1f + breathe; var squashY = 1f - breathe; var tilt = 0f
    when (anim) {
        Anim.HAPPY, Anim.LEVEL_UP, Anim.HATCH -> { val j = abs(sin(p * PI.toFloat() * 3)) * (1 - p); bob -= j * 14 * u; squashY += j * 0.08f; squashX -= j * 0.06f }
        Anim.EAT -> { squashX += sin(p * 50f) * 0.04f; squashY -= sin(p * 50f) * 0.04f }
        Anim.DANCE -> { tilt = sin(t * 9f) * 12f; bob -= abs(sin(t * 9f)) * 6 * u }
        Anim.DIZZY -> tilt = sin(t * 6f) * 14f
        Anim.SHOCK -> { squashY += 0.12f * (1 - p); squashX -= 0.08f * (1 - p); bob -= 6 * u * (1 - p) }
        Anim.ANGRY -> { tilt = sin(t * 30f) * 3f }
        Anim.SAD -> { squashY -= 0.05f; bob += 2 * u }
        Anim.LOVE -> { squashX += sin(t * 8f) * 0.02f }
        else -> {}
    }
    if (look.tantrum && anim == Anim.NONE) tilt = sin(t * 18f) * 4f
    if (look.asleep) { bob = sin(t * 1.2f) * 0.8f * u; squashY = 0.94f + sin(t * 1.2f) * 0.02f; squashX = 1.04f }

    val bw = 50 * u * s * fat * squashX
    val bh = 46 * u * s * squashY
    val cx = size.width / 2
    val ground = size.height * 0.80f
    val cy = ground - bh / 2 - 4 * u * s + bob

    // Shadow
    val shadowW = bw * (1.0f - (-bob / (40 * u)).coerceIn(0f, 0.4f))
    drawOval(Color.Black.copy(alpha = 0.28f), Offset(cx - shadowW / 2, ground - 2 * u), Size(shadowW, 6 * u))

    // Poops on the floor
    for (i in 0 until look.poops.coerceAtMost(4)) {
        val px = if (i % 2 == 0) cx - bw * 0.9f - i * 5 * u else cx + bw * 0.9f + i * 5 * u
        drawPoop(Offset(px, ground), u)
    }

    rotate(tilt, Offset(cx, ground)) {
        // Feet
        val step = if (anim == Anim.DANCE) sin(t * 9f) * 3 * u else 0f
        drawOval(dark, Offset(cx - bw * 0.36f, cy + bh * 0.38f - step), Size(bw * 0.26f, bh * 0.16f))
        drawOval(dark, Offset(cx + bw * 0.10f, cy + bh * 0.38f + step), Size(bw * 0.26f, bh * 0.16f))

        // Antenna (behind the head top)
        val sway = sin(t * 1.7f) * 6f + if (anim == Anim.SHOCK) sin(p * 40f) * 20f * (1 - p) else 0f
        val ax = cx; val ay = cy - bh * 0.46f
        val tip = Offset(ax + sin(sway * PI.toFloat() / 180f) * 16 * u * s + 4 * u * s, ay - 15 * u * s)
        val stalk = Path().apply { moveTo(ax, ay); quadraticTo(ax - 3 * u * s, ay - 9 * u * s, tip.x, tip.y) }
        drawPath(stalk, dark, style = Stroke(2.2f * u * s, cap = StrokeCap.Round))
        val pulse = 0.5f + 0.5f * sin(t * (3f + antennaGlow * 9f))
        val glowC = if (look.sick) Color(0xFF9CCC65) else if (look.asleep) Pal.sky else Pal.amber
        drawCircle(Brush.radialGradient(listOf(glowC.copy(alpha = 0.55f * (0.4f + antennaGlow) * pulse), Color.Transparent), tip, 9 * u * s), 9 * u * s, tip)
        drawCircle(glowC, 3.2f * u * s, tip)
        drawCircle(Color.White.copy(alpha = 0.8f), 1.1f * u * s, tip + Offset(-0.9f * u * s, -0.9f * u * s))

        // Arms
        val wave = when (anim) {
            Anim.HAPPY, Anim.LEVEL_UP, Anim.DANCE, Anim.LOVE, Anim.HATCH -> sin(t * 14f) * 35f - 40f
            Anim.SAD -> 25f
            else -> sin(t * 2.2f) * 6f
        }
        if (look.stage != Stage.BABY) {
            rotate(-wave, Offset(cx - bw * 0.46f, cy + bh * 0.05f)) {
                drawOval(base, Offset(cx - bw * 0.62f, cy - bh * 0.02f), Size(bw * 0.22f, bh * 0.14f))
            }
            rotate(wave, Offset(cx + bw * 0.46f, cy + bh * 0.05f)) {
                drawOval(base, Offset(cx + bw * 0.40f, cy - bh * 0.02f), Size(bw * 0.22f, bh * 0.14f))
            }
        }

        // Body
        val body = Path().apply {
            moveTo(cx, cy - bh / 2)
            cubicTo(cx + bw * 0.40f, cy - bh / 2, cx + bw / 2, cy - bh * 0.12f, cx + bw / 2, cy + bh * 0.14f)
            cubicTo(cx + bw / 2, cy + bh * 0.42f, cx + bw * 0.30f, cy + bh / 2, cx, cy + bh / 2)
            cubicTo(cx - bw * 0.30f, cy + bh / 2, cx - bw / 2, cy + bh * 0.42f, cx - bw / 2, cy + bh * 0.14f)
            cubicTo(cx - bw / 2, cy - bh * 0.12f, cx - bw * 0.40f, cy - bh / 2, cx, cy - bh / 2)
            close()
        }
        drawPath(body, Brush.radialGradient(listOf(light, base, dark), Offset(cx - bw * 0.18f, cy - bh * 0.28f), bw * 0.85f))
        clipPath(body) {
            val r = Random(look.seed xor 0x5EED)
            val pc = dark.copy(alpha = 0.32f)
            when (look.pattern) {
                Pattern.SPOTS -> repeat(9) {
                    drawCircle(pc, (2.5f + r.nextFloat() * 3.5f) * u * s, Offset(cx + (r.nextFloat() - 0.5f) * bw, cy + (r.nextFloat() - 0.6f) * bh))
                }
                Pattern.STRIPES -> for (i in -3..3) {
                    val y = cy - bh * 0.25f + i * 6 * u * s
                    drawLine(pc, Offset(cx - bw, y - 4 * u), Offset(cx + bw, y + 4 * u), 2.5f * u * s)
                }
                Pattern.STARS -> repeat(7) {
                    drawStar(Offset(cx + (r.nextFloat() - 0.5f) * bw, cy + (r.nextFloat() - 0.6f) * bh), 2.6f * u * s, pc)
                }
                Pattern.PLAIN -> {}
            }
            // Belly
            drawOval(light.copy(alpha = 0.75f), Offset(cx - bw * 0.27f, cy + bh * 0.06f), Size(bw * 0.54f, bh * 0.40f))
            // Rim light
            drawOval(Color.White.copy(alpha = 0.22f), Offset(cx - bw * 0.34f, cy - bh * 0.42f), Size(bw * 0.22f, bh * 0.16f))
            if (look.sick) drawRect(Color(0xFF7CB342).copy(alpha = 0.22f))
            if (look.dirty) repeat(6) {
                drawCircle(Color(0xFF6D4C41).copy(alpha = 0.35f), 1.6f * u * s, Offset(cx + (r.nextFloat() - 0.5f) * bw * 0.8f, cy + (r.nextFloat() - 0.2f) * bh * 0.5f))
            }
        }
        drawPath(body, dark.copy(alpha = 0.6f), style = Stroke(0.8f * u))

        // Face
        val baby = look.stage == Stage.BABY
        val eyeR = bw * (if (baby) 0.125f else 0.105f)
        val eyeY = cy - bh * 0.07f
        val eyeDX = bw * 0.19f
        val lx = lookAt.x.coerceIn(-1f, 1f) * eyeR * 0.32f
        val ly = lookAt.y.coerceIn(-1f, 1f) * eyeR * 0.3f
        val ink = Color(0xFF0B1220)
        for (side in listOf(-1, 1)) {
            val ex = cx + side * eyeDX
            val ec = Offset(ex, eyeY)
            when {
                look.dead -> {
                    drawLine(ink, ec + Offset(-eyeR * 0.6f, -eyeR * 0.6f), ec + Offset(eyeR * 0.6f, eyeR * 0.6f), 1.6f * u, StrokeCap.Round)
                    drawLine(ink, ec + Offset(eyeR * 0.6f, -eyeR * 0.6f), ec + Offset(-eyeR * 0.6f, eyeR * 0.6f), 1.6f * u, StrokeCap.Round)
                }
                look.asleep -> drawArc(ink, 10f, 160f, false, Offset(ex - eyeR * 0.7f, eyeY - eyeR * 0.6f), Size(eyeR * 1.4f, eyeR * 1.0f), style = Stroke(1.5f * u, cap = StrokeCap.Round))
                anim == Anim.DIZZY -> drawSpiral(ec, eyeR * 0.85f, ink, u, t * 8f * side)
                anim == Anim.LOVE -> drawHeart(ec, eyeR * 1.05f, Pal.pink)
                anim == Anim.HAPPY || anim == Anim.LEVEL_UP || anim == Anim.HATCH ->
                    drawArc(ink, 200f, 140f, false, Offset(ex - eyeR * 0.75f, eyeY - eyeR * 0.3f), Size(eyeR * 1.5f, eyeR * 1.2f), style = Stroke(1.6f * u, cap = StrokeCap.Round))
                else -> {
                    val open = (1f - blink) * (if (look.sick) 0.6f else 1f)
                    if (open < 0.15f) {
                        drawLine(ink, ec + Offset(-eyeR * 0.7f, 0f), ec + Offset(eyeR * 0.7f, 0f), 1.5f * u, StrokeCap.Round)
                    } else {
                        val scaleShock = if (anim == Anim.SHOCK) 1.25f else 1f
                        val sw = eyeR * 1.7f * scaleShock; val sh = eyeR * 2.1f * open * scaleShock
                        drawOval(Color.White, Offset(ex - sw / 2, eyeY - sh / 2), Size(sw, sh))
                        val pr = eyeR * (if (anim == Anim.SHOCK) 0.42f else 0.66f)
                        val pc = Offset(ex + lx, eyeY + ly * open)
                        drawCircle(ink, pr, pc)
                        drawCircle(hsv(hue + 180f, 0.5f, 0.45f, 0.6f), pr * 0.55f, pc)
                        drawCircle(Color.White, pr * 0.32f, pc + Offset(-pr * 0.35f, -pr * 0.38f))
                        drawCircle(Color.White.copy(alpha = 0.7f), pr * 0.14f, pc + Offset(pr * 0.35f, pr * 0.3f))
                        if (look.sick) drawRect(base, Offset(ex - sw / 2, eyeY - sh / 2), Size(sw, sh * 0.35f))
                    }
                    // Eyelashes
                    if (look.sex == Sex.FEMALE && open >= 0.15f) {
                        val o = ec + Offset(side * eyeR * 0.75f, -eyeR * 0.75f * open)
                        drawLine(ink, o, o + Offset(side * eyeR * 0.45f, -eyeR * 0.35f), 1.1f * u, StrokeCap.Round)
                        drawLine(ink, o + Offset(-side * eyeR * 0.3f, -eyeR * 0.15f), o + Offset(side * eyeR * 0.1f, -eyeR * 0.55f), 1.1f * u, StrokeCap.Round)
                    }
                }
            }
            // Brows
            val browY = eyeY - eyeR * 1.45f
            when {
                anim == Anim.ANGRY || look.tantrum -> drawLine(ink, Offset(ex - side * eyeR * 0.8f, browY - eyeR * 0.35f), Offset(ex + side * eyeR * 0.5f, browY + eyeR * 0.25f), 1.6f * u, StrokeCap.Round)
                anim == Anim.SAD || look.happiness < 25 -> drawLine(ink, Offset(ex - side * eyeR * 0.6f, browY + eyeR * 0.2f), Offset(ex + side * eyeR * 0.6f, browY - eyeR * 0.25f), 1.4f * u, StrokeCap.Round)
                elder -> drawLine(Color.White.copy(alpha = 0.9f), Offset(ex - eyeR * 0.75f, browY), Offset(ex + eyeR * 0.75f, browY - eyeR * 0.1f), 2.6f * u, StrokeCap.Round)
                else -> {}
            }
            // Cheeks
            drawCircle(Pal.pink.copy(alpha = if (anim == Anim.LOVE) 0.6f else 0.3f), eyeR * 0.55f, Offset(ex + side * eyeR * 1.1f, eyeY + eyeR * 1.4f))
        }

        // Hair tuft / forehead mark
        if (look.sex == Sex.MALE) {
            val hx = cx - bw * 0.06f; val hy = cy - bh * 0.48f
            for (k in -1..1) drawLine(dark, Offset(hx + k * 1.5f * u, hy + 1.5f * u), Offset(hx + k * 3f * u - 1.5f * u, hy - 4f * u * s), 1.3f * u, StrokeCap.Round)
        } else if (look.sex == Sex.MYSTERY) {
            drawStar(Offset(cx, cy - bh * 0.30f), 2.4f * u * s, Pal.amber.copy(alpha = 0.85f))
        }

        // Mouth
        val my = cy + bh * 0.13f
        val mw = bw * 0.16f
        when {
            look.dead -> drawLine(ink, Offset(cx - mw / 2, my), Offset(cx + mw / 2, my), 1.4f * u, StrokeCap.Round)
            look.asleep -> drawCircle(ink, 1.3f * u, Offset(cx, my))
            anim == Anim.EAT -> {
                val open = abs(sin(p * 28f))
                drawOval(ink, Offset(cx - mw / 2, my - mw * 0.3f * open), Size(mw, mw * 0.7f * open + 1.2f * u))
            }
            anim == Anim.SHOCK -> drawOval(ink, Offset(cx - mw * 0.25f, my - mw * 0.2f), Size(mw * 0.5f, mw * 0.65f))
            anim == Anim.SICK || look.sick -> {
                val wav = Path().apply { moveTo(cx - mw / 2, my); for (k in 1..4) { val x = cx - mw / 2 + k * mw / 4; lineTo(x, my + if (k % 2 == 0) 0f else 1.4f * u) } }
                drawPath(wav, ink, style = Stroke(1.3f * u, cap = StrokeCap.Round))
            }
            anim == Anim.SAD || anim == Anim.ANGRY || look.tantrum || look.happiness < 30 ->
                drawArc(ink, 200f, 140f, false, Offset(cx - mw / 2, my), Size(mw, mw * 0.7f), style = Stroke(1.4f * u, cap = StrokeCap.Round))
            anim == Anim.HAPPY || anim == Anim.LOVE || anim == Anim.LEVEL_UP || anim == Anim.DANCE || anim == Anim.HATCH || look.happiness > 75 -> {
                val big = Path().apply {
                    moveTo(cx - mw * 0.6f, my - mw * 0.1f)
                    quadraticTo(cx, my + mw * 0.95f, cx + mw * 0.6f, my - mw * 0.1f)
                    close()
                }
                drawPath(big, ink)
                drawOval(Pal.pink, Offset(cx - mw * 0.25f, my + mw * 0.22f), Size(mw * 0.5f, mw * 0.25f))
            }
            else -> drawArc(ink, 20f, 140f, false, Offset(cx - mw / 2, my - mw * 0.45f), Size(mw, mw * 0.7f), style = Stroke(1.4f * u, cap = StrokeCap.Round))
        }

        // Accessory
        drawAccessory(look.accessory, cx, cy - bh / 2, bw, u * s, t, eyeY, eyeDX, eyeR)
    }

    // Overlays
    if (look.asleep) {
        textPaint.color = Pal.sky.toArgb()
        for (k in 0..2) {
            val ph = ((t * 0.5f + k / 3f) % 1f)
            textPaint.textSize = (5 + k * 2) * u * (0.6f + ph * 0.6f)
            textPaint.alpha = ((1 - ph) * 255).toInt()
            drawContext.canvas.nativeCanvas.drawText("z", cx + bw * 0.45f + ph * 10 * u, cy - bh * 0.5f - ph * 22 * u, textPaint)
        }
    }
    if (look.dirty || look.poops >= 2) {
        for (k in -1..1) {
            val sx = cx + k * bw * 0.3f
            val wav = Path().apply {
                val y0 = cy - bh * 0.62f
                moveTo(sx, y0)
                for (i in 1..6) lineTo(sx + sin(t * 4f + i + k) * 1.8f * u, y0 - i * 2.2f * u)
            }
            drawPath(wav, Color(0xFF9CCC65).copy(alpha = 0.55f), style = Stroke(1.1f * u, cap = StrokeCap.Round))
        }
    }
    if (look.sick) {
        val dy = (t * 0.8f % 1f) * 6 * u
        drawCircle(Pal.sky.copy(alpha = 0.8f), 1.8f * u, Offset(cx + bw * 0.42f, cy - bh * 0.25f + dy))
    }
    when (anim) {
        Anim.LOVE -> repeat(5) { k ->
            val ph = (p + k * 0.17f) % 1f
            drawHeart(Offset(cx + sin(k * 2.1f + p * 6f) * bw * 0.6f, cy - bh * 0.4f - ph * 30 * u), 3.5f * u * (1 - ph * 0.5f), Pal.pink.copy(alpha = 1 - ph))
        }
        Anim.SPARKLE, Anim.LEVEL_UP, Anim.HATCH, Anim.CLEAN -> repeat(8) { k ->
            val a = k / 8f * 2 * PI.toFloat() + p * 2f
            val r = bw * (0.55f + p * 0.5f)
            drawStar(Offset(cx + cos(a) * r, cy + sin(a) * r * 0.8f), 2.8f * u * (1 - p * 0.6f), (if (anim == Anim.CLEAN) Pal.sky else Pal.amber).copy(alpha = 1 - p))
        }
        Anim.DANCE -> {
            textPaint.color = Pal.violet.toArgb(); textPaint.alpha = 255; textPaint.textSize = 9 * u
            drawContext.canvas.nativeCanvas.drawText("♪", cx - bw * 0.7f, cy - bh * 0.4f + sin(t * 6f) * 4 * u, textPaint)
            drawContext.canvas.nativeCanvas.drawText("♫", cx + bw * 0.7f, cy - bh * 0.5f + cos(t * 6f) * 4 * u, textPaint)
        }
        Anim.SAD -> drawCircle(Pal.sky.copy(alpha = 0.8f * (1 - p)), 1.5f * u, Offset(cx - eyeOffset(bw), cy + p * 12 * u))
        Anim.ANGRY -> {
            textPaint.color = Pal.red.toArgb(); textPaint.alpha = 255; textPaint.textSize = 8 * u
            drawContext.canvas.nativeCanvas.drawText("💢", cx + bw * 0.5f, cy - bh * 0.45f, textPaint)
        }
        else -> {}
    }
    if (anim == Anim.LEVEL_UP) {
        drawCircle(Pal.amber.copy(alpha = (1 - p) * 0.8f), bw * (0.6f + p * 0.9f), Offset(cx, cy), style = Stroke(2 * u))
    }
}

private fun eyeOffset(bw: Float) = bw * 0.19f

private fun DrawScope.drawStar(c: Offset, r: Float, color: Color) {
    val path = Path()
    for (i in 0 until 10) {
        val rad = if (i % 2 == 0) r else r * 0.45f
        val a = -PI.toFloat() / 2 + i * PI.toFloat() / 5
        val pt = Offset(c.x + cos(a) * rad, c.y + sin(a) * rad)
        if (i == 0) path.moveTo(pt.x, pt.y) else path.lineTo(pt.x, pt.y)
    }
    path.close()
    drawPath(path, color)
}

fun DrawScope.drawHeart(c: Offset, r: Float, color: Color) {
    val path = Path().apply {
        moveTo(c.x, c.y + r * 0.75f)
        cubicTo(c.x - r * 1.3f, c.y - r * 0.1f, c.x - r * 0.6f, c.y - r * 1.1f, c.x, c.y - r * 0.35f)
        cubicTo(c.x + r * 0.6f, c.y - r * 1.1f, c.x + r * 1.3f, c.y - r * 0.1f, c.x, c.y + r * 0.75f)
        close()
    }
    drawPath(path, color)
}

private fun DrawScope.drawSpiral(c: Offset, r: Float, color: Color, u: Float, spin: Float) {
    val path = Path()
    val turns = 2.2f
    val n = 40
    for (i in 0..n) {
        val f = i / n.toFloat()
        val a = f * turns * 2 * PI.toFloat() + spin
        val pt = Offset(c.x + cos(a) * r * f, c.y + sin(a) * r * f)
        if (i == 0) path.moveTo(pt.x, pt.y) else path.lineTo(pt.x, pt.y)
    }
    drawPath(path, color, style = Stroke(1.2f * u, cap = StrokeCap.Round))
}

private fun DrawScope.drawPoop(at: Offset, u: Float) {
    val brown = Color(0xFF795548); val hi = Color(0xFFA1887F)
    drawOval(brown, Offset(at.x - 5 * u, at.y - 3.5f * u), Size(10 * u, 4 * u))
    drawOval(brown, Offset(at.x - 3.8f * u, at.y - 6.3f * u), Size(7.6f * u, 3.6f * u))
    drawOval(brown, Offset(at.x - 2.4f * u, at.y - 8.6f * u), Size(4.8f * u, 3f * u))
    drawCircle(hi.copy(alpha = 0.6f), 0.9f * u, Offset(at.x - 1.5f * u, at.y - 5.5f * u))
}

private fun DrawScope.drawAccessory(id: String?, cx: Float, top: Float, bw: Float, u: Float, t: Float, eyeY: Float, eyeDX: Float, eyeR: Float) {
    when (id) {
        "hat_party" -> {
            val hat = Path().apply { moveTo(cx - 9 * u, top + 3 * u); lineTo(cx + 9 * u, top + 3 * u); lineTo(cx + 2 * u, top - 18 * u); close() }
            drawPath(hat, Pal.pink)
            clipPath(hat) { for (i in 0..4) drawLine(Pal.amber, Offset(cx - 12 * u, top - i * 5 * u), Offset(cx + 12 * u, top - i * 5 * u - 4 * u), 1.6f * u) }
            drawCircle(Pal.amber, 2.3f * u, Offset(cx + 2 * u, top - 18 * u))
        }
        "bow" -> {
            val c = Offset(cx + bw * 0.22f, top + 4 * u)
            val l = Path().apply { moveTo(c.x, c.y); lineTo(c.x - 7 * u, c.y - 5 * u); lineTo(c.x - 7 * u, c.y + 5 * u); close() }
            val r = Path().apply { moveTo(c.x, c.y); lineTo(c.x + 7 * u, c.y - 5 * u); lineTo(c.x + 7 * u, c.y + 5 * u); close() }
            drawPath(l, Pal.red); drawPath(r, Pal.red); drawCircle(Color(0xFFC62828), 2 * u, c)
        }
        "glasses" -> for (side in listOf(-1, 1)) {
            drawCircle(Color(0xFF263238), eyeR * 1.25f, Offset(cx + side * eyeDX, eyeY), style = Stroke(1.4f * u))
            drawLine(Color(0xFF263238), Offset(cx - eyeDX + eyeR * 1.25f, eyeY), Offset(cx + eyeDX - eyeR * 1.25f, eyeY), 1.4f * u)
        }
        "headphones" -> {
            drawArc(Color(0xFF37474F), 180f, 180f, false, Offset(cx - bw * 0.5f, top - 4 * u), Size(bw, bw * 0.7f), style = Stroke(2.6f * u))
            for (side in listOf(-1, 1)) drawRoundRectCompat(Offset(cx + side * bw * 0.5f - 3.5f * u, top + bw * 0.28f), Size(7 * u, 11 * u), Pal.sky)
        }
        "beanie" -> {
            drawArc(Pal.violet, 180f, 180f, true, Offset(cx - bw * 0.36f, top - 7 * u), Size(bw * 0.72f, 20 * u))
            drawRoundRectCompat(Offset(cx - bw * 0.38f, top + 1 * u), Size(bw * 0.76f, 5 * u), Color(0xFF7E57C2))
            drawCircle(Color.White, 3 * u, Offset(cx, top - 8 * u))
        }
        "tophat" -> {
            drawRoundRectCompat(Offset(cx - 12 * u, top + 1 * u), Size(24 * u, 3 * u), Color(0xFF212121))
            drawRoundRectCompat(Offset(cx - 7.5f * u, top - 15 * u), Size(15 * u, 17 * u), Color(0xFF212121))
            drawRoundRectCompat(Offset(cx - 7.5f * u, top - 2 * u), Size(15 * u, 2.5f * u), Pal.red)
        }
        "wizard" -> {
            val hat = Path().apply { moveTo(cx - 13 * u, top + 4 * u); lineTo(cx + 13 * u, top + 4 * u); quadraticTo(cx + 2 * u, top - 10 * u, cx + 9 * u, top - 24 * u); quadraticTo(cx - 4 * u, top - 10 * u, cx - 13 * u, top + 4 * u); close() }
            drawPath(hat, Color(0xFF3949AB))
            drawStar(Offset(cx - 1 * u, top - 4 * u), 2.6f * u, Pal.amber)
        }
        "halo" -> drawOval(Pal.amber.copy(alpha = 0.85f + 0.15f * sin(t * 3f)), Offset(cx - 11 * u, top - 12 * u), Size(22 * u, 6 * u), style = Stroke(2 * u))
        "crown" -> {
            val crown = Path().apply {
                moveTo(cx - 10 * u, top + 3 * u); lineTo(cx - 10 * u, top - 7 * u); lineTo(cx - 5 * u, top - 2 * u); lineTo(cx, top - 10 * u)
                lineTo(cx + 5 * u, top - 2 * u); lineTo(cx + 10 * u, top - 7 * u); lineTo(cx + 10 * u, top + 3 * u); close()
            }
            drawPath(crown, Pal.amber)
            drawCircle(Pal.red, 1.4f * u, Offset(cx, top - 1 * u)); drawCircle(Pal.sky, 1.2f * u, Offset(cx - 6 * u, top))
            drawCircle(Pal.mint, 1.2f * u, Offset(cx + 6 * u, top))
        }
        else -> {}
    }
}

private fun DrawScope.drawRoundRectCompat(topLeft: Offset, size: Size, color: Color) {
    drawRoundRect(color, topLeft, size, androidx.compose.ui.geometry.CornerRadius(size.minDimension * 0.3f))
}
