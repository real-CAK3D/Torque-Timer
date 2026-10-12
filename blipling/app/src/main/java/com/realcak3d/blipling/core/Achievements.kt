package com.realcak3d.blipling.core

enum class AchCategory(val label: String) { SCAN("Scanning"), SIGNALS("Signals"), SKY("Sky"), CARE("Care"), LIFE("Life"), PLAY("Play"), SENSORS("Sensors") }

class Achievement(
    val id: String,
    val title: String,
    val description: String,
    val icon: String,
    val category: AchCategory,
    val coins: Int,
    val secret: Boolean = false,
    val target: Long = 1,
    val progress: (GameData) -> Long,
) {
    fun done(g: GameData) = progress(g) >= target
}

object Achievements {
    private fun counter(id: String, title: String, desc: String, icon: String, cat: AchCategory, key: String, target: Long, coins: Int, secret: Boolean = false) =
        Achievement(id, title, desc, icon, cat, coins, secret, target) { it.count(key) }

    val all: List<Achievement> = listOf(
        // Scanning
        counter("first_bite", "First Bite", "Feed your buddy its first scan.", "🍽️", AchCategory.SCAN, C.SCANS, 1, 10),
        counter("snacker", "Snacker", "Scan 25 codes.", "🥪", AchCategory.SCAN, C.SCANS, 25, 25),
        counter("glutton", "Glutton", "Scan 100 codes.", "🍔", AchCategory.SCAN, C.SCANS, 100, 60),
        counter("devourer", "Code Devourer", "Scan 500 codes.", "🐲", AchCategory.SCAN, C.SCANS, 500, 200),
        counter("collector", "Collector", "Eat 50 different codes.", "📚", AchCategory.SCAN, C.UNIQUE_CODES, 50, 50),
        counter("connoisseur", "Connoisseur", "Eat 250 different codes.", "🧐", AchCategory.SCAN, C.UNIQUE_CODES, 250, 150),
        counter("qr_fan", "QR Fan", "Scan 20 QR codes.", "🔳", AchCategory.SCAN, C.QR, 20, 25),
        counter("shopper", "Aisle Explorer", "Scan 30 grocery barcodes.", "🛒", AchCategory.SCAN, C.PRODUCT, 30, 30),
        counter("logistics", "Logistics Expert", "Scan 10 shipping-style barcodes.", "📦", AchCategory.SCAN, C.INDUSTRIAL, 10, 30),
        counter("jetsetter", "Jetsetter", "Scan a boarding pass, ticket or other exotic code.", "🎫", AchCategory.SCAN, C.EXOTIC, 1, 25),
        counter("nfc_tap", "Tap Tap", "Feed your buddy an NFC tag.", "📳", AchCategory.SCAN, C.NFC, 1, 20),
        counter("nfc_10", "Tag Hoarder", "Feed 10 NFC tags.", "🏷️", AchCategory.SCAN, C.NFC, 10, 50),
        counter("rare_find", "Rare Find", "Eat a rare food.", "💎", AchCategory.SCAN, C.RARE, 1, 20),
        counter("epic_find", "Epic Find", "Eat an epic food.", "🔮", AchCategory.SCAN, C.EPIC, 1, 40),
        counter("legend", "Legend Hunter", "Eat a LEGENDARY food.", "👑", AchCategory.SCAN, C.LEGENDARY, 1, 100),
        // Signals
        counter("sniffer", "Sniffer", "Detect your first Wi-Fi network.", "📶", AchCategory.SIGNALS, C.WIFI, 1, 10),
        counter("wardriver", "Network Naturalist", "Detect 50 different Wi-Fi networks.", "🗺️", AchCategory.SIGNALS, C.WIFI, 50, 50),
        counter("wifi_500", "Signal Cartographer", "Detect 500 Wi-Fi networks.", "🛰️", AchCategory.SIGNALS, C.WIFI, 500, 200),
        counter("open_net", "Wide Open", "Spot an open (no password) network.", "🔓", AchCategory.SIGNALS, C.WIFI_OPEN, 1, 15),
        counter("five_g", "Fast Lane", "Spot a 5 GHz network.", "⚡", AchCategory.SIGNALS, C.WIFI_5G, 1, 15),
        counter("six_g", "Bleeding Edge", "Spot a 6 GHz (Wi-Fi 6E/7) network.", "🚀", AchCategory.SIGNALS, C.WIFI_6G, 1, 40),
        counter("bt_first", "Hello, Stranger", "Detect a Bluetooth device.", "🔵", AchCategory.SIGNALS, C.BT, 1, 10),
        counter("bt_50", "Social Butterfly", "Meet 50 Bluetooth devices.", "🦋", AchCategory.SIGNALS, C.BT, 50, 60),
        counter("bt_hug", "Bluetooth Hug", "Get really close to a Bluetooth device.", "🤗", AchCategory.SIGNALS, C.BT_CLOSE, 1, 15),
        counter("radar_lock", "Lock On", "Find a signal's direction with the radar.", "🎯", AchCategory.SIGNALS, C.RADAR_LOCKS, 1, 25),
        counter("radar_10", "Fox Hunter", "Lock on to 10 signals with the radar.", "🦊", AchCategory.SIGNALS, C.RADAR_LOCKS, 10, 75),
        // Sky
        counter("stargazer", "Stargazer", "See your first GPS satellites.", "✨", AchCategory.SKY, C.STARGAZES, 1, 15),
        counter("sats_12", "Sky Full of Friends", "See 12 satellites at once.", "🌌", AchCategory.SKY, C.SATS_MAX, 12, 30),
        counter("sats_30", "Constellation Party", "See 30 satellites at once.", "🌠", AchCategory.SKY, C.SATS_MAX, 30, 80),
        Achievement("constellations_3", "Space Tourist", "See satellites from 3 different systems.", "🪐", AchCategory.SKY, 40, target = 3) { it.constellations.size.toLong() },
        Achievement("constellations_5", "Galactic Diplomat", "See satellites from 5 different systems.", "🌍", AchCategory.SKY, 120, target = 5) { it.constellations.size.toLong() },
        counter("high_alt", "Head in the Clouds", "Take your buddy above 1000 m.", "🏔️", AchCategory.SKY, C.ALTITUDE_MAX, 1000, 50),
        // Care
        counter("clean_10", "Tidy Keeper", "Clean up 10 times.", "🧽", AchCategory.CARE, C.CLEANS, 10, 25),
        counter("medic", "Doctor", "Cure your buddy.", "💊", AchCategory.CARE, C.MEDS, 1, 15),
        counter("pets_100", "Pet Lover", "Pet your buddy 100 times.", "🤲", AchCategory.CARE, C.PETS, 100, 30),
        counter("sleeps_7", "Well Rested", "Put your buddy to bed 7 times.", "🛏️", AchCategory.CARE, C.SLEEPS, 7, 25),
        counter("dark_nap", "Lights Out", "Let your buddy nap in real darkness.", "🌙", AchCategory.CARE, C.DARK_NAPS, 1, 15),
        counter("charge", "Power Snack", "Plug in your phone while your buddy watches.", "🔌", AchCategory.CARE, C.CHARGES, 1, 10),
        counter("shopper_10", "Big Spender", "Buy 10 things at the shop.", "🛍️", AchCategory.CARE, C.PURCHASES, 10, 30),
        // Life
        Achievement("lvl_5", "Growing Up", "Reach level 5.", "🌱", AchCategory.LIFE, 30, target = 5) { it.buddy.level.toLong() },
        Achievement("lvl_10", "Seasoned", "Reach level 10.", "🌿", AchCategory.LIFE, 60, target = 10) { it.buddy.level.toLong() },
        Achievement("lvl_25", "Veteran", "Reach level 25.", "🌳", AchCategory.LIFE, 150, target = 25) { it.buddy.level.toLong() },
        Achievement("lvl_50", "Ascended", "Reach level 50.", "🏆", AchCategory.LIFE, 400, target = 50) { it.buddy.level.toLong() },
        Achievement("week_old", "One Week Strong", "Keep a buddy alive for 7 days.", "🎂", AchCategory.LIFE, 70, target = 7) { g -> if (g.buddy.hatched) ((System.currentTimeMillis() - g.buddy.bornAt) / 86_400_000L) else 0 },
        Achievement("month_old", "Elder Wisdom", "Keep a buddy alive for 30 days.", "🧓", AchCategory.LIFE, 300, target = 30) { g -> if (g.buddy.hatched) ((System.currentTimeMillis() - g.buddy.bornAt) / 86_400_000L) else 0 },
        Achievement("second_gen", "Circle of Life", "Raise a second generation.", "🥚", AchCategory.LIFE, 30, secret = true, target = 2) { it.buddy.generation.toLong() },
        counter("comeback", "Comeback Kid", "Use an extra life.", "❤️‍🩹", AchCategory.LIFE, C.DEATHS, 1, 10, secret = true),
        Achievement("rich", "Coin Hoarder", "Earn 1000 coins in total.", "💰", AchCategory.LIFE, 100, target = 1000) { it.count(C.COINS_EARNED) },
        // Play
        counter("chatty", "Chatterbox", "Chat 50 times.", "💬", AchCategory.PLAY, C.CHATS, 50, 30),
        counter("chatty_500", "Best Friends", "Chat 500 times.", "💞", AchCategory.PLAY, C.CHATS, 500, 120),
        counter("riddler", "Riddle Me This", "Solve 5 riddles.", "❓", AchCategory.PLAY, C.RIDDLES_SOLVED, 5, 40),
        counter("comedian", "Comedy Club", "Hear 20 jokes.", "🤡", AchCategory.PLAY, C.JOKES, 20, 20),
        counter("gamer", "Gamer", "Play 10 mini-games.", "🎮", AchCategory.PLAY, C.GAMES, 10, 25),
        counter("champ", "Champion", "Win 25 mini-games.", "🥇", AchCategory.PLAY, C.GAME_WINS, 25, 75),
        counter("dancer", "Dance Party", "Make your buddy dance to sound 10 times.", "💃", AchCategory.PLAY, C.DANCES, 10, 25),
        // Sensors
        counter("walk_1k", "Little Walk", "Walk 1,000 steps together.", "👟", AchCategory.SENSORS, C.STEPS, 1_000, 15),
        counter("walk_10k", "Daily Ten", "Walk 10,000 steps together.", "🥾", AchCategory.SENSORS, C.STEPS, 10_000, 50),
        counter("walk_100k", "Marathoner", "Walk 100,000 steps together.", "🏃", AchCategory.SENSORS, C.STEPS, 100_000, 250),
        counter("shaker", "Shake It Up", "Shake your phone 25 times.", "🫨", AchCategory.SENSORS, C.SHAKES, 25, 15),
        counter("peekaboo", "Peekaboo!", "Play peekaboo with the proximity sensor.", "🙈", AchCategory.SENSORS, C.PEEKABOO, 1, 10),
        counter("magnet", "Magnetic Personality", "Find a strong magnet with the compass.", "🧲", AchCategory.SENSORS, C.MAGNETS, 1, 20, secret = true),
    )

    val byId = all.associateBy { it.id }

    /** Returns achievements newly unlocked, and records them. */
    fun check(g: GameData, now: Long): List<Achievement> {
        val fresh = all.filter { it.id !in g.achievements && it.done(g) }
        fresh.forEach { g.achievements[it.id] = now }
        return fresh
    }
}
