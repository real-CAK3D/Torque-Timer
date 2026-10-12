package com.realcak3d.blipling.sensors

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.realcak3d.blipling.core.SignalInfo
import com.realcak3d.blipling.core.SignalKind
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

fun Context.granted(p: String) = ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

/** Periodic Wi-Fi scans. Android throttles apps to ~4 scans per 2 minutes; cached results still update. */
class WifiRadar(private val ctx: Context) {
    private val wifi = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    private val handler = Handler(Looper.getMainLooper())
    private val _results = MutableStateFlow<List<SignalInfo>>(emptyList())
    val results: StateFlow<List<SignalInfo>> = _results.asStateFlow()
    private val _status = MutableStateFlow("Idle")
    val status: StateFlow<String> = _status.asStateFlow()
    var onBatch: ((List<SignalInfo>) -> Unit)? = null
    private var running = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, i: Intent?) { publish() }
    }

    private val loop = object : Runnable {
        override fun run() {
            if (!running) return
            requestScan()
            handler.postDelayed(this, 12_000)
        }
    }

    fun canScan() = ctx.granted(Manifest.permission.ACCESS_FINE_LOCATION) ||
        (Build.VERSION.SDK_INT >= 33 && ctx.granted(Manifest.permission.NEARBY_WIFI_DEVICES))

    fun start() {
        if (running) return
        if (!canScan()) { _status.value = "Needs location / nearby-devices permission"; return }
        running = true
        ContextCompat.registerReceiver(ctx, receiver, IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION), ContextCompat.RECEIVER_EXPORTED)
        handler.post(loop)
    }

    fun stop() {
        if (!running) return
        running = false
        handler.removeCallbacks(loop)
        runCatching { ctx.unregisterReceiver(receiver) }
    }

    @Suppress("DEPRECATION")
    private fun requestScan() {
        if (!wifi.isWifiEnabled) _status.value = "Wi-Fi is off (scans may still work if 'Wi-Fi scanning' is on)"
        val ok = runCatching { wifi.startScan() }.getOrDefault(false)
        _status.value = if (ok) "Scanning…" else "Using cached results (Android scan throttle)"
        publish()
    }

    @SuppressLint("MissingPermission")
    @Suppress("DEPRECATION")
    private fun publish() {
        if (!canScan()) return
        val list = runCatching { wifi.scanResults }.getOrNull().orEmpty().map {
            val ssid = if (Build.VERSION.SDK_INT >= 33) it.wifiSsid?.toString()?.trim('"').orEmpty() else it.SSID.orEmpty()
            val caps = it.capabilities.orEmpty()
            SignalInfo(
                id = it.BSSID ?: ssid, name = ssid, rssi = it.level, kind = SignalKind.WIFI, frequencyMhz = it.frequency,
                secured = caps.contains("WPA") || caps.contains("WEP") || caps.contains("SAE") || caps.contains("EAP"),
            )
        }.sortedByDescending { it.rssi }
        _results.value = list
        if (list.isNotEmpty()) _status.value = "${list.size} networks"
        onBatch?.invoke(list)
    }
}

/** BLE + classic discovery, merged and smoothed. BLE gives fast RSSI updates, which the radar needs. */
class BluetoothRadar(private val ctx: Context) {
    private val manager = ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    private val adapter: BluetoothAdapter? = manager?.adapter
    private val handler = Handler(Looper.getMainLooper())
    private val seen = LinkedHashMap<String, Entry>()
    private val _devices = MutableStateFlow<List<SignalInfo>>(emptyList())
    val devices: StateFlow<List<SignalInfo>> = _devices.asStateFlow()
    private val _status = MutableStateFlow("Idle")
    val status: StateFlow<String> = _status.asStateFlow()
    var onBatch: ((List<SignalInfo>) -> Unit)? = null
    private var running = false
    private var lastBatch = 0L

    private class Entry(var info: SignalInfo, var smooth: Double, var lastSeen: Long)

    fun available() = adapter != null

    fun canScan(): Boolean = if (Build.VERSION.SDK_INT >= 31)
        ctx.granted(Manifest.permission.BLUETOOTH_SCAN) && ctx.granted(Manifest.permission.BLUETOOTH_CONNECT)
    else ctx.granted(Manifest.permission.ACCESS_FINE_LOCATION)

    private val callback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) { record(result.device, result.rssi, SignalKind.BLE, result.scanRecord?.deviceName) }
        override fun onBatchScanResults(results: MutableList<ScanResult>) { results.forEach { onScanResult(0, it) } }
        override fun onScanFailed(errorCode: Int) { _status.value = "BLE scan failed ($errorCode)" }
    }

    private val classicReceiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, i: Intent?) {
            when (i?.action) {
                BluetoothDevice.ACTION_FOUND -> {
                    val dev: BluetoothDevice? = if (Build.VERSION.SDK_INT >= 33) i.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
                    else @Suppress("DEPRECATION") i.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
                    val rssi = i.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE).toInt()
                    if (dev != null && rssi != Short.MIN_VALUE.toInt()) record(dev, rssi, SignalKind.BLUETOOTH, null)
                }
                BluetoothAdapter.ACTION_DISCOVERY_FINISHED -> if (running) handler.postDelayed({ startClassic() }, 4_000)
            }
        }
    }

    private val ticker = object : Runnable {
        override fun run() {
            if (!running) return
            emit()
            handler.postDelayed(this, 400)
        }
    }

    @SuppressLint("MissingPermission")
    fun start() {
        if (running) return
        val a = adapter ?: run { _status.value = "No Bluetooth on this device"; return }
        if (!canScan()) { _status.value = "Needs Bluetooth permission"; return }
        if (!a.isEnabled) { _status.value = "Bluetooth is off"; return }
        running = true
        _status.value = "Scanning…"
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        runCatching { a.bluetoothLeScanner?.startScan(null, settings, callback) }
            .onFailure { _status.value = "BLE scan unavailable: ${it.message}" }
        ContextCompat.registerReceiver(ctx, classicReceiver, IntentFilter().apply {
            addAction(BluetoothDevice.ACTION_FOUND); addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
        }, ContextCompat.RECEIVER_EXPORTED)
        startClassic()
        handler.post(ticker)
    }

    @SuppressLint("MissingPermission")
    private fun startClassic() {
        if (!running) return
        runCatching { adapter?.startDiscovery() }
    }

    @SuppressLint("MissingPermission")
    fun stop() {
        if (!running) return
        running = false
        handler.removeCallbacks(ticker)
        runCatching { adapter?.bluetoothLeScanner?.stopScan(callback) }
        runCatching { adapter?.cancelDiscovery() }
        runCatching { ctx.unregisterReceiver(classicReceiver) }
        _status.value = "Stopped"
    }

    @SuppressLint("MissingPermission")
    private fun record(dev: BluetoothDevice, rssi: Int, kind: SignalKind, advName: String?) {
        val id = dev.address ?: return
        val name = advName ?: runCatching { dev.name }.getOrNull() ?: ""
        val now = System.currentTimeMillis()
        val e = seen[id]
        if (e == null) {
            seen[id] = Entry(SignalInfo(id, name, rssi, kind), rssi.toDouble(), now)
        } else {
            e.smooth = e.smooth * 0.6 + rssi * 0.4
            e.info = SignalInfo(id, name.ifBlank { e.info.name }, e.smooth.toInt(), kind)
            e.lastSeen = now
        }
    }

    private fun emit() {
        val now = System.currentTimeMillis()
        seen.entries.removeAll { now - it.value.lastSeen > 15_000 }
        val list = seen.values.map { it.info }.sortedByDescending { it.rssi }
        _devices.value = list
        _status.value = "${list.size} devices"
        if (now - lastBatch > 5_000 && list.isNotEmpty()) { lastBatch = now; onBatch?.invoke(list) }
    }
}
