package com.realcak3d.blipling.core

import kotlin.math.abs
import kotlin.math.pow

/**
 * Phones can't measure the direction a radio signal comes from, but your body blocks a few dB of it.
 * So we do what fox hunters do: sweep in a circle, remember signal strength per compass heading, and
 * the strongest heading is our best guess. Distance is a rough log-distance path-loss estimate.
 */
class RadarTracker(private val bins: Int = 24) {
    private val sum = DoubleArray(bins)
    private val weight = DoubleArray(bins)
    private val history = ArrayDeque<Int>()
    var targetId: String? = null
        private set
    var lastRssi: Int = -100
        private set

    fun reset(target: String?) {
        targetId = target
        sum.fill(0.0); weight.fill(0.0); history.clear(); lastRssi = -100
    }

    fun add(headingDeg: Float, rssi: Int) {
        val i = binOf(headingDeg)
        // Exponential forgetting so the estimate follows you as you walk.
        for (k in 0 until bins) { sum[k] *= 0.995; weight[k] *= 0.995 }
        sum[i] += rssi.toDouble(); weight[i] += 1.0
        lastRssi = rssi
        history.addLast(rssi); if (history.size > 12) history.removeFirst()
    }

    private fun binOf(h: Float) = (((h % 360f) + 360f) % 360f / (360f / bins)).toInt().coerceIn(0, bins - 1)

    /** Fraction of the circle we have samples for. */
    fun coverage(): Float = weight.count { it > 0.3 }.toFloat() / bins

    private fun avg(i: Int): Double? = if (weight[i] > 0.3) sum[i] / weight[i] else null

    /** Best-guess bearing in degrees (0 = north), or null until we've swept enough. */
    fun bearing(): Float? {
        if (coverage() < 0.4f) return null
        var best = -1; var bestScore = -1e9
        for (i in 0 until bins) {
            // Smooth with neighbours to reduce noise.
            val vals = listOfNotNull(avg((i - 1 + bins) % bins), avg(i), avg((i + 1) % bins))
            if (avg(i) == null || vals.isEmpty()) continue
            val score = vals.average()
            if (score > bestScore) { bestScore = score; best = i }
        }
        return if (best < 0) null else (best + 0.5f) * (360f / bins)
    }

    /** 0..1: how much stronger the best heading is than the average. */
    fun confidence(): Float {
        val vals = (0 until bins).mapNotNull { avg(it) }
        if (vals.size < 4) return 0f
        val spread = vals.max() - vals.average()
        return (spread / 8.0).toFloat().coerceIn(0f, 1f) * coverage().coerceAtMost(1f)
    }

    /** +1 getting stronger, -1 getting weaker, 0 flat. */
    fun trend(): Int {
        if (history.size < 6) return 0
        val half = history.size / 2
        val a = history.take(half).average(); val b = history.drop(half).average()
        return when { b - a > 2.5 -> 1; a - b > 2.5 -> -1; else -> 0 }
    }

    companion object {
        /** Very rough meters from RSSI. txPower is the expected RSSI at 1 m. */
        fun distanceMeters(rssi: Int, kind: SignalKind): Double {
            val tx = if (kind == SignalKind.WIFI) -38.0 else -59.0
            val n = if (kind == SignalKind.WIFI) 2.7 else 2.2
            return 10.0.pow((tx - rssi) / (10 * n)).coerceIn(0.1, 300.0)
        }

        /** 0..1 strength for pulse speed. */
        fun strength(rssi: Int): Float = ((rssi + 100) / 65f).coerceIn(0f, 1f)

        /** Signed smallest angle a - b in degrees. */
        fun angleDiff(a: Float, b: Float): Float {
            var d = (a - b) % 360f
            if (d > 180) d -= 360f
            if (d < -180) d += 360f
            return d
        }

        fun facing(heading: Float, bearing: Float, tolerance: Float = 20f) = abs(angleDiff(bearing, heading)) <= tolerance
    }
}
