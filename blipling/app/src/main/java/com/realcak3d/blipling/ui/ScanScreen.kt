package com.realcak3d.blipling.ui

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.util.Size
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.realcak3d.blipling.core.Food
import com.realcak3d.blipling.core.FoodFactory
import com.realcak3d.blipling.core.FoodTrait
import com.realcak3d.blipling.core.GameEvent
import com.realcak3d.blipling.core.ScanInput
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.Feeder
import com.realcak3d.blipling.sensors.SensorHub
import com.realcak3d.blipling.sensors.granted
import kotlinx.coroutines.launch
import java.util.concurrent.Executors

fun barcodeFormatName(f: Int): String = when (f) {
    Barcode.FORMAT_QR_CODE -> "QR_CODE"
    Barcode.FORMAT_EAN_13 -> "EAN_13"
    Barcode.FORMAT_EAN_8 -> "EAN_8"
    Barcode.FORMAT_UPC_A -> "UPC_A"
    Barcode.FORMAT_UPC_E -> "UPC_E"
    Barcode.FORMAT_CODE_128 -> "CODE_128"
    Barcode.FORMAT_CODE_39 -> "CODE_39"
    Barcode.FORMAT_CODE_93 -> "CODE_93"
    Barcode.FORMAT_CODABAR -> "CODABAR"
    Barcode.FORMAT_ITF -> "ITF"
    Barcode.FORMAT_DATA_MATRIX -> "DATA_MATRIX"
    Barcode.FORMAT_AZTEC -> "AZTEC"
    Barcode.FORMAT_PDF417 -> "PDF417"
    else -> "UNKNOWN"
}

private data class Pending(val input: ScanInput, val food: Food, val seenBefore: Boolean)

@Composable
fun ScanScreen(repo: GameRepository, hub: SensorHub, hasNfc: Boolean) {
    val ctx = LocalContext.current
    val g by rememberGame(repo)
    val scope = rememberCoroutineScope()
    var pending by remember { mutableStateOf<Pending?>(null) }
    var busy by remember { mutableStateOf(false) }
    var torch by remember { mutableStateOf(false) }
    var camera by remember { mutableStateOf<Camera?>(null) }
    var result by remember { mutableStateOf<String?>(null) }
    val hasCam = ctx.granted(Manifest.permission.CAMERA)

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        ScreenTitle("Feed", if (g.buddy.hatched) "Scan any barcode, QR code or ${if (hasNfc) "NFC tag " else ""}to make a snack" else "Scan anything to hatch your egg!")
        Box(
            Modifier
                .padding(horizontal = 12.dp)
                .fillMaxWidth()
                .height(340.dp)
                .clip(RoundedCornerShape(22.dp))
                .background(Color.Black)
        ) {
            if (hasCam) {
                CameraBarcodeView(
                    paused = pending != null || busy,
                    onCamera = { camera = it },
                    onCode = { raw, fmt ->
                        if (pending == null && !busy) {
                            busy = true
                            hub.haptics.beep(); hub.haptics.buzz(30, 150)
                            scope.launch {
                                val input = Feeder.prepare(repo, raw, fmt)
                                val food = FoodFactory.fromScan(input)
                                pending = Pending(input, food, repo.data.codeLastEaten.containsKey(food.key))
                                busy = false
                            }
                        }
                    },
                )
                Reticle(Modifier.fillMaxSize())
            } else {
                Text("Camera permission is needed to scan.\nOpen Settings → Permissions.", color = Pal.sub, modifier = Modifier.align(Alignment.Center).padding(20.dp))
            }
            if (busy) Text("Analyzing snack…", color = Pal.mint, modifier = Modifier.align(Alignment.BottomCenter).padding(12.dp))
            if (hasCam) Text(
                if (torch) "🔦 ON" else "🔦",
                color = Color.White, fontSize = 18.sp,
                modifier = Modifier.align(Alignment.TopEnd).padding(10.dp).clip(RoundedCornerShape(50)).background(Color.Black.copy(alpha = 0.5f))
                    .clickableNoRipple { torch = !torch; camera?.cameraControl?.enableTorch(torch) }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            )
        }
        Spacer(Modifier.height(12.dp))
        val p = pending
        if (p != null) {
            FoodCard(p.food, p.seenBefore, p.input)
            Spacer(Modifier.height(10.dp))
            Row(Modifier.padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                BigButton(if (g.buddy.hatched) "🍽️  Feed ${g.buddy.name}" else "🐣  Hatch & feed", Pal.mint, Modifier.weight(1f)) {
                    val ev = Feeder.feed(repo, p.input)
                    val said = ev.filterIsInstance<GameEvent.Say>().lastOrNull()?.text
                    result = said
                    pending = null
                }
                BigButton("Skip", Pal.sub, Modifier.weight(0.5f)) { pending = null }
            }
        } else {
            result?.let { Box(Modifier.fillMaxWidth().padding(horizontal = 12.dp)) { SpeechBubble(it) } }
            Spacer(Modifier.height(10.dp))
            Panel(Modifier.padding(horizontal = 12.dp), title = "What can I eat?") {
                Text(
                    "🛒 Grocery barcodes (EAN/UPC) — real product names when online\n" +
                        "💾 QR codes — data snacks; links, Wi-Fi, contacts and map codes taste different\n" +
                        "📦 Shipping labels (Code 128/39) — industrial crates\n" +
                        "🎫 Boarding passes & tickets (PDF417/Aztec/DataMatrix) — exotic dishes\n" +
                        (if (hasNfc) "⚡ NFC tags & cards — tap them on the back of the phone anytime\n" else "") +
                        "\nEvery code always makes the same food. New codes give bonus XP and coins. The same code more than twice a day gets refused!",
                    color = Pal.text, fontSize = 13.sp, lineHeight = 19.sp,
                )
            }
            Spacer(Modifier.height(10.dp))
            Row(Modifier.padding(horizontal = 12.dp)) {
                BigButton("🥣  Feed kibble (${g.inventory["kibble"] ?: 0} left)", Pal.amber, Modifier.fillMaxWidth()) {
                    result = repo.act { n -> useItem("kibble", n) }.filterIsInstance<GameEvent.Say>().lastOrNull()?.text ?: "No kibble left! Buy some in the shop."
                }
            }
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
private fun FoodCard(food: Food, seenBefore: Boolean, input: ScanInput) {
    val rc = Color(food.rarity.argb)
    Column(
        Modifier
            .padding(horizontal = 12.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Pal.panel)
            .border(2.dp, rc, RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(food.family.emoji, fontSize = 34.sp)
            Column(Modifier.padding(start = 10.dp).weight(1f)) {
                Text(food.name, color = Pal.text, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                Text("★".repeat(food.rarity.stars) + "☆".repeat(5 - food.rarity.stars) + "  ${food.rarity.label} ${food.family.label}", color = rc, fontSize = 13.sp)
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (food.trait != FoodTrait.NONE) Chip(food.trait.label, if (food.trait == FoodTrait.SPOILED) Pal.red else Pal.violet)
            Chip(if (seenBefore) "Eaten before" else "NEW!", if (seenBefore) Pal.sub else Pal.amber)
            Chip(input.format.replace('_', ' '), Pal.sky)
        }
        Spacer(Modifier.height(8.dp))
        Text(food.description, color = Pal.sub, fontSize = 13.sp)
        Spacer(Modifier.height(8.dp))
        fun d(v: Double) = (if (v >= 0) "+" else "") + v.toInt()
        Text(
            "🍔 ${d(food.fullness)}   😊 ${d(food.happiness)}   ⚡ ${d(food.energy)}   ❤️ ${d(food.health)}   ✨ ${food.xp} XP",
            color = Pal.text, fontFamily = Mono, fontSize = 12.sp,
        )
        Text(input.raw.take(80), color = Pal.sub.copy(alpha = 0.6f), fontFamily = Mono, fontSize = 10.sp, modifier = Modifier.padding(top = 6.dp))
    }
}

@Composable
private fun Reticle(modifier: Modifier) {
    val tr = rememberInfiniteTransition(label = "scan")
    val y by tr.animateFloat(0.15f, 0.85f, infiniteRepeatable(tween(1400), RepeatMode.Reverse), label = "line")
    Canvas(modifier) {
        val w = size.width * 0.72f; val h = size.height * 0.55f
        val l = (size.width - w) / 2; val t = (size.height - h) / 2
        drawRoundRect(Pal.mint, Offset(l, t), androidx.compose.ui.geometry.Size(w, h), CornerRadius(28f), style = Stroke(4f))
        drawLine(Pal.red.copy(alpha = 0.8f), Offset(l + 10, t + h * y), Offset(l + w - 10, t + h * y), 3f)
    }
}

@SuppressLint("UnsafeOptInUsageError")
@Composable
private fun CameraBarcodeView(paused: Boolean, onCamera: (Camera) -> Unit, onCode: (String, String) -> Unit) {
    val ctx = LocalContext.current
    val owner = LocalLifecycleOwner.current
    val pausedState = remember { PausedRef() }
    pausedState.paused = paused
    val callback = remember { CodeRef() }
    callback.fn = onCode
    val executor = remember { Executors.newSingleThreadExecutor() }
    val scanner: BarcodeScanner = remember { BarcodeScanning.getClient() }
    val previewView = remember { PreviewView(ctx).apply { scaleType = PreviewView.ScaleType.FILL_CENTER } }

    DisposableEffect(owner) {
        val providerFuture = ProcessCameraProvider.getInstance(ctx)
        var provider: ProcessCameraProvider? = null
        providerFuture.addListener({
            provider = providerFuture.get()
            val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
            val analysis = ImageAnalysis.Builder()
                .setResolutionSelector(ResolutionSelector.Builder().setResolutionStrategy(
                    ResolutionStrategy(Size(1280, 720), ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER)).build())
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            analysis.setAnalyzer(executor) { proxy -> analyze(proxy, scanner, pausedState, callback, ctx) }
            runCatching {
                provider?.unbindAll()
                val cam = provider?.bindToLifecycle(owner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
                if (cam != null) onCamera(cam)
            }
        }, ContextCompat.getMainExecutor(ctx))
        onDispose {
            runCatching { provider?.unbindAll() }
        }
    }
    DisposableEffect(Unit) { onDispose { scanner.close(); executor.shutdown() } }
    AndroidView({ previewView }, Modifier.fillMaxSize())
}

private class PausedRef { @Volatile var paused = false }
private class CodeRef { var fn: (String, String) -> Unit = { _, _ -> } }

@androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
private fun analyze(proxy: ImageProxy, scanner: BarcodeScanner, paused: PausedRef, cb: CodeRef, ctx: Context) {
    val media = proxy.image
    if (media == null || paused.paused) { proxy.close(); return }
    val image = InputImage.fromMediaImage(media, proxy.imageInfo.rotationDegrees)
    scanner.process(image)
        .addOnSuccessListener { codes ->
            val c = codes.firstOrNull { !it.rawValue.isNullOrBlank() }
            if (c != null && !paused.paused) {
                val raw = c.rawValue!!
                val fmt = barcodeFormatName(c.format)
                ContextCompat.getMainExecutor(ctx).execute { cb.fn(raw, fmt) }
            }
        }
        .addOnCompleteListener { proxy.close() }
}

@Composable
fun Modifier.clickableNoRipple(onClick: () -> Unit): Modifier =
    this.then(Modifier.clickable(interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }, indication = null, onClick = onClick))
