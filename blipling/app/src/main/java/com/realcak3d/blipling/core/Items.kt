package com.realcak3d.blipling.core

enum class ItemKind { CONSUMABLE, COSMETIC, PAINT }

data class Item(
    val id: String,
    val name: String,
    val icon: String,
    val price: Int,
    val kind: ItemKind,
    val description: String,
    val minLevel: Int = 1,
)

object Items {
    val all = listOf(
        Item("kibble", "Kibble Byte", "🥣", 6, ItemKind.CONSUMABLE, "Backup food for when there's nothing to scan."),
        Item("soap", "Bubble Soap", "🧼", 8, ItemKind.CONSUMABLE, "A full bath. Hygiene to 100."),
        Item("medicine", "Medicine", "💊", 20, ItemKind.CONSUMABLE, "Cures sickness and restores health."),
        Item("vitamin", "Vitamins", "🍊", 14, ItemKind.CONSUMABLE, "+15 health, small chance to prevent sickness."),
        Item("soda", "Volt Soda", "🥤", 10, ItemKind.CONSUMABLE, "+30 energy. Wakes a sleepy buddy."),
        Item("cake", "Party Cake", "🎂", 25, ItemKind.CONSUMABLE, "+30 happiness, +20 fullness. Heavy."),
        Item("ball", "Bouncy Ball", "⚽", 12, ItemKind.CONSUMABLE, "Play fetch: +20 happiness, +fitness."),
        Item("book", "Story Book", "📖", 15, ItemKind.CONSUMABLE, "+10 smarts, +10 happiness."),
        Item("xp_chip", "XP Chip", "💾", 40, ItemKind.CONSUMABLE, "+75 XP instantly.", minLevel = 3),
        Item("one_up", "1-Up Heart", "❤️", 250, ItemKind.CONSUMABLE, "An extra life (max 5).", minLevel = 5),
        // Cosmetics
        Item("hat_party", "Party Hat", "🥳", 30, ItemKind.COSMETIC, "For every occasion."),
        Item("bow", "Big Bow", "🎀", 30, ItemKind.COSMETIC, "Fancy."),
        Item("glasses", "Smart Glasses", "🤓", 40, ItemKind.COSMETIC, "+10% XP from chatting (it's the vibe)."),
        Item("headphones", "Headphones", "🎧", 50, ItemKind.COSMETIC, "Signal-boosting style.", minLevel = 3),
        Item("beanie", "Beanie", "🧢", 35, ItemKind.COSMETIC, "Cozy."),
        Item("tophat", "Top Hat", "🎩", 80, ItemKind.COSMETIC, "Very distinguished.", minLevel = 5),
        Item("wizard", "Wizard Hat", "🧙", 120, ItemKind.COSMETIC, "Grants absolutely no magic.", minLevel = 8),
        Item("halo", "Halo", "😇", 150, ItemKind.COSMETIC, "Angelic glow.", minLevel = 10),
        Item("crown", "Crown", "👑", 300, ItemKind.COSMETIC, "Royalty of the radar.", minLevel = 15),
        // Paints
        Item("paint_mint", "Mint Paint", "🟩", 40, ItemKind.PAINT, "Recolor your buddy minty green."),
        Item("paint_sky", "Sky Paint", "🟦", 40, ItemKind.PAINT, "Recolor your buddy sky blue."),
        Item("paint_rose", "Rose Paint", "🟥", 40, ItemKind.PAINT, "Recolor your buddy rosy pink."),
        Item("paint_sun", "Sun Paint", "🟨", 40, ItemKind.PAINT, "Recolor your buddy sunny yellow."),
        Item("paint_grape", "Grape Paint", "🟪", 40, ItemKind.PAINT, "Recolor your buddy grape purple."),
        Item("paint_rainbow", "Prism Paint", "🌈", 200, ItemKind.PAINT, "Your buddy slowly shifts through every color.", minLevel = 12),
    )

    val paintHue = mapOf(
        "paint_mint" to 150f, "paint_sky" to 205f, "paint_rose" to 340f, "paint_sun" to 48f, "paint_grape" to 275f,
        "paint_rainbow" to -1f,
    )

    val byId = all.associateBy { it.id }
}
