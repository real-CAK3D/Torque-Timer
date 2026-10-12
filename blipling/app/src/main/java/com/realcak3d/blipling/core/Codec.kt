package com.realcak3d.blipling.core

import org.json.JSONArray
import org.json.JSONObject

/** Save-file format. Unknown/missing fields fall back to defaults so old saves keep loading. */
object Codec {
    const val VERSION = 1

    fun encode(g: GameData): String {
        val b = g.buddy
        val s = b.stats
        val o = JSONObject()
        o.put("v", VERSION)
        o.put("buddy", JSONObject().apply {
            put("name", b.name); put("sex", b.sex.name); put("seed", b.seed); put("eggLaidAt", b.eggLaidAt)
            put("bornAt", b.bornAt); put("level", b.level); put("xp", b.xp); put("lives", b.lives); put("weight", b.weight)
            put("hue", b.hue.toDouble()); put("pattern", b.pattern.name); put("personality", b.personality.name)
            put("accessory", b.accessory ?: ""); put("asleep", b.asleep); put("sick", b.sick); put("poops", b.poops)
            put("tantrum", b.tantrum); put("generation", b.generation); put("lastUpdate", b.lastUpdate)
            put("sleptAt", b.sleptAt); put("hoursNeglected", b.hoursNeglected); put("dead", b.dead)
            put("stats", JSONObject().apply {
                put("fullness", s.fullness); put("happiness", s.happiness); put("energy", s.energy); put("hygiene", s.hygiene)
                put("health", s.health); put("fitness", s.fitness); put("smarts", s.smarts); put("social", s.social)
                put("discipline", s.discipline)
            })
        })
        o.put("coins", g.coins)
        o.put("ownerName", g.ownerName)
        o.put("inventory", JSONObject(g.inventory as Map<*, *>))
        o.put("cosmetics", JSONArray(g.ownedCosmetics.toList()))
        o.put("achievements", JSONObject(g.achievements as Map<*, *>))
        o.put("counters", JSONObject(g.counters as Map<*, *>))
        o.put("codeLastEaten", JSONObject(g.codeLastEaten as Map<*, *>))
        o.put("codeTimesEaten", JSONObject(g.codeTimesEaten as Map<*, *>))
        o.put("seenWifi", JSONArray(g.seenWifi.toList()))
        o.put("seenBt", JSONArray(g.seenBt.toList()))
        o.put("friendNames", JSONArray(g.friendNames))
        o.put("constellations", JSONArray(g.constellations.toList()))
        o.put("memory", JSONObject(g.memory as Map<*, *>))
        o.put("likes", JSONArray(g.likes))
        o.put("journal", JSONArray().apply { g.journal.forEach { put(JSONObject().put("t", it.time).put("i", it.icon).put("x", it.text)) } })
        o.put("graveyard", JSONArray().apply {
            g.graveyard.forEach {
                put(JSONObject().put("name", it.name).put("sex", it.sex.name).put("gen", it.generation).put("level", it.level)
                    .put("age", it.ageYears).put("diedAt", it.diedAt).put("cause", it.cause))
            }
        })
        o.put("daily", JSONObject(g.daily as Map<*, *>))
        o.put("settings", JSONObject().apply {
            put("notifications", g.settings.notifications); put("vibration", g.settings.vibration); put("sounds", g.settings.sounds)
            put("online", g.settings.onlineProductLookup); put("autoSleep", g.settings.autoSleepAtNight)
        })
        o.put("lastFoodName", g.lastFoodName)
        o.put("favoriteFood", g.favoriteFood)
        o.put("bestScores", JSONObject(g.bestScores as Map<*, *>))
        o.put("created", g.created)
        return o.toString()
    }

    fun decode(json: String): GameData {
        val o = JSONObject(json)
        val g = GameData()
        o.optJSONObject("buddy")?.let { j ->
            val st = j.optJSONObject("stats") ?: JSONObject()
            g.buddy = Buddy(
                name = j.optString("name"), sex = enumOr(j.optString("sex"), Sex.MYSTERY), seed = j.optLong("seed"),
                eggLaidAt = j.optLong("eggLaidAt"), bornAt = j.optLong("bornAt"), level = j.optInt("level", 1),
                xp = j.optInt("xp"), lives = j.optInt("lives", 3), weight = j.optDouble("weight", 12.0),
                hue = j.optDouble("hue", 160.0).toFloat(), pattern = enumOr(j.optString("pattern"), Pattern.PLAIN),
                personality = enumOr(j.optString("personality"), Personality.CURIOUS),
                accessory = j.optString("accessory").ifBlank { null }, asleep = j.optBoolean("asleep"),
                sick = j.optBoolean("sick"), poops = j.optInt("poops"), tantrum = j.optBoolean("tantrum"),
                generation = j.optInt("generation", 1), lastUpdate = j.optLong("lastUpdate"), sleptAt = j.optLong("sleptAt"),
                hoursNeglected = j.optDouble("hoursNeglected", 0.0), dead = j.optBoolean("dead"),
                stats = Stats(
                    st.optDouble("fullness", 70.0), st.optDouble("happiness", 70.0), st.optDouble("energy", 85.0),
                    st.optDouble("hygiene", 85.0), st.optDouble("health", 100.0), st.optDouble("fitness", 20.0),
                    st.optDouble("smarts", 10.0), st.optDouble("social", 15.0), st.optDouble("discipline", 25.0),
                ),
            )
        }
        g.coins = o.optInt("coins", 25)
        g.ownerName = o.optString("ownerName")
        o.optJSONObject("inventory")?.let { g.inventory.clear(); it.keys().forEach { k -> g.inventory[k] = it.optInt(k) } }
        o.optJSONArray("cosmetics")?.let { a -> for (i in 0 until a.length()) g.ownedCosmetics.add(a.getString(i)) }
        o.optJSONObject("achievements")?.let { it.keys().forEach { k -> g.achievements[k] = it.optLong(k) } }
        o.optJSONObject("counters")?.let { it.keys().forEach { k -> g.counters[k] = it.optLong(k) } }
        o.optJSONObject("codeLastEaten")?.let { it.keys().forEach { k -> g.codeLastEaten[k] = it.optLong(k) } }
        o.optJSONObject("codeTimesEaten")?.let { it.keys().forEach { k -> g.codeTimesEaten[k] = it.optInt(k) } }
        o.optJSONArray("seenWifi")?.let { a -> for (i in 0 until a.length()) g.seenWifi.add(a.getString(i)) }
        o.optJSONArray("seenBt")?.let { a -> for (i in 0 until a.length()) g.seenBt.add(a.getString(i)) }
        o.optJSONArray("friendNames")?.let { a -> for (i in 0 until a.length()) g.friendNames.add(a.getString(i)) }
        o.optJSONArray("constellations")?.let { a -> for (i in 0 until a.length()) g.constellations.add(a.getString(i)) }
        o.optJSONObject("memory")?.let { it.keys().forEach { k -> g.memory[k] = it.optString(k) } }
        o.optJSONArray("likes")?.let { a -> for (i in 0 until a.length()) g.likes.add(a.getString(i)) }
        o.optJSONArray("journal")?.let { a ->
            for (i in 0 until a.length()) a.optJSONObject(i)?.let { g.journal.add(LogEntry(it.optLong("t"), it.optString("i"), it.optString("x"))) }
        }
        o.optJSONArray("graveyard")?.let { a ->
            for (i in 0 until a.length()) a.optJSONObject(i)?.let {
                g.graveyard.add(Memorial(it.optString("name"), enumOr(it.optString("sex"), Sex.MYSTERY), it.optInt("gen", 1),
                    it.optInt("level", 1), it.optInt("age"), it.optLong("diedAt"), it.optString("cause")))
            }
        }
        o.optJSONObject("daily")?.let { it.keys().forEach { k -> g.daily[k] = it.optLong(k) } }
        o.optJSONObject("settings")?.let {
            g.settings = Settings(it.optBoolean("notifications", true), it.optBoolean("vibration", true), it.optBoolean("sounds", true),
                it.optBoolean("online", true), it.optBoolean("autoSleep", true))
        }
        g.lastFoodName = o.optString("lastFoodName")
        g.favoriteFood = o.optString("favoriteFood")
        o.optJSONObject("bestScores")?.let { it.keys().forEach { k -> g.bestScores[k] = it.optInt(k) } }
        g.created = o.optLong("created")
        return g
    }

    private inline fun <reified E : Enum<E>> enumOr(name: String, fallback: E): E =
        runCatching { enumValueOf<E>(name) }.getOrDefault(fallback)
}
