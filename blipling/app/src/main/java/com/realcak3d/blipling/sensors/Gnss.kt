package com.realcak3d.blipling.sensors

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.location.GnssStatus
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.realcak3d.blipling.core.SatelliteInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Listens to GNSS satellite status (GPS, GLONASS, Galileo, BeiDou, QZSS, SBAS, NavIC). */
class GnssWatcher(private val ctx: Context) {
    private val lm = ctx.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private val _sats = MutableStateFlow<List<SatelliteInfo>>(emptyList())
    val satellites: StateFlow<List<SatelliteInfo>> = _sats.asStateFlow()
    private val _location = MutableStateFlow<Location?>(null)
    val location: StateFlow<Location?> = _location.asStateFlow()
    private val _status = MutableStateFlow("Idle")
    val status: StateFlow<String> = _status.asStateFlow()
    var onSatellites: ((List<SatelliteInfo>) -> Unit)? = null
    var onLocation: ((Location) -> Unit)? = null
    private var running = false
    private var lastBatch = 0L

    private val gnssCallback = object : GnssStatus.Callback() {
        override fun onSatelliteStatusChanged(status: GnssStatus) {
            val list = (0 until status.satelliteCount).map { i ->
                SatelliteInfo(
                    svid = status.getSvid(i),
                    constellation = constellationName(status.getConstellationType(i)),
                    cn0 = status.getCn0DbHz(i),
                    azimuth = status.getAzimuthDegrees(i),
                    elevation = status.getElevationDegrees(i),
                    usedInFix = status.usedInFix(i),
                )
            }.filter { it.cn0 > 0f }
            _sats.value = list
            _status.value = "${list.size} satellites visible, ${list.count { it.usedInFix }} locked"
            val now = System.currentTimeMillis()
            if (now - lastBatch > 10_000) { lastBatch = now; onSatellites?.invoke(list) }
        }
        override fun onStarted() { _status.value = "Searching the sky…" }
        override fun onStopped() { _status.value = "GNSS stopped" }
    }

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) { _location.value = location; onLocation?.invoke(location) }
        @Deprecated("Deprecated in Java")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) { _status.value = "Location is turned off" }
    }

    fun canRun() = ctx.granted(Manifest.permission.ACCESS_FINE_LOCATION)

    @SuppressLint("MissingPermission")
    fun start() {
        if (running) return
        if (!canRun()) { _status.value = "Needs location permission"; return }
        if (!lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) _status.value = "Turn on location to see satellites"
        running = true
        runCatching {
            lm.registerGnssStatusCallback(gnssCallback, Handler(Looper.getMainLooper()))
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2_000L, 0f, locationListener, Looper.getMainLooper())
        }.onFailure { _status.value = "GNSS unavailable: ${it.message}" }
    }

    fun stop() {
        if (!running) return
        running = false
        runCatching { lm.unregisterGnssStatusCallback(gnssCallback) }
        runCatching { lm.removeUpdates(locationListener) }
    }

    companion object {
        fun constellationName(type: Int) = when (type) {
            GnssStatus.CONSTELLATION_GPS -> "GPS"
            GnssStatus.CONSTELLATION_GLONASS -> "GLONASS"
            GnssStatus.CONSTELLATION_GALILEO -> "Galileo"
            GnssStatus.CONSTELLATION_BEIDOU -> "BeiDou"
            GnssStatus.CONSTELLATION_QZSS -> "QZSS"
            GnssStatus.CONSTELLATION_SBAS -> "SBAS"
            GnssStatus.CONSTELLATION_IRNSS -> "NavIC"
            else -> "Unknown"
        }
    }
}
