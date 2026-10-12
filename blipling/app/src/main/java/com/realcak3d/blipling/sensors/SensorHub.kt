package com.realcak3d.blipling.sensors

import android.content.Context
import com.realcak3d.blipling.core.FoodFactory
import com.realcak3d.blipling.core.GameEvent
import com.realcak3d.blipling.core.ScanInput
import com.realcak3d.blipling.core.Sex
import com.realcak3d.blipling.data.GameRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Owns every sensor and routes their events into the game. Lives as long as the activity. */
class SensorHub(ctx: Context, val repo: GameRepository) {
    val wifi = WifiRadar(ctx)
    val bt = BluetoothRadar(ctx)
    val gnss = GnssWatcher(ctx)
    val body = BodySensors(ctx)
    val sound = SoundMeter(ctx)
    val haptics = Haptics(ctx)

    init {
        wifi.onBatch = { list -> repo.act { now -> onWifiScan(list, now) } }
        bt.onBatch = { list -> repo.act { now -> onBluetooth(list, now) } }
        gnss.onSatellites = { sats -> repo.act { now -> onSatellites(sats, now) } }
        gnss.onLocation = { loc -> if (loc.hasAltitude()) repo.act { now -> onAltitude(loc.altitude, now) } }
        body.onShake = { haptics.buzz(40, 160); repo.act { now -> onShake(now) } }
        body.onSteps = { n -> repo.act { now -> onSteps(n, now) } }
        body.onDark = { repo.act { now -> onDark(now) } }
        body.onPeekaboo = { repo.act { now -> onPeekaboo(now) } }
        body.onCharging = { repo.act { now -> onCharging(now) } }
        body.onMagnet = { m -> repo.act { now -> onMagnet(m, now) } }
        body.onAltitude = { alt -> repo.act { now -> onAltitude(alt, now) } }
        sound.onLoud = { repo.act { now -> onLoudSound(now) } }
    }

    fun applySettings() {
        val s = repo.data.settings
        haptics.vibrationOn = s.vibration
        haptics.soundOn = s.sounds
    }

    /** Foreground: the buddy is always sniffing around. */
    fun startAll() {
        applySettings()
        body.start(); wifi.start(); bt.start(); gnss.start()
    }

    fun stopAll() {
        body.stop(); wifi.stop(); bt.stop(); gnss.stop(); sound.stop()
    }

    /** Re-try anything that was blocked on a permission. */
    fun refreshPermissions() {
        body.restart(); wifi.stop(); wifi.start(); bt.stop(); bt.start(); gnss.stop(); gnss.start()
    }

    fun react(events: List<GameEvent>) {
        for (e in events) when (e) {
            is GameEvent.Unlocked -> haptics.pattern(longArrayOf(0, 40, 60, 40, 60, 90))
            is GameEvent.LevelUp -> haptics.pattern(longArrayOf(0, 80, 50, 80, 50, 160))
            is GameEvent.Ate -> haptics.buzz(25, 90)
            is GameEvent.Died -> haptics.pattern(longArrayOf(0, 300, 100, 300))
            else -> {}
        }
    }
}

/** Turns a scan into food, hatching the egg first if needed. */
object Feeder {
    suspend fun lookupProduct(code: String): Pair<String?, String?> = withContext(Dispatchers.IO) {
        runCatching {
            val url = URL("https://world.openfoodfacts.org/api/v2/product/$code.json?fields=product_name,brands,nutriscore_grade")
            val c = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 3500; readTimeout = 3500
                setRequestProperty("User-Agent", "Blipling/1.0 (Android hobby app)")
            }
            c.inputStream.bufferedReader().use { r ->
                val o = JSONObject(r.readText())
                if (o.optInt("status") != 1) return@runCatching null to null
                val p = o.optJSONObject("product") ?: return@runCatching null to null
                val name = p.optString("product_name").ifBlank { null }
                val brand = p.optString("brands").split(",").firstOrNull()?.trim()?.ifBlank { null }
                val full = when {
                    name == null -> null
                    brand != null && !name.contains(brand, ignoreCase = true) -> "$brand $name"
                    else -> name
                }
                full to p.optString("nutriscore_grade").ifBlank { null }
            }
        }.getOrDefault(null to null)
    }

    suspend fun prepare(repo: GameRepository, raw: String, format: String): ScanInput {
        val isProduct = format in setOf("EAN_13", "EAN_8", "UPC_A", "UPC_E")
        if (isProduct && repo.data.settings.onlineProductLookup) {
            val (name, score) = lookupProduct(raw)
            return ScanInput(raw, format, name, score)
        }
        return ScanInput(raw, format)
    }

    fun feed(repo: GameRepository, input: ScanInput): List<GameEvent> {
        val food = FoodFactory.fromScan(input)
        return repo.act { now ->
            val pre = mutableListOf<GameEvent>()
            if (!g.buddy.hatched) {
                val name = g.buddy.name.ifBlank { listOf("Blip", "Pixel", "Bloop", "Zap", "Byte", "Pip").random() }
                pre += hatch(name, g.buddy.sex.takeIf { g.buddy.name.isNotBlank() } ?: Sex.entries.random(), now)
            }
            pre + feed(food, now)
        }
    }
}
