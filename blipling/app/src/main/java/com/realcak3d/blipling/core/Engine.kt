package com.realcak3d.blipling.core

import java.util.Calendar
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.random.Random

/** Visual hints for the UI's animations. */
enum class Anim { NONE, EAT, HAPPY, LOVE, SAD, SICK, SLEEP, WAKE, DIZZY, DANCE, LEVEL_UP, CLEAN, SPARKLE, SHOCK, HATCH, DIE, ANGRY }

sealed class GameEvent {
    data class Say(val text: String, val anim: Anim = Anim.NONE) : GameEvent()
    data class Unlocked(val achievement: Achievement) : GameEvent()
    data class LevelUp(val level: Int) : GameEvent()
    data class Ate(val food: Food, val multiplier: Double) : GameEvent()
    data class Died(val cause: String, val livesLeft: Int) : GameEvent()
    object GameOver : GameEvent()
    data class Coins(val amount: Int) : GameEvent()
}

/**
 * All game rules. Mutates [g] in place and returns events for the UI.
 * Times are epoch millis, passed in so tests can control the clock.
 */
class Engine(val g: GameData, private val rnd: Random = Random.Default) {

    private val b get() = g.buddy
    private val s get() = g.buddy.stats

    fun ctx(now: Long, food: String = "snack", thing: String = "thing", n: Int = 0) = Phrases.Ctx(
        name = b.name.ifBlank { "Buddy" }, owner = g.ownerName, stage = b.stage(now),
        food = food, thing = thing, n = n, happiness = s.happiness,
    )

    fun say(topic: Topic, now: Long, anim: Anim = Anim.NONE, food: String = "snack", thing: String = "thing", n: Int = 0) =
        GameEvent.Say(Phrases.say(topic, ctx(now, food, thing, n), rnd), anim)

    // ---------------------------------------------------------------- lifecycle

    fun newEgg(now: Long, keepGeneration: Boolean = false) {
        val gen = if (keepGeneration) b.generation + 1 else 1
        val seed = rnd.nextLong()
        val sr = Random(seed)
        g.buddy = Buddy(
            seed = seed, eggLaidAt = now, lastUpdate = now, generation = gen,
            hue = listOf(150f, 175f, 200f, 220f, 265f, 300f, 330f, 20f, 45f).random(sr),
            pattern = Pattern.entries.random(sr),
            personality = Personality.entries.random(sr),
        )
    }

    fun hatch(name: String, sex: Sex, now: Long): List<GameEvent> {
        if (b.eggLaidAt == 0L) newEgg(now)
        b.name = name.trim().take(16).ifBlank { "Blip" }
        b.sex = sex
        b.bornAt = now
        b.lastUpdate = now
        b.stats = Stats()
        if (g.created == 0L) g.created = now
        g.log(now, "🐣", "${b.name} hatched! Generation ${b.generation}.")
        return listOf(say(Topic.HATCH, now, Anim.HATCH)) + checkAchievements(now)
    }

    // ---------------------------------------------------------------- time

    /** Advance the simulation to [now]. Safe to call often; does nothing for tiny gaps. */
    fun tick(now: Long, offline: Boolean = false): List<GameEvent> {
        if (!b.hatched || b.dead) { b.lastUpdate = now; return emptyList() }
        val events = mutableListOf<GameEvent>()
        var last = b.lastUpdate.takeIf { it > 0 } ?: now
        if (now - last > 30L * 86_400_000L) last = now - 30L * 86_400_000L // ignore absurd gaps
        val hourMs = 3_600_000.0
        val startAge = b.ageYears(last)
        val longAbsence = (now - last) > 48 * 3_600_000L
        while (now - last >= 1_000) {
            val stepMs = min(now - last, 10 * 60_000L)
            val h = stepMs / hourMs
            step(h, last + stepMs, events, offline && !longAbsence)
            last += stepMs
            if (b.dead) break
        }
        b.lastUpdate = now
        val newAge = b.ageYears(now)
        if (newAge > startAge && !b.dead) {
            events += say(Topic.BIRTHDAY, now, Anim.SPARKLE, n = newAge)
            g.log(now, "🎂", "${b.name} turned $newAge!")
            grantCoins(10 * newAge, events)
        }
        events += checkAchievements(now)
        return events
    }

    private fun step(h: Double, at: Long, events: MutableList<GameEvent>, protectOffline: Boolean) {
        val p = b.personality
        val stageMult = when (b.stage(at)) { Stage.BABY -> 1.25; Stage.ELDER -> 0.85; else -> 1.0 }
        val night = isNight(at)
        if (b.asleep) {
            s.energy += 16 * h
            s.fullness -= 2.5 * h * stageMult
            s.hygiene -= 1.0 * h
            if (s.energy >= 100 && !(night && g.settings.autoSleepAtNight)) {
                b.asleep = false
                events += say(Topic.WAKE, at, Anim.WAKE)
                g.log(at, "☀️", "${b.name} woke up.")
            }
        } else {
            s.fullness -= (if (p == Personality.FOODIE) 7.0 else 5.5) * h * stageMult
            s.energy -= (if (p == Personality.LAZY) 6.0 else 4.5) * h * (if (night) 1.4 else 1.0)
            s.hygiene -= 3.0 * h
            s.happiness -= (if (p == Personality.SOCIAL) 4.5 else 3.5) * h
            s.social -= 1.5 * h
            if (s.energy <= 3) {
                b.asleep = true; b.sleptAt = at
                events += say(Topic.GOODNIGHT, at, Anim.SLEEP)
                g.log(at, "😴", "${b.name} passed out from exhaustion.")
            }
        }
        // Poop roughly every 4-5 hours awake, more when well fed.
        if (!b.asleep && s.fullness > 20 && rnd.nextDouble() < 0.22 * h * (s.fullness / 70.0)) {
            b.poops = min(4, b.poops + 1)
            s.hygiene -= 8
            events += say(Topic.POOPED, at)
        }
        s.hygiene -= b.poops * 1.5 * h
        // Sickness
        val risk = (if (s.hygiene < 25) 0.10 else 0.0) + (if (b.poops >= 3) 0.10 else 0.0) +
            (if (s.fullness < 10) 0.08 else 0.0) + (if (b.weight > 40) 0.05 else 0.0)
        if (!b.sick && risk > 0 && rnd.nextDouble() < risk * h) {
            b.sick = true
            events += say(Topic.SICK, at, Anim.SICK)
            g.log(at, "🤒", "${b.name} got sick.")
        }
        // Health
        var dmg = 0.0
        if (s.fullness <= 0.5) dmg += 6
        if (s.hygiene <= 5) dmg += 2
        if (b.sick) dmg += 3
        if (s.happiness <= 2) dmg += 1
        if (dmg > 0) {
            s.health -= dmg * h
            b.hoursNeglected += h
        } else {
            s.health += 2 * h
            b.hoursNeglected = max(0.0, b.hoursNeglected - h)
        }
        // Tantrums: sometimes a buddy just wants attention. Scolding builds discipline.
        if (!b.tantrum && !b.asleep && rnd.nextDouble() < 0.05 * h * (1 - s.discipline / 120.0)) {
            b.tantrum = true
            events += say(Topic.TANTRUM, at, Anim.ANGRY)
        }
        s.clampAll()
        if (protectOffline && s.health < 10) s.health = 10.0
        if (s.health <= 0) die(at, causeOfDeath(), events)
    }

    private fun causeOfDeath() = when {
        s.fullness <= 1 -> "starvation"
        b.sick -> "illness"
        s.hygiene <= 5 -> "a very messy room"
        else -> "a broken heart"
    }

    private fun die(now: Long, cause: String, events: MutableList<GameEvent>) {
        g.bump(C.DEATHS)
        b.lives -= 1
        if (b.lives > 0) {
            g.log(now, "💔", "${b.name} fainted from $cause and used an extra life. ${b.lives} left.")
            events += GameEvent.Died(cause, b.lives)
            b.stats = Stats(fullness = 50.0, happiness = 40.0, energy = 60.0, hygiene = 70.0, health = 60.0,
                fitness = s.fitness, smarts = s.smarts, social = s.social, discipline = s.discipline)
            b.sick = false; b.poops = 0; b.asleep = false; b.tantrum = false
            events += say(Topic.REVIVED, now, Anim.SPARKLE)
        } else {
            b.dead = true
            g.graveyard.add(0, Memorial(b.name, b.sex, b.generation, b.level, b.ageYears(now), now, cause))
            g.log(now, "🪦", "${b.name} has gone to the great server in the sky ($cause).")
            events += GameEvent.Died(cause, 0)
            events += GameEvent.GameOver
        }
    }

    fun startNextGeneration(now: Long) {
        newEgg(now, keepGeneration = true)
        g.log(now, "🥚", "A new egg appeared. Generation ${b.generation}.")
    }

    // ---------------------------------------------------------------- care actions

    fun feed(food: Food, now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        if (!b.hatched) return ev
        if (b.asleep) { ev += say(Topic.ASLEEP_TAP, now, Anim.SLEEP); return ev }
        val lastEaten = g.codeLastEaten[food.key]
        val todayCount = if (lastEaten != null && now - lastEaten < 20 * 3_600_000L) (g.codeTimesEaten[food.key] ?: 0) else 0
        if (food.family != FoodFamily.PANTRY && todayCount >= 2) { ev += say(Topic.REFUSE_FOOD, now, Anim.ANGRY, food = food.name); return ev }
        if (s.fullness >= 96) { ev += say(Topic.FULL, now); return ev }

        val firstEver = food.family != FoodFamily.PANTRY && food.key !in g.codeLastEaten
        val mult = if (food.family == FoodFamily.PANTRY) 1.0 else when (todayCount) { 0 -> 1.0; else -> 0.35 }
        val wasOverfull = s.fullness > 85
        s.fullness += food.fullness * mult
        s.happiness += food.happiness * mult
        s.energy += food.energy * mult
        s.health += food.health * (if (food.health < 0) 1.0 else mult)
        s.hygiene += food.hygiene
        b.weight = max(5.0, b.weight + food.weight)
        if (wasOverfull) { b.weight += 0.6; if (rnd.nextInt(4) == 0) { b.sick = true; ev += say(Topic.SICK, now, Anim.SICK) } }
        if (food.trait == FoodTrait.SPOILED && rnd.nextInt(2) == 0) b.sick = true
        s.clampAll()

        g.codeLastEaten[food.key] = now
        g.codeTimesEaten[food.key] = todayCount + 1
        g.lastFoodName = food.name
        g.bump(C.FEEDS)
        if (food.family != FoodFamily.PANTRY) {
            g.bump(C.SCANS)
            if (firstEver) g.bump(C.UNIQUE_CODES)
            when (food.family) {
                FoodFamily.GROCERY -> g.bump(C.PRODUCT)
                FoodFamily.INDUSTRIAL -> g.bump(C.INDUSTRIAL)
                FoodFamily.EXOTIC -> g.bump(C.EXOTIC)
                FoodFamily.ELECTRIC -> g.bump(C.NFC)
                FoodFamily.DATA, FoodFamily.WEB, FoodFamily.SIGNAL, FoodFamily.SOCIAL, FoodFamily.MAP -> g.bump(C.QR)
                else -> {}
            }
            when (food.rarity) {
                Rarity.LEGENDARY -> g.bump(C.LEGENDARY)
                Rarity.EPIC -> g.bump(C.EPIC)
                Rarity.RARE -> g.bump(C.RARE)
                else -> {}
            }
            if (food.rarity.stars >= 3) g.favoriteFood = food.name
        }
        ev += GameEvent.Ate(food, mult)
        val topic = when {
            food.trait == FoodTrait.SPOILED -> Topic.ATE_SPOILED
            food.rarity == Rarity.LEGENDARY -> Topic.ATE_LEGENDARY
            food.rarity.stars >= 3 -> Topic.ATE_RARE
            todayCount > 0 -> Topic.ATE_REPEAT
            food.family == FoodFamily.ELECTRIC -> Topic.NFC
            food.trait == FoodTrait.SPICY -> Topic.ATE_SPICY
            food.trait == FoodTrait.JUNK -> Topic.ATE_JUNK
            food.trait == FoodTrait.HEALTHY -> Topic.ATE_HEALTHY
            else -> Topic.ATE
        }
        ev += say(topic, now, if (food.trait == FoodTrait.SPOILED) Anim.SICK else Anim.EAT, food = food.name)
        val xp = (food.xp * mult * (if (firstEver) 1.5 else 1.0) * (if (b.personality == Personality.FOODIE) 1.2 else 1.0)).toInt()
        ev += gainXp(xp, now)
        if (firstEver && food.coins > 0) grantCoins(food.coins, ev)
        g.log(now, food.family.emoji, "Ate ${food.name} (${food.rarity.label}${if (food.trait != FoodTrait.NONE) ", ${food.trait.label}" else ""}).")
        ev += checkAchievements(now)
        return ev
    }

    fun pet(now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        if (!b.hatched) return listOf(GameEvent.Say("*the egg wobbles happily*", Anim.HAPPY))
        if (b.asleep) return listOf(say(Topic.ASLEEP_TAP, now, Anim.SLEEP))
        g.bump(C.PETS)
        val recent = g.daily["pet_window"] ?: 0L
        val streak = if (now - recent < 60_000) (g.daily["pet_streak"] ?: 0L) + 1 else 1L
        g.daily["pet_window"] = now; g.daily["pet_streak"] = streak
        if (streak > 12) {
            s.happiness -= 1
            ev += say(Topic.OVERPETTED, now, Anim.DIZZY)
        } else {
            s.happiness += 3; s.social += 1.5
            if (b.tantrum && streak > 4) b.tantrum = false
            ev += say(Topic.PETTED, now, Anim.LOVE)
            if (streak % 4 == 1L) ev += gainXp(1, now)
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun clean(now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        if (!b.hatched) return ev
        val hadPoop = b.poops > 0
        b.poops = 0
        if (g.takeItem("soap")) {
            s.hygiene = 100.0; s.happiness += 4
        } else {
            s.hygiene += if (hadPoop) 25.0 else 12.0
        }
        g.bump(C.CLEANS)
        s.clampAll()
        ev += say(Topic.CLEANED, now, Anim.CLEAN)
        ev += gainXp(2, now)
        g.log(now, "🧽", "Cleaned up ${b.name}.")
        ev += checkAchievements(now)
        return ev
    }

    fun medicine(now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        if (!g.takeItem("medicine")) return listOf(GameEvent.Say("We're out of medicine! The shop has some.", Anim.SAD))
        b.sick = false
        s.health = min(100.0, s.health + 35); s.happiness -= 4
        g.bump(C.MEDS)
        s.clampAll()
        ev += say(Topic.CURED, now, Anim.SPARKLE)
        g.log(now, "💊", "Gave ${b.name} medicine.")
        ev += checkAchievements(now)
        return ev
    }

    fun toggleSleep(now: Long, darkRoom: Boolean = false): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        if (!b.hatched) return ev
        if (b.asleep) {
            b.asleep = false
            if (s.energy < 50) s.happiness -= 6
            ev += say(Topic.WAKE, now, Anim.WAKE)
        } else {
            if (s.energy > 85 && !isNight(now)) {
                return listOf(GameEvent.Say("I'm not sleepy! Let's play!", Anim.ANGRY))
            }
            b.asleep = true; b.sleptAt = now
            g.bump(C.SLEEPS)
            if (darkRoom) { g.bump(C.DARK_NAPS); s.happiness += 4 }
            ev += say(Topic.GOODNIGHT, now, Anim.SLEEP)
            g.log(now, "🌙", "Tucked ${b.name} into bed.")
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun scold(now: Long): List<GameEvent> {
        if (!b.hatched) return emptyList()
        return if (b.tantrum) {
            b.tantrum = false; s.discipline += 12; s.happiness -= 3; s.clampAll()
            listOf(say(Topic.SCOLDED, now, Anim.SAD))
        } else {
            s.happiness -= 8; s.clampAll()
            listOf(GameEvent.Say("Hey! I didn't do anything! ${Phrases.sadEmotes.random(rnd)}", Anim.SAD))
        }
    }

    fun praise(now: Long): List<GameEvent> {
        if (!b.hatched) return emptyList()
        if (b.tantrum) { s.discipline -= 4; s.clampAll(); return listOf(GameEvent.Say("Hehe, I can get away with anything!", Anim.HAPPY)) }
        s.happiness += 5; s.discipline += 2; s.clampAll()
        return listOf(say(Topic.PRAISED, now, Anim.HAPPY))
    }

    // ---------------------------------------------------------------- shop & items

    fun buy(itemId: String, now: Long): List<GameEvent> {
        val item = Items.byId[itemId] ?: return emptyList()
        if (b.level < item.minLevel) return listOf(GameEvent.Say("That unlocks at level ${item.minLevel}!", Anim.NONE))
        if (item.kind != ItemKind.CONSUMABLE && itemId in g.ownedCosmetics) return listOf(GameEvent.Say("We already own that!", Anim.NONE))
        if (g.coins < item.price) return listOf(say(Topic.BROKE, now, Anim.SAD))
        g.coins -= item.price
        g.bump(C.PURCHASES)
        if (item.kind == ItemKind.CONSUMABLE) g.addItem(itemId) else g.ownedCosmetics.add(itemId)
        g.log(now, item.icon, "Bought ${item.name} for ${item.price} coins.")
        return listOf(say(Topic.BOUGHT, now, Anim.HAPPY, thing = item.name)) + checkAchievements(now)
    }

    fun useItem(itemId: String, now: Long): List<GameEvent> {
        val item = Items.byId[itemId] ?: return emptyList()
        if (item.kind == ItemKind.COSMETIC) {
            b.accessory = if (b.accessory == itemId) null else itemId
            return listOf(GameEvent.Say(if (b.accessory == null) "Back to my natural look!" else "How do I look? ${Phrases.emotes.random(rnd)}", Anim.SPARKLE))
        }
        if (item.kind == ItemKind.PAINT) {
            val hue = Items.paintHue[itemId] ?: return emptyList()
            b.hue = hue
            return listOf(GameEvent.Say("Ooh, a fresh coat of paint!", Anim.SPARKLE))
        }
        if (!b.hatched) return listOf(GameEvent.Say("Wait until I hatch!", Anim.NONE))
        if (itemId == "kibble") {
            if (!g.has("kibble")) return emptyList()
            val ev = feed(FoodFactory.kibble(), now)
            if (ev.any { it is GameEvent.Ate }) g.takeItem("kibble")
            return ev
        }
        if (itemId == "medicine") return medicine(now)
        if (itemId == "soap") { return if (g.has("soap")) clean(now) else emptyList() }
        if (!g.takeItem(itemId)) return emptyList()
        val ev = mutableListOf<GameEvent>()
        when (itemId) {
            "vitamin" -> { s.health += 15; if (rnd.nextInt(3) == 0) b.sick = false; ev += GameEvent.Say("Vitamins! I feel sturdier.", Anim.SPARKLE) }
            "soda" -> { s.energy += 30; b.asleep = false; ev += GameEvent.Say("BZZZT! Energy!!", Anim.SHOCK) }
            "cake" -> { s.happiness += 30; s.fullness += 20; b.weight += 1.5; ev += GameEvent.Say("CAKE! Best day ever!", Anim.LOVE) }
            "ball" -> { s.happiness += 20; s.fitness += 6; s.energy -= 8; b.weight -= 0.4; ev += GameEvent.Say("Fetch! Again! Again!", Anim.HAPPY) }
            "book" -> { s.smarts += 10; s.happiness += 10; ev += GameEvent.Say(Phrases.randomStory(b.name, rnd), Anim.HAPPY) }
            "xp_chip" -> { ev += GameEvent.Say("*installs XP chip* Whoa!", Anim.SPARKLE); ev += gainXp(75, now) }
            "one_up" -> {
                if (b.lives >= 5) { g.addItem("one_up"); return listOf(GameEvent.Say("I already have the max 5 lives!", Anim.NONE)) }
                b.lives += 1; ev += GameEvent.Say("An extra life! I feel invincible! ❤️", Anim.SPARKLE)
            }
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    // ---------------------------------------------------------------- play

    /** [score] is game-specific; [won] decides the reaction. */
    fun gameFinished(game: String, score: Int, won: Boolean, now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        g.bump(C.GAMES)
        if (score > (g.bestScores[game] ?: 0)) g.bestScores[game] = score
        if (b.hatched && !b.asleep) {
            s.happiness += if (won) 14 else 7
            s.energy -= 7; s.fitness += 2; s.smarts += 1; s.fullness -= 3
            b.weight = max(5.0, b.weight - 0.2)
        }
        if (won) g.bump(C.GAME_WINS)
        val coins = (score / 4).coerceIn(1, 40) + if (won) 5 else 0
        grantCoins(coins, ev)
        ev += say(if (won) Topic.GAME_WIN else Topic.GAME_LOSE, now, if (won) Anim.HAPPY else Anim.SAD)
        ev += gainXp(if (won) 12 else 5, now)
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun chatted(now: Long, xpBonus: Int = 0): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        g.bump(C.CHATS)
        if (b.hatched) {
            s.social += 1.2; s.smarts += 0.4; s.happiness += 0.8
            s.clampAll()
            if (g.count(C.CHATS) % 3 == 0L) ev += gainXp((2 + xpBonus) * (if (b.accessory == "glasses") 2 else 1), now)
        }
        ev += checkAchievements(now)
        return ev
    }

    // ---------------------------------------------------------------- sensors & signals

    fun onWifiScan(results: List<SignalInfo>, now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        if (results.isEmpty()) {
            if (onceEvery("wifi_none", now, 30 * 60_000L)) ev += say(Topic.WIFI_NONE, now)
            return ev
        }
        var fresh = 0
        for (r in results) {
            if (g.seenWifi.add(r.id)) {
                fresh++
                g.bump(C.WIFI)
                if (!r.secured) g.bump(C.WIFI_OPEN)
                if (r.frequencyMhz in 4900..5899) g.bump(C.WIFI_5G)
                if (r.frequencyMhz >= 5925) g.bump(C.WIFI_6G)
            }
        }
        if (fresh > 0 && b.hatched) {
            s.happiness += min(8.0, fresh * 1.0)
            if (b.personality == Personality.CURIOUS) s.happiness += 2
            ev += gainXp(min(30, fresh * 2), now)
            ev += say(Topic.WIFI_FOUND, now, Anim.SPARKLE, n = results.size)
            if (results.any { !it.secured } && rnd.nextInt(3) == 0) ev += say(Topic.WIFI_OPEN, now)
            g.log(now, "📶", "Sniffed $fresh new Wi-Fi network${if (fresh == 1) "" else "s"} (${results.size} in range).")
        }
        // Strongest network = a little energy snack, once per hour.
        val strongest = results.maxByOrNull { it.rssi }
        if (strongest != null && strongest.rssi > -55 && b.hatched && !b.asleep && onceEvery("wifi_snack", now, 3_600_000L)) {
            s.energy += 6; s.fullness += 3
            ev += GameEvent.Say("*slurps packets from ${strongest.name.ifBlank { "a hidden network" }}* Tasty!", Anim.EAT)
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun onBluetooth(devices: List<SignalInfo>, now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        val freshNamed = mutableListOf<String>()
        var fresh = 0
        for (d in devices) {
            if (g.seenBt.add(d.id)) {
                fresh++
                g.bump(C.BT)
                if (d.name.isNotBlank()) {
                    freshNamed += d.name
                    if (d.name !in g.friendNames) { g.friendNames.add(0, d.name); if (g.friendNames.size > 200) g.friendNames.removeAt(g.friendNames.size - 1) }
                }
            }
        }
        if (fresh > 0 && b.hatched) {
            val mult = if (b.personality == Personality.SOCIAL) 2.0 else 1.0
            s.social += min(10.0, fresh * 1.5 * mult); s.happiness += min(6.0, fresh * 0.8 * mult)
            ev += gainXp(min(25, fresh * 2), now)
            if (freshNamed.isNotEmpty()) ev += say(Topic.BT_FOUND, now, Anim.HAPPY, thing = freshNamed.first())
            g.log(now, "🔵", "Met $fresh new Bluetooth device${if (fresh == 1) "" else "s"}${if (freshNamed.isNotEmpty()) ": " + freshNamed.take(3).joinToString() else ""}.")
        }
        val close = devices.filter { it.rssi > -45 }.maxByOrNull { it.rssi }
        if (close != null && b.hatched && onceEvery("bt_hug", now, 20 * 60_000L)) {
            g.bump(C.BT_CLOSE)
            s.happiness += 5; s.social += 4
            ev += say(Topic.BT_HUG, now, Anim.LOVE, thing = close.name.ifBlank { "a mystery device" })
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun onRadarLock(target: SignalInfo, now: Long): List<GameEvent> {
        if (!onceEvery("lock_${target.id}", now, 30 * 60_000L)) return emptyList()
        g.bump(C.RADAR_LOCKS)
        val ev = mutableListOf<GameEvent>(say(Topic.RADAR_LOCK, now, Anim.SPARKLE))
        if (b.hatched) { s.happiness += 6; ev += gainXp(10, now) }
        grantCoins(3, ev)
        g.log(now, "🎯", "Radar locked on to ${target.name.ifBlank { target.id }}.")
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun onSatellites(sats: List<SatelliteInfo>, now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        if (sats.isEmpty()) return ev
        g.setMax(C.SATS_MAX, sats.size.toLong())
        val newSystems = sats.map { it.constellation }.toSet().filter { g.constellations.add(it) }
        if (newSystems.isNotEmpty()) {
            g.log(now, "🛰️", "First contact with ${newSystems.joinToString()} satellites!")
            if (b.hatched) ev += GameEvent.Say("New space friends: ${newSystems.joinToString()}! ${Phrases.emotes.random(rnd)}", Anim.SPARKLE)
        }
        val used = sats.count { it.usedInFix }
        if (sats.size >= 4 && b.hatched && onceEvery("stargaze", now, 3_600_000L)) {
            g.bump(C.STARGAZES)
            s.happiness += 6; s.smarts += 3
            if (b.personality == Personality.NERDY) s.happiness += 4
            ev += say(Topic.SATELLITES, now, Anim.SPARKLE, n = sats.size)
            ev += gainXp(8 + used, now)
            g.log(now, "✨", "Stargazed: ${sats.size} satellites visible, $used locked.")
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun onSteps(delta: Int, now: Long): List<GameEvent> {
        if (delta <= 0) return emptyList()
        val ev = mutableListOf<GameEvent>()
        val before = g.count(C.STEPS)
        g.bump(C.STEPS, delta.toLong())
        val after = g.count(C.STEPS)
        if (b.hatched && !b.asleep) {
            val k = delta / 100.0
            val sporty = if (b.personality == Personality.SPORTY) 1.5 else 1.0
            s.fitness += 0.8 * k * sporty; s.happiness += 0.6 * k * sporty; s.fullness -= 0.6 * k; s.energy -= 0.5 * k
            b.weight = max(5.0, b.weight - 0.03 * k)
            if (after / 500 > before / 500) {
                ev += say(Topic.STEPS, now, Anim.HAPPY, n = after.toInt())
                ev += gainXp(5, now)
            }
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun onShake(now: Long): List<GameEvent> {
        g.bump(C.SHAKES)
        if (!b.hatched) return listOf(GameEvent.Say("*the egg rattles* ...", Anim.DIZZY))
        val recent = g.daily["shake_window"] ?: 0L
        val streak = if (now - recent < 20_000) (g.daily["shake_streak"] ?: 0L) + 1 else 1L
        g.daily["shake_window"] = now; g.daily["shake_streak"] = streak
        val ev = mutableListOf<GameEvent>()
        if (b.asleep) {
            b.asleep = false; s.happiness -= 8
            ev += GameEvent.Say("WHOA! I'm awake! I'm awake!", Anim.SHOCK)
        } else if (streak > 4) {
            s.happiness -= 3; s.energy -= 2
            ev += say(Topic.DIZZY, now, Anim.DIZZY)
        } else {
            s.happiness += 2; s.energy -= 1
            ev += say(Topic.SHAKEN, now, Anim.HAPPY)
        }
        s.clampAll()
        ev += checkAchievements(now)
        return ev
    }

    fun onDark(now: Long): List<GameEvent> {
        if (!b.hatched || b.asleep || !onceEvery("dark", now, 20 * 60_000L)) return emptyList()
        if (s.energy < 45 || isNight(now)) return listOf(say(Topic.DARK, now, Anim.SLEEP))
        return emptyList()
    }

    fun onPeekaboo(now: Long): List<GameEvent> {
        if (!b.hatched || b.asleep || !onceEvery("peek", now, 4_000L)) return emptyList()
        g.bump(C.PEEKABOO)
        s.happiness += 2; s.clampAll()
        return listOf(say(Topic.PEEKABOO, now, Anim.HAPPY)) + checkAchievements(now)
    }

    fun onCharging(now: Long): List<GameEvent> {
        if (!b.hatched || !onceEvery("charge", now, 2 * 3_600_000L)) return emptyList()
        g.bump(C.CHARGES)
        s.energy += 10; s.clampAll()
        return listOf(say(Topic.CHARGING, now, Anim.SHOCK)) + checkAchievements(now)
    }

    fun onLoudSound(now: Long): List<GameEvent> {
        if (!b.hatched || !onceEvery("dance", now, 8_000L)) return emptyList()
        if (b.asleep) { b.asleep = false; s.happiness -= 5; s.clampAll(); return listOf(GameEvent.Say("Huh?! What was that noise?!", Anim.SHOCK)) }
        g.bump(C.DANCES)
        s.happiness += 3; s.fitness += 1; s.energy -= 1; s.clampAll()
        return listOf(say(Topic.LOUD, now, Anim.DANCE)) + checkAchievements(now)
    }

    fun onMagnet(microTesla: Float, now: Long): List<GameEvent> {
        if (microTesla < 200 || !onceEvery("magnet", now, 10 * 60_000L)) return emptyList()
        g.bump(C.MAGNETS)
        return listOf(say(Topic.MAGNET, now, Anim.SHOCK)) + checkAchievements(now)
    }

    fun onAltitude(meters: Double, now: Long): List<GameEvent> {
        if (meters.isNaN()) return emptyList()
        val wasMax = g.count(C.ALTITUDE_MAX)
        g.setMax(C.ALTITUDE_MAX, meters.toLong())
        val ev = mutableListOf<GameEvent>()
        if (meters > 1000 && wasMax < 1000) ev += say(Topic.HIGH_ALTITUDE, now, Anim.SPARKLE)
        ev += checkAchievements(now)
        return ev
    }

    // ---------------------------------------------------------------- moods & ambient chatter

    fun mood(now: Long): String = when {
        !b.hatched -> "Waiting to hatch"
        b.dead -> "Gone"
        b.asleep -> "Sleeping"
        b.sick -> "Sick"
        b.tantrum -> "Throwing a tantrum"
        s.fullness < 20 -> "Starving"
        s.hygiene < 25 || b.poops >= 2 -> "Stinky"
        s.energy < 20 -> "Exhausted"
        s.happiness < 25 -> "Sad"
        s.happiness > 80 && s.fullness > 50 -> "Ecstatic"
        s.happiness > 60 -> "Happy"
        else -> "Okay"
    }

    /** Something to say when the user is just watching. Picks the most pressing need first. */
    fun ambient(now: Long): GameEvent.Say {
        if (!b.hatched) return GameEvent.Say(listOf("*wobble*", "*tap tap from inside*", "*the egg glows faintly*", "Scan a code to hatch me!").random(rnd))
        val topic = when {
            b.asleep -> Topic.ASLEEP_TAP
            b.sick -> Topic.SICK
            b.tantrum -> Topic.TANTRUM
            s.fullness < 12 -> Topic.STARVING
            s.fullness < 35 -> Topic.HUNGRY
            s.hygiene < 30 || b.poops >= 2 -> Topic.DIRTY
            s.energy < 25 -> Topic.SLEEPY
            s.happiness < 30 -> Topic.IDLE_SAD
            isNight(now) && rnd.nextInt(3) == 0 -> Topic.NIGHT
            s.happiness < 55 -> Topic.IDLE_BORED
            else -> Topic.IDLE_HAPPY
        }
        val anim = when (topic) { Topic.SICK -> Anim.SICK; Topic.TANTRUM -> Anim.ANGRY; Topic.IDLE_SAD, Topic.STARVING -> Anim.SAD; Topic.ASLEEP_TAP -> Anim.SLEEP; else -> Anim.NONE }
        if (topic == Topic.IDLE_HAPPY && rnd.nextInt(4) == 0) {
            val extras = buildList {
                add("Fun fact: ${Phrases.facts.random(rnd)}")
                if (g.favoriteFood.isNotBlank()) add("I keep thinking about that ${g.favoriteFood}...")
                if (g.friendNames.isNotEmpty()) add("I wonder how ${g.friendNames.random(rnd)} is doing.")
                if (g.likes.isNotEmpty()) add("You like ${g.likes.random(rnd)}, right? I remember!")
                if (g.count(C.WIFI) > 0) add("I've sniffed ${g.count(C.WIFI)} Wi-Fi networks so far!")
            }
            return GameEvent.Say(Phrases.stylize(extras.random(rnd), ctx(now), rnd), Anim.HAPPY)
        }
        return say(topic, now, anim)
    }

    // ---------------------------------------------------------------- progression

    fun gainXp(amount: Int, now: Long): List<GameEvent> {
        if (amount <= 0 || !b.hatched) return emptyList()
        b.xp += amount
        return settleLevels(now)
    }

    private fun settleLevels(now: Long): List<GameEvent> {
        val ev = mutableListOf<GameEvent>()
        while (b.xp >= b.xpToNext() && b.level < 99) {
            b.xp -= b.xpToNext()
            b.level += 1
            ev += GameEvent.LevelUp(b.level)
            ev += say(Topic.LEVEL_UP, now, Anim.LEVEL_UP, n = b.level)
            grantCoins(10 + b.level * 2, ev)
            if (b.level % 10 == 0 && b.lives < 5) { b.lives += 1; ev += GameEvent.Say("Bonus life for reaching level ${b.level}! ❤️", Anim.SPARKLE) }
            g.log(now, "⭐", "${b.name} reached level ${b.level}!")
        }
        return ev
    }

    fun grantCoins(n: Int, ev: MutableList<GameEvent>) {
        if (n <= 0) return
        g.coins += n
        g.bump(C.COINS_EARNED, n.toLong())
        ev += GameEvent.Coins(n)
    }

    fun checkAchievements(now: Long): List<GameEvent> {
        val out = mutableListOf<GameEvent>()
        for (a in Achievements.check(g, now)) {
            out += GameEvent.Unlocked(a)
            g.log(now, a.icon, "Achievement: ${a.title}")
            grantCoins(a.coins, out)
            if (b.hatched) { b.xp += a.coins / 2 }
        }
        if (out.isNotEmpty() && b.hatched) out += settleLevels(now)
        return out
    }

    // ---------------------------------------------------------------- helpers

    fun onceEvery(key: String, now: Long, periodMs: Long): Boolean {
        val last = g.daily[key] ?: 0L
        if (abs(now - last) < periodMs) return false
        g.daily[key] = now
        return true
    }

    fun isNight(now: Long): Boolean {
        val c = Calendar.getInstance().apply { timeInMillis = now }
        val h = c.get(Calendar.HOUR_OF_DAY)
        return h >= 22 || h < 7
    }
}
