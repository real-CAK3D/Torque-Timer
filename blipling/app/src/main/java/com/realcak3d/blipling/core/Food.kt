package com.realcak3d.blipling.core

import kotlin.random.Random

enum class Rarity(val label: String, val mult: Double, val stars: Int, val argb: Long) {
    COMMON("Common", 1.0, 1, 0xFFB0BEC5),
    UNCOMMON("Uncommon", 1.25, 2, 0xFF66BB6A),
    RARE("Rare", 1.6, 3, 0xFF42A5F5),
    EPIC("Epic", 2.2, 4, 0xFFAB47BC),
    LEGENDARY("Legendary", 3.5, 5, 0xFFFFCA28),
}

enum class FoodFamily(val label: String, val emoji: String) {
    GROCERY("Grocery", "🛒"),
    DATA("Data snack", "💾"),
    WEB("Web treat", "🌐"),
    SIGNAL("Signal soup", "📶"),
    SOCIAL("Social snack", "👋"),
    MAP("Map morsel", "🗺️"),
    INDUSTRIAL("Shipping crate", "📦"),
    EXOTIC("Exotic dish", "🎫"),
    ELECTRIC("Static sparkle", "⚡"),
    PANTRY("Pantry", "🥣"),
}

enum class FoodTrait(val label: String) {
    NONE(""), HEALTHY("Healthy"), JUNK("Junk food"), SPICY("Spicy"), CAFFEINATED("Caffeinated"),
    SOAPY("Bubbly"), SPOILED("Spoiled"), SWEET("Sweet"), HEARTY("Hearty"), BRAINY("Brain food"),
}

/** How a scan came in. `format` mirrors ML Kit's names ("QR_CODE", "EAN_13", ...) or "NFC". */
data class ScanInput(val raw: String, val format: String, val productName: String? = null, val nutriScore: String? = null)

data class Food(
    val key: String,
    val name: String,
    val family: FoodFamily,
    val rarity: Rarity,
    val trait: FoodTrait,
    val fullness: Double,
    val happiness: Double,
    val energy: Double,
    val health: Double,
    val hygiene: Double,
    val weight: Double,
    val xp: Int,
    val coins: Int,
    val description: String,
)

object FoodFactory {

    fun hash(s: String): Long {
        var h = -0x340d631b7bdddcdbL // FNV-1a 64 offset basis
        for (c in s) {
            h = h xor c.code.toLong()
            h *= 0x100000001b3L
        }
        return h
    }

    fun familyFor(input: ScanInput): FoodFamily {
        val raw = input.raw.trim()
        val lower = raw.lowercase()
        return when (input.format) {
            "NFC" -> FoodFamily.ELECTRIC
            "PANTRY" -> FoodFamily.PANTRY
            "EAN_13", "EAN_8", "UPC_A", "UPC_E" -> FoodFamily.GROCERY
            "CODE_128", "CODE_39", "CODE_93", "CODABAR", "ITF" -> FoodFamily.INDUSTRIAL
            "DATA_MATRIX", "AZTEC", "PDF417" -> FoodFamily.EXOTIC
            else -> when {
                lower.startsWith("wifi:") -> FoodFamily.SIGNAL
                lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("www.") -> FoodFamily.WEB
                lower.startsWith("begin:vcard") || lower.startsWith("mecard:") || lower.startsWith("tel:") ||
                    lower.startsWith("mailto:") || lower.startsWith("smsto:") || lower.startsWith("sms:") -> FoodFamily.SOCIAL
                lower.startsWith("geo:") -> FoodFamily.MAP
                else -> FoodFamily.DATA
            }
        }
    }

    private val adjectives = listOf(
        "Crunchy", "Glitchy", "Toasted", "Fizzy", "Sparkly", "Gooey", "Zesty", "Pixelated", "Buttery", "Frosted",
        "Smoky", "Wobbly", "Cosmic", "Neon", "Tangy", "Crispy", "Mega", "Tiny", "Retro", "Turbo", "Jiggly",
        "Velvet", "Electric", "Honeyed", "Salty", "Minty", "Spiced", "Lunar", "Golden", "Binary", "Static",
        "Chewy", "Fluffy", "Sizzling", "Holographic", "Quantum", "Rustic", "Midnight", "Sunny", "Bouncy",
    )

    private val bases = mapOf(
        FoodFamily.GROCERY to listOf("Apple", "Bagel", "Burrito", "Cereal", "Cheese Wedge", "Cookie", "Dumpling",
            "Granola Bar", "Hot Dog", "Noodles", "Pancake", "Pickle", "Pizza Slice", "Pretzel", "Rice Ball",
            "Sandwich", "Taco", "Yogurt", "Banana", "Carrot", "Muffin", "Soup Can", "Popcorn", "Donut"),
        FoodFamily.DATA to listOf("Pixel Pie", "Byte Biscuit", "Bit Brownie", "Kilobyte Cake", "Cache Cookie",
            "Packet Pudding", "Bitmap Bun", "Checksum Churro", "Syntax Sushi", "Word Salad", "Glyph Gumbo"),
        FoodFamily.WEB to listOf("Web Waffle", "Link Linguine", "Cookie (the browser kind)", "Hyperlink Hotcake",
            "URL Udon", "Domain Dumpling", "Bookmark Bagel", "Server Strudel"),
        FoodFamily.SIGNAL to listOf("Signal Soup", "Router Ravioli", "Bandwidth Broth", "Antenna Antipasto",
            "Hotspot Hotpot", "SSID Stew"),
        FoodFamily.SOCIAL to listOf("Friendship Fritter", "Ringtone Ramen", "Mail Macaron", "Contact Cupcake",
            "Hello Halloumi", "Text Tart"),
        FoodFamily.MAP to listOf("Map Muffin", "Compass Cobbler", "Latitude Lasagna", "Route Roll", "Atlas Tart"),
        FoodFamily.INDUSTRIAL to listOf("Boxcar Biscuit", "Pallet Pastry", "Forklift Flapjack", "Crate Cracker",
            "Warehouse Wafer", "Shipping Shortbread", "Freight Fries", "Label Lollipop"),
        FoodFamily.EXOTIC to listOf("Boarding-Pass Baklava", "Ticket Tiramisu", "Matrix Mochi", "Aztec Arepa",
            "Passport Paella", "Stub Soufflé", "Concert Crêpe", "Gate Gelato"),
        FoodFamily.ELECTRIC to listOf("Static Sparkle", "Chip Chowder", "Volt Vermicelli", "Coil Crumble",
            "Induction Ice Pop", "Tag Truffle"),
        FoodFamily.PANTRY to listOf("Kibble Byte"),
    )

    private val descriptions = listOf(
        "Smells like fresh electrons.", "Still warm from the scanner.", "A classic, done right.",
        "Has a suspicious number of stripes.", "Crunches in binary.", "Tastes like a summer afternoon.",
        "Made with 100% recycled light.", "Chef's kiss.", "Slightly glowing. Probably fine.",
        "Grandma's recipe, if Grandma were a laser.", "Pairs well with a nap.", "Contains traces of Wi-Fi.",
    )

    fun rarityFor(h: Long): Rarity {
        val roll = ((h ushr 11) and 0x3FF).toInt() % 1000 // 0..999
        return when {
            roll < 10 -> Rarity.LEGENDARY
            roll < 50 -> Rarity.EPIC
            roll < 150 -> Rarity.RARE
            roll < 400 -> Rarity.UNCOMMON
            else -> Rarity.COMMON
        }
    }

    fun fromScan(input: ScanInput): Food {
        if (input.format == "PANTRY") return kibble()
        val key = "${input.format}:${input.raw}"
        val h = hash(key)
        val r = Random(h)
        val family = familyFor(input)
        var rarity = rarityFor(h)
        if (family == FoodFamily.EXOTIC && rarity == Rarity.COMMON) rarity = Rarity.UNCOMMON

        val traitRoll = r.nextInt(100)
        var trait = when {
            traitRoll < 4 -> FoodTrait.SPOILED
            traitRoll < 16 -> FoodTrait.JUNK
            traitRoll < 28 -> FoodTrait.HEALTHY
            traitRoll < 36 -> FoodTrait.SPICY
            traitRoll < 44 -> FoodTrait.CAFFEINATED
            traitRoll < 50 -> FoodTrait.SOAPY
            traitRoll < 60 -> FoodTrait.SWEET
            traitRoll < 68 -> FoodTrait.HEARTY
            traitRoll < 76 -> FoodTrait.BRAINY
            else -> FoodTrait.NONE
        }
        // Real product data wins over dice rolls.
        when (input.nutriScore?.lowercase()) {
            "a", "b" -> trait = FoodTrait.HEALTHY
            "d", "e" -> trait = FoodTrait.JUNK
        }
        if (rarity == Rarity.LEGENDARY && trait == FoodTrait.SPOILED) trait = FoodTrait.HEARTY

        val baseList = bases.getValue(family)
        val name = input.productName?.takeIf { it.isNotBlank() }?.let { tidyProduct(it) }
            ?: "${adjectives[r.nextInt(adjectives.size)]} ${baseList[r.nextInt(baseList.size)]}"

        val m = rarity.mult
        var fullness = (14 + r.nextInt(14)) * m.coerceAtMost(1.6)
        var happiness = (4 + r.nextInt(8)) * m
        var energy = (2 + r.nextInt(5)).toDouble()
        var health = 1.0
        var hygiene = -1.0
        var weight = 0.3 + r.nextDouble() * 0.5
        var xp = ((8 + r.nextInt(8)) * m).toInt()
        var coins = (1 + r.nextInt(3)) * rarity.stars

        when (family) {
            FoodFamily.SIGNAL -> energy += 10
            FoodFamily.SOCIAL -> happiness += 6
            FoodFamily.MAP -> xp += 6
            FoodFamily.EXOTIC -> { xp += 10; coins += 3 }
            FoodFamily.ELECTRIC -> { energy += 15; fullness *= 0.6 }
            FoodFamily.WEB -> happiness += 3
            else -> {}
        }
        when (trait) {
            FoodTrait.HEALTHY -> { health += 8; weight -= 0.2; happiness -= 1 }
            FoodTrait.JUNK -> { happiness += 8; health -= 4; weight += 0.8 }
            FoodTrait.SPICY -> { happiness += 4; energy += 4; hygiene -= 2 }
            FoodTrait.CAFFEINATED -> { energy += 18 }
            FoodTrait.SOAPY -> { hygiene += 15; happiness -= 2 }
            FoodTrait.SPOILED -> { health -= 15; happiness -= 6; fullness *= 0.5 }
            FoodTrait.SWEET -> { happiness += 10; health -= 1; weight += 0.4 }
            FoodTrait.HEARTY -> { fullness += 10; energy += 4; weight += 0.5 }
            FoodTrait.BRAINY -> { xp += 8 }
            FoodTrait.NONE -> {}
        }
        val desc = if (input.productName != null) "A real-world snack, digitized." else descriptions[r.nextInt(descriptions.size)]
        return Food(key, name, family, rarity, trait, fullness, happiness, energy, health, hygiene,
            weight, xp, coins, desc)
    }

    fun kibble() = Food(
        key = "PANTRY:kibble", name = "Kibble Byte", family = FoodFamily.PANTRY, rarity = Rarity.COMMON,
        trait = FoodTrait.NONE, fullness = 18.0, happiness = 1.0, energy = 2.0, health = 1.0, hygiene = 0.0,
        weight = 0.3, xp = 3, coins = 0, description = "Plain but reliable. Scanning is way more fun.",
    )

    private fun tidyProduct(s: String): String {
        val t = s.trim().replace(Regex("\\s+"), " ")
        return if (t.length > 34) t.take(32).trimEnd() + "…" else t
    }
}
