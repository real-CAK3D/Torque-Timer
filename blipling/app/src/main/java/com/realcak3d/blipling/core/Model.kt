package com.realcak3d.blipling.core

import kotlin.math.max
import kotlin.math.min

/** Everything here is plain Kotlin (no Android imports) so the game rules can be unit-tested on the JVM. */

enum class Sex(val label: String, val symbol: String, val they: String, val their: String) {
    MALE("Boy", "♂", "he", "his"),
    FEMALE("Girl", "♀", "she", "her"),
    MYSTERY("Mystery", "✶", "they", "their");
}

enum class Stage(val label: String, val minAgeHours: Double, val scale: Float) {
    EGG("Egg", 0.0, 0.8f),
    BABY("Baby", 0.0, 0.62f),
    CHILD("Child", 24.0, 0.74f),
    TEEN("Teen", 72.0, 0.86f),
    ADULT("Adult", 168.0, 1.0f),
    ELDER("Elder", 720.0, 0.96f);

    companion object {
        fun forAgeHours(hours: Double): Stage =
            entries.filter { it != EGG }.last { hours >= it.minAgeHours }
    }
}

enum class Personality(val label: String, val blurb: String) {
    CURIOUS("Curious", "Loves new codes and new signals."),
    FOODIE("Foodie", "Lives for the next snack."),
    SOCIAL("Social", "Makes friends with every Bluetooth device."),
    LAZY("Sleepy", "Naps whenever possible."),
    SPORTY("Sporty", "Wants to go on walks."),
    NERDY("Nerdy", "Loves chatting, riddles and satellites."),
}

enum class Pattern { PLAIN, SPOTS, STRIPES, STARS }

class Stats(
    var fullness: Double = 70.0,
    var happiness: Double = 70.0,
    var energy: Double = 85.0,
    var hygiene: Double = 85.0,
    var health: Double = 100.0,
    var fitness: Double = 20.0,
    var smarts: Double = 10.0,
    var social: Double = 15.0,
    var discipline: Double = 25.0,
) {
    fun clampAll() {
        fullness = clamp(fullness); happiness = clamp(happiness); energy = clamp(energy)
        hygiene = clamp(hygiene); health = clamp(health); fitness = clamp(fitness)
        smarts = clamp(smarts); social = clamp(social); discipline = clamp(discipline)
    }

    fun copy() = Stats(fullness, happiness, energy, hygiene, health, fitness, smarts, social, discipline)

    companion object {
        fun clamp(v: Double) = min(100.0, max(0.0, v))
    }
}

class Buddy(
    var name: String = "",
    var sex: Sex = Sex.MYSTERY,
    var seed: Long = 0L,
    var eggLaidAt: Long = 0L,
    var bornAt: Long = 0L,
    var level: Int = 1,
    var xp: Int = 0,
    var lives: Int = 3,
    var weight: Double = 12.0,
    var hue: Float = 160f,
    var pattern: Pattern = Pattern.PLAIN,
    var personality: Personality = Personality.CURIOUS,
    var accessory: String? = null,
    var asleep: Boolean = false,
    var sick: Boolean = false,
    var poops: Int = 0,
    var tantrum: Boolean = false,
    var generation: Int = 1,
    var stats: Stats = Stats(),
    var lastUpdate: Long = 0L,
    var sleptAt: Long = 0L,
    var hoursNeglected: Double = 0.0,
    var dead: Boolean = false,
) {
    val hatched get() = bornAt > 0L

    fun ageHours(now: Long): Double = if (!hatched) 0.0 else (now - bornAt) / 3_600_000.0

    /** One real day = one buddy year, tamagotchi-style. */
    fun ageYears(now: Long): Int = (ageHours(now) / 24.0).toInt()

    fun stage(now: Long): Stage = if (!hatched) Stage.EGG else Stage.forAgeHours(ageHours(now))

    fun xpToNext(): Int = 60 + level * 30 + (level * level) / 2

    fun pronoun() = sex.they
}

data class LogEntry(val time: Long, val icon: String, val text: String)

data class Memorial(
    val name: String, val sex: Sex, val generation: Int, val level: Int,
    val ageYears: Int, val diedAt: Long, val cause: String,
)

data class Settings(
    var notifications: Boolean = true,
    var vibration: Boolean = true,
    var sounds: Boolean = true,
    var onlineProductLookup: Boolean = true,
    var autoSleepAtNight: Boolean = true,
)

/** A signal seen by the radar (Wi-Fi network or Bluetooth device). */
data class SignalInfo(
    val id: String,           // BSSID or MAC
    val name: String,         // SSID or device name (may be blank)
    val rssi: Int,
    val kind: SignalKind,
    val frequencyMhz: Int = 0,
    val secured: Boolean = true,
)

enum class SignalKind { WIFI, BLUETOOTH, BLE }

data class SatelliteInfo(
    val svid: Int,
    val constellation: String,
    val cn0: Float,
    val azimuth: Float,
    val elevation: Float,
    val usedInFix: Boolean,
)

class GameData(
    var buddy: Buddy = Buddy(),
    var coins: Int = 25,
    var ownerName: String = "",
    val inventory: MutableMap<String, Int> = mutableMapOf("kibble" to 3, "soap" to 1),
    val ownedCosmetics: MutableSet<String> = mutableSetOf(),
    val achievements: MutableMap<String, Long> = mutableMapOf(),
    val counters: MutableMap<String, Long> = mutableMapOf(),
    val codeLastEaten: MutableMap<String, Long> = mutableMapOf(),
    val codeTimesEaten: MutableMap<String, Int> = mutableMapOf(),
    val seenWifi: MutableSet<String> = mutableSetOf(),
    val seenBt: MutableSet<String> = mutableSetOf(),
    val friendNames: MutableList<String> = mutableListOf(),
    val constellations: MutableSet<String> = mutableSetOf(),
    val memory: MutableMap<String, String> = mutableMapOf(),
    val likes: MutableList<String> = mutableListOf(),
    val journal: MutableList<LogEntry> = mutableListOf(),
    val graveyard: MutableList<Memorial> = mutableListOf(),
    val daily: MutableMap<String, Long> = mutableMapOf(),
    var settings: Settings = Settings(),
    var lastFoodName: String = "",
    var favoriteFood: String = "",
    var bestScores: MutableMap<String, Int> = mutableMapOf(),
    var created: Long = 0L,
) {
    fun count(key: String): Long = counters[key] ?: 0L
    fun bump(key: String, by: Long = 1) { counters[key] = count(key) + by }
    fun setMax(key: String, value: Long) { if (value > count(key)) counters[key] = value }

    fun log(now: Long, icon: String, text: String) {
        journal.add(0, LogEntry(now, icon, text))
        while (journal.size > 150) journal.removeAt(journal.size - 1)
    }

    fun has(item: String) = (inventory[item] ?: 0) > 0
    fun addItem(item: String, n: Int = 1) { inventory[item] = (inventory[item] ?: 0) + n }
    fun takeItem(item: String): Boolean {
        val n = inventory[item] ?: 0
        if (n <= 0) return false
        if (n == 1) inventory.remove(item) else inventory[item] = n - 1
        return true
    }
}

/** Counter keys, kept in one place so achievements and stats screens agree. */
object C {
    const val SCANS = "scans"
    const val UNIQUE_CODES = "unique_codes"
    const val QR = "qr_scans"
    const val PRODUCT = "product_scans"
    const val INDUSTRIAL = "industrial_scans"
    const val EXOTIC = "exotic_scans"
    const val NFC = "nfc_scans"
    const val LEGENDARY = "legendary_foods"
    const val EPIC = "epic_foods"
    const val RARE = "rare_foods"
    const val WIFI = "wifi_seen"
    const val WIFI_OPEN = "wifi_open"
    const val WIFI_5G = "wifi_5g"
    const val WIFI_6G = "wifi_6g"
    const val BT = "bt_seen"
    const val BT_CLOSE = "bt_hugs"
    const val SATS_MAX = "sats_max"
    const val STARGAZES = "stargazes"
    const val STEPS = "steps"
    const val SHAKES = "shakes"
    const val PETS = "pets"
    const val CHATS = "chats"
    const val JOKES = "jokes"
    const val RIDDLES_SOLVED = "riddles_solved"
    const val GAMES = "games"
    const val GAME_WINS = "game_wins"
    const val CLEANS = "cleans"
    const val MEDS = "meds"
    const val SLEEPS = "sleeps"
    const val DEATHS = "deaths"
    const val PEEKABOO = "peekaboo"
    const val CHARGES = "charges"
    const val DANCES = "dances"
    const val PURCHASES = "purchases"
    const val COINS_EARNED = "coins_earned"
    const val RADAR_LOCKS = "radar_locks"
    const val ALTITUDE_MAX = "altitude_max"
    const val DARK_NAPS = "dark_naps"
    const val MAGNETS = "magnets"
    const val FEEDS = "feeds"
}
