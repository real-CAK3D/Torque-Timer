package com.realcak3d.blipling

import android.Manifest
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
import com.realcak3d.blipling.core.ScanInput
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.Feeder
import com.realcak3d.blipling.sensors.SensorHub
import com.realcak3d.blipling.ui.BliplingRoot
import com.realcak3d.blipling.ui.BliplingTheme
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var repo: GameRepository
    lateinit var hub: SensorHub
        private set
    private var ticker: Job? = null
    private var nfc: NfcAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        repo = GameRepository.get(this)
        hub = SensorHub(this, repo)
        nfc = NfcAdapter.getDefaultAdapter(this)
        lifecycleScope.launch { repo.events.collect { hub.react(listOf(it)) } }
        setContent {
            BliplingTheme {
                BliplingRoot(repo = repo, hub = hub, hasNfc = nfc != null)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Catch up on time away (protected from dying while the app was closed for < 48 h).
        val away = repo.act { now -> tick(now, offline = true) }
        if (away.none { it is com.realcak3d.blipling.core.GameEvent.Say }) repo.say(repo.engine.ambient(System.currentTimeMillis()).text)
        hub.startAll()
        ticker = lifecycleScope.launch {
            var n = 0
            while (isActive) {
                delay(15_000)
                repo.act { now -> tick(now) }
                if (++n % 2 == 0) repo.publish(listOf(repo.engine.ambient(System.currentTimeMillis())))
            }
        }
        enableNfc()
    }

    override fun onPause() {
        super.onPause()
        ticker?.cancel()
        hub.stopAll()
        runCatching { nfc?.disableReaderMode(this) }
    }

    private fun enableNfc() {
        val adapter = nfc ?: return
        if (!adapter.isEnabled) return
        val flags = NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_NFC_B or NfcAdapter.FLAG_READER_NFC_F or
            NfcAdapter.FLAG_READER_NFC_V or NfcAdapter.FLAG_READER_NFC_BARCODE
        runCatching {
            adapter.enableReaderMode(this, { tag -> onTag(tag) }, flags, null)
        }
    }

    private fun onTag(tag: Tag) {
        val id = tag.id?.joinToString("") { "%02X".format(it) } ?: "unknown"
        val text = runCatching {
            Ndef.get(tag)?.let { ndef ->
                ndef.connect()
                val msg = ndef.ndefMessage
                ndef.close()
                msg?.records?.firstOrNull()?.payload?.let { String(it, Charsets.UTF_8).filter { c -> !c.isISOControl() } }
            }
        }.getOrNull()
        runOnUiThread {
            hub.haptics.buzz(60, 200)
            Feeder.feed(repo, ScanInput(if (text.isNullOrBlank()) id else "$id|$text", "NFC"))
        }
    }

    companion object {
        val runtimePermissions: Array<String> = buildList {
            add(Manifest.permission.CAMERA)
            add(Manifest.permission.ACCESS_FINE_LOCATION)
            add(Manifest.permission.ACCESS_COARSE_LOCATION)
            if (Build.VERSION.SDK_INT >= 31) { add(Manifest.permission.BLUETOOTH_SCAN); add(Manifest.permission.BLUETOOTH_CONNECT) }
            if (Build.VERSION.SDK_INT >= 33) { add(Manifest.permission.NEARBY_WIFI_DEVICES); add(Manifest.permission.POST_NOTIFICATIONS) }
            if (Build.VERSION.SDK_INT >= 29) add(Manifest.permission.ACTIVITY_RECOGNITION)
            add(Manifest.permission.RECORD_AUDIO)
        }.toTypedArray()
    }
}
