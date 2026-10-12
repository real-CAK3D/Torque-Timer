package com.realcak3d.blipling

import com.realcak3d.blipling.core.*
import kotlin.random.Random
import kotlin.test.*
import org.junit.Test

class CoreTest {
    private val t0 = 1_760_000_000_000L
    private val hour = 3_600_000L

    private fun fresh(): Engine {
        val e = Engine(GameData(), Random(42))
        e.newEgg(t0)
        e.hatch("Pip", Sex.FEMALE, t0)
        return e
    }

    @Test fun foodIsDeterministicPerCode() {
        val a = FoodFactory.fromScan(ScanInput("012345678905", "UPC_A"))
        val b = FoodFactory.fromScan(ScanInput("012345678905", "UPC_A"))
        assertEquals(a, b)
        assertEquals(FoodFamily.GROCERY, a.family)
        assertEquals(FoodFamily.WEB, FoodFactory.fromScan(ScanInput("https://example.com", "QR_CODE")).family)
        assertEquals(FoodFamily.SIGNAL, FoodFactory.fromScan(ScanInput("WIFI:S:home;T:WPA;P:x;;", "QR_CODE")).family)
        assertEquals(FoodFamily.ELECTRIC, FoodFactory.fromScan(ScanInput("04A2B3C4", "NFC")).family)
    }

    @Test fun rarityDistributionLooksSane() {
        val counts = (0 until 20000).map { FoodFactory.fromScan(ScanInput("code$it", "QR_CODE")).rarity }.groupingBy { it }.eachCount()
        println("rarity: $counts")
        assertTrue((counts[Rarity.COMMON] ?: 0) > 10000)
        assertTrue((counts[Rarity.LEGENDARY] ?: 0) in 50..400)
    }

    @Test fun feedingRaisesFullnessAndRefusesRepeats() {
        val e = fresh()
        e.g.buddy.stats.fullness = 20.0
        val food = FoodFactory.fromScan(ScanInput("hello", "QR_CODE"))
        val ev1 = e.feed(food, t0 + 1000)
        assertTrue(ev1.any { it is GameEvent.Ate })
        assertTrue(e.g.buddy.stats.fullness > 20.0)
        assertEquals(1L, e.g.count(C.SCANS))
        assertTrue(e.g.achievements.containsKey("first_bite"))
        e.g.buddy.stats.fullness = 20.0
        e.feed(food, t0 + 2000)
        e.g.buddy.stats.fullness = 20.0
        val ev3 = e.feed(food, t0 + 3000)
        assertFalse(ev3.any { it is GameEvent.Ate }, "third time same day should be refused")
        e.g.buddy.stats.fullness = 20.0
        assertTrue(e.feed(food, t0 + 25 * hour).any { it is GameEvent.Ate }, "next day is fine")
    }

    @Test fun neglectEventuallyCostsALifeButNotOfflineShortTerm() {
        val e = fresh()
        e.tick(t0 + 30 * hour, offline = true)
        assertEquals(3, e.g.buddy.lives, "offline < 48h must not kill")
        assertTrue(e.g.buddy.stats.health >= 10.0)
        // Online neglect kills
        var now = t0 + 30 * hour
        repeat(200) { now += hour; e.tick(now) }
        assertTrue(e.g.buddy.lives < 3)
    }

    @Test fun gameOverAfterAllLives() {
        val e = fresh()
        e.g.buddy.lives = 1
        e.g.buddy.stats.fullness = 0.0
        e.g.buddy.stats.health = 1.0
        val ev = e.tick(t0 + hour)
        assertTrue(ev.any { it is GameEvent.GameOver })
        assertTrue(e.g.buddy.dead)
        assertEquals(1, e.g.graveyard.size)
        e.startNextGeneration(t0 + 2 * hour)
        assertEquals(2, e.g.buddy.generation)
        assertFalse(e.g.buddy.hatched)
    }

    @Test fun agingAndStages() {
        val e = fresh()
        assertEquals(Stage.BABY, e.g.buddy.stage(t0 + hour))
        assertEquals(Stage.CHILD, e.g.buddy.stage(t0 + 30 * hour))
        assertEquals(Stage.ADULT, e.g.buddy.stage(t0 + 200 * hour))
        assertEquals(Stage.ELDER, e.g.buddy.stage(t0 + 800 * hour))
        assertEquals(2, e.g.buddy.ageYears(t0 + 50 * hour))
    }

    @Test fun levelingGivesCoins() {
        val e = fresh()
        val coins = e.g.coins
        val ev = e.gainXp(1000, t0)
        assertTrue(ev.any { it is GameEvent.LevelUp })
        assertTrue(e.g.buddy.level > 3)
        assertTrue(e.g.coins > coins)
    }

    @Test fun signalsAndSky() {
        val e = fresh()
        val wifi = (1..5).map { SignalInfo("aa:$it", "Net$it", -60, SignalKind.WIFI, if (it == 1) 5180 else 2412, secured = it != 2) }
        e.onWifiScan(wifi, t0 + 1000)
        assertEquals(5L, e.g.count(C.WIFI))
        assertTrue("open_net" in e.g.achievements)
        assertTrue("five_g" in e.g.achievements)
        e.onWifiScan(wifi, t0 + 2000)
        assertEquals(5L, e.g.count(C.WIFI), "same networks don't recount")
        e.onBluetooth(listOf(SignalInfo("bt1", "Buds", -40, SignalKind.BLE)), t0 + 3000)
        assertTrue("bt_hug" in e.g.achievements)
        assertTrue("Buds" in e.g.friendNames)
        val sats = (1..14).map { SatelliteInfo(it, if (it % 2 == 0) "GPS" else if (it % 3 == 0) "Galileo" else "GLONASS", 30f, 0f, 45f, it < 8) }
        e.onSatellites(sats, t0 + 4000)
        assertTrue("stargazer" in e.g.achievements)
        assertTrue("constellations_3" in e.g.achievements)
        assertTrue("sats_12" in e.g.achievements)
    }

    @Test fun shopAndItems() {
        val e = fresh()
        e.g.coins = 100
        e.buy("medicine", t0)
        assertEquals(80, e.g.coins)
        e.g.buddy.sick = true
        e.useItem("medicine", t0)
        assertFalse(e.g.buddy.sick)
        e.buy("hat_party", t0)
        e.useItem("hat_party", t0)
        assertEquals("hat_party", e.g.buddy.accessory)
        e.g.coins = 0
        val ev = e.buy("cake", t0)
        assertTrue(ev.first() is GameEvent.Say)
        assertFalse(e.g.has("cake"))
    }

    @Test fun codecRoundTrip() {
        val e = fresh()
        e.feed(FoodFactory.fromScan(ScanInput("abc", "QR_CODE")), t0 + 5)
        e.onWifiScan(listOf(SignalInfo("x", "Home", -50, SignalKind.WIFI, 2412)), t0 + 10)
        e.g.ownerName = "Sam"; e.g.likes.add("pizza")
        e.g.graveyard.add(Memorial("Old", Sex.MALE, 1, 4, 3, t0, "illness"))
        val json = Codec.encode(e.g)
        val back = Codec.decode(json)
        assertEquals(json, Codec.encode(back))
        assertEquals("Pip", back.buddy.name)
        assertEquals(Sex.FEMALE, back.buddy.sex)
        assertEquals(1, back.graveyard.size)
        assertTrue(back.seenWifi.contains("x"))
    }

    @Test fun chatBrain() {
        val e = fresh()
        val c = ChatBrain(e, Random(1))
        val now = t0 + 1000
        fun say(s: String) = c.respond(s, now).text.also { println("> $s\n< $it") }
        say("hello")
        say("my name is sam")
        assertEquals("Sam", e.g.ownerName)
        assertTrue(say("what's my name").contains("Sam"))
        say("I like pizza and robots")
        assertTrue(e.g.likes.isNotEmpty())
        assertTrue(say("what is 12 * 7").contains("84"))
        assertTrue(say("roll 2d6").contains("🎲"))
        say("tell me a joke")
        say("riddle")
        say("I give up")
        say("how are you")
        say("how old are you")
        say("I feel sad")
        say("I want a new bike")
        say("are you a robot")
        say("the weather was strange today at the park")
        say("guess a number")
        repeat(8) { say("50") }
        say("rock")
        say("my favorite color is green")
        assertTrue(say("what is my favorite color").contains("green"))
        say("remember I parked on level 3")
        say("what do you remember")
        say("help")
        assertTrue(e.g.count(C.CHATS) > 10)
    }

    @Test fun phrasesStageStyling() {
        val r = Random(3)
        repeat(5) { println(Phrases.say(Topic.HUNGRY, Phrases.Ctx(name = "Pip", stage = Stage.BABY), r)) }
        repeat(5) { println(Phrases.say(Topic.IDLE_HAPPY, Phrases.Ctx(name = "Pip", stage = Stage.TEEN), r)) }
        Topic.entries.forEach { t -> val s = Phrases.say(t, Phrases.Ctx(), r); assertFalse(s.contains("{"), "unfilled token in $t: $s") }
    }

    @Test fun ambientNeverCrashes() {
        val e = fresh()
        var now = t0
        repeat(300) { now += 7 * 60_000L; e.tick(now); e.ambient(now) }
        println("after 35h: ${e.mood(now)} lives=${e.g.buddy.lives} journal=${e.g.journal.size}")
    }
}

class RadarTest {
    @Test fun findsStrongestHeading() {
        val r = RadarTracker()
        r.reset("x")
        val rnd = Random(9)
        repeat(3) {
            for (h in 0 until 360 step 5) {
                val diff = kotlin.math.abs(RadarTracker.angleDiff(h.toFloat(), 120f))
                val rssi = (-60 - diff / 18f + rnd.nextInt(-2, 3)).toInt()
                r.add(h.toFloat(), rssi)
            }
        }
        val b = r.bearing()
        println("bearing=$b confidence=${r.confidence()}")
        assertNotNull(b)
        assertTrue(kotlin.math.abs(RadarTracker.angleDiff(b, 120f)) < 25f)
        assertTrue(RadarTracker.distanceMeters(-59, SignalKind.BLE) in 0.9..1.1)
    }
}
