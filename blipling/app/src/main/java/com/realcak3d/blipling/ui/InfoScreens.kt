package com.realcak3d.blipling.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.realcak3d.blipling.core.AchCategory
import com.realcak3d.blipling.core.Achievements
import com.realcak3d.blipling.core.C
import com.realcak3d.blipling.core.GameEvent
import com.realcak3d.blipling.core.ItemKind
import com.realcak3d.blipling.core.Items
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.SensorHub
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ------------------------------------------------------------------ Shop

@Composable
fun ShopScreen(repo: GameRepository) {
    val g by rememberGame(repo)
    var tab by rememberSaveable { mutableStateOf(ItemKind.CONSUMABLE) }
    var msg by remember { mutableStateOf<String?>(null) }
    Column(Modifier.fillMaxSize()) {
        ScreenTitle("Shop", "🪙 ${g.coins} coins · Level ${g.buddy.level}")
        Row(Modifier.padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(ItemKind.CONSUMABLE to "Items", ItemKind.COSMETIC to "Hats & gear", ItemKind.PAINT to "Paint").forEach { (k, label) ->
                Text(label, color = if (tab == k) Pal.bg else Pal.text, fontWeight = FontWeight.Bold, fontSize = 13.sp,
                    modifier = Modifier.clip(RoundedCornerShape(50)).background(if (tab == k) Pal.mint else Pal.panel2).clickable { tab = k }.padding(horizontal = 14.dp, vertical = 8.dp))
            }
        }
        msg?.let { Box(Modifier.fillMaxWidth().padding(12.dp)) { SpeechBubble(it) } }
        LazyColumn(Modifier.fillMaxSize().padding(horizontal = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { Spacer(Modifier.height(4.dp)) }
            items(Items.all.filter { it.kind == tab }, key = { it.id }) { item ->
                val owned = item.id in g.ownedCosmetics
                val qty = g.inventory[item.id] ?: 0
                val locked = g.buddy.level < item.minLevel
                Row(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Pal.panel).border(1.dp, Pal.line, RoundedCornerShape(16.dp)).padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(item.icon, fontSize = 30.sp, modifier = Modifier.width(44.dp))
                    Column(Modifier.weight(1f)) {
                        Text(item.name + if (qty > 0) "  ×$qty" else "", color = Pal.text, fontWeight = FontWeight.Bold)
                        Text(item.description, color = Pal.sub, fontSize = 12.sp)
                        if (locked) Text("🔒 Unlocks at level ${item.minLevel}", color = Pal.red, fontSize = 11.sp)
                    }
                    Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (item.kind == ItemKind.CONSUMABLE || !owned) {
                            SmallBtn("🪙 ${item.price}", if (g.coins >= item.price && !locked) Pal.amber else Pal.line) {
                                msg = repo.act { n -> buy(item.id, n) }.filterIsInstance<GameEvent.Say>().lastOrNull()?.text
                            }
                        }
                        if ((item.kind == ItemKind.CONSUMABLE && qty > 0) || (item.kind != ItemKind.CONSUMABLE && owned)) {
                            val label = when {
                                item.kind == ItemKind.COSMETIC && g.buddy.accessory == item.id -> "Remove"
                                item.kind == ItemKind.COSMETIC -> "Wear"
                                item.kind == ItemKind.PAINT -> "Apply"
                                else -> "Use"
                            }
                            SmallBtn(label, Pal.mint) { msg = repo.act { n -> useItem(item.id, n) }.filterIsInstance<GameEvent.Say>().lastOrNull()?.text }
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
fun SmallBtn(text: String, color: androidx.compose.ui.graphics.Color, onClick: () -> Unit) {
    Text(text, color = Pal.bg, fontWeight = FontWeight.Bold, fontSize = 13.sp,
        modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(color).clickable(onClick = onClick).padding(horizontal = 12.dp, vertical = 6.dp))
}

// ------------------------------------------------------------------ Awards

@Composable
fun AwardsScreen(repo: GameRepository) {
    val g by rememberGame(repo)
    val total = Achievements.all.size
    val got = g.achievements.size
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item { ScreenTitle("Awards", "$got of $total unlocked") }
        AchCategory.entries.forEach { cat ->
            item { Text(cat.label.uppercase(), color = Pal.sub, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp, modifier = Modifier.padding(top = 10.dp, start = 4.dp)) }
            items(Achievements.all.filter { it.category == cat }, key = { it.id }) { a ->
                val done = a.id in g.achievements
                val prog = a.progress(g).coerceAtMost(a.target)
                val hidden = a.secret && !done
                Row(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(if (done) Pal.amber.copy(alpha = 0.10f) else Pal.panel)
                        .border(1.dp, if (done) Pal.amber.copy(alpha = 0.5f) else Pal.line, RoundedCornerShape(14.dp)).padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(if (hidden) "❔" else a.icon, fontSize = 26.sp, modifier = Modifier.width(40.dp))
                    Column(Modifier.weight(1f)) {
                        Text(if (hidden) "Secret achievement" else a.title, color = if (done) Pal.amber else Pal.text, fontWeight = FontWeight.Bold)
                        Text(if (hidden) "Keep playing to discover it." else a.description, color = Pal.sub, fontSize = 12.sp)
                        if (!done && !hidden && a.target > 1) {
                            Spacer(Modifier.height(4.dp))
                            Box(Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)).background(Pal.panel2)) {
                                Box(Modifier.fillMaxWidth((prog.toFloat() / a.target).coerceIn(0f, 1f)).height(5.dp).background(Pal.mint))
                            }
                            Text("$prog / ${a.target}", color = Pal.sub, fontSize = 10.sp, fontFamily = Mono)
                        }
                    }
                    Text(if (done) "✓" else "🪙${a.coins}", color = if (done) Pal.amber else Pal.sub, fontSize = 13.sp)
                }
            }
        }
        item { Spacer(Modifier.height(16.dp)) }
    }
}

// ------------------------------------------------------------------ Profile

@Composable
fun ProfileScreen(repo: GameRepository) {
    val g by rememberGame(repo)
    val b = g.buddy
    val now = System.currentTimeMillis()
    val df = remember { SimpleDateFormat("MMM d, yyyy h:mm a", Locale.getDefault()) }
    var renaming by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 16.dp)) {
        ScreenTitle("Profile", "Everything about ${b.name.ifBlank { "your egg" }}")
        Row(Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(130.dp)) { BuddyView(g.look(now), com.realcak3d.blipling.core.Anim.NONE, 0L, Modifier.fillMaxSize()) }
            Column(Modifier.padding(start = 8.dp)) {
                Text("${b.name.ifBlank { "?" }} ${b.sex.symbol}", color = Pal.text, fontSize = 24.sp, fontWeight = FontWeight.Black)
                Text("${b.stage(now).emoji} ${b.stage(now).label} · ${b.personality.label}", color = Pal.sub)
                Text("Generation ${b.generation}", color = Pal.sub, fontSize = 12.sp)
                if (b.hatched) Text("✏️ Rename", color = Pal.mint, fontSize = 13.sp, modifier = Modifier.padding(top = 6.dp).clickable { renaming = true })
            }
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Vital records") {
            KeyValue("Sex", b.sex.label)
            KeyValue("Age", if (b.hatched) "${b.ageYears(now)} buddy-years (${"%.1f".format(b.ageHours(now))} h)" else "unhatched")
            if (b.hatched) KeyValue("Born", df.format(Date(b.bornAt)))
            KeyValue("Level", "${b.level}  (${b.xp}/${b.xpToNext()} XP)")
            KeyValue("Lives", "${b.lives} / 5")
            KeyValue("Weight", "%.1f g".format(b.weight))
            KeyValue("Pattern", b.pattern.name.lowercase().replaceFirstChar { it.uppercase() })
            KeyValue("Favorite food", g.favoriteFood.ifBlank { "—" })
            KeyValue("Last meal", g.lastFoodName.ifBlank { "—" })
            KeyValue("Owner", g.ownerName.ifBlank { "(tell me in Chat!)" })
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Lifetime stats") {
            listOf(
                "Codes eaten" to C.SCANS, "Different codes" to C.UNIQUE_CODES, "QR codes" to C.QR, "Grocery barcodes" to C.PRODUCT,
                "NFC tags" to C.NFC, "Legendary foods" to C.LEGENDARY, "Wi-Fi networks sniffed" to C.WIFI, "Open networks" to C.WIFI_OPEN,
                "Bluetooth friends" to C.BT, "Radar lock-ons" to C.RADAR_LOCKS, "Max satellites" to C.SATS_MAX, "Steps together" to C.STEPS,
                "Chats" to C.CHATS, "Games played" to C.GAMES, "Games won" to C.GAME_WINS, "Pets" to C.PETS, "Coins earned" to C.COINS_EARNED,
                "Lives lost" to C.DEATHS,
            ).forEach { (k, key) -> KeyValue(k, "${g.count(key)}") }
        }
        if (g.friendNames.isNotEmpty()) {
            Spacer(Modifier.height(10.dp))
            Panel(Modifier.padding(horizontal = 12.dp), title = "Bluetooth friends") {
                Text(g.friendNames.take(40).joinToString(" · "), color = Pal.text, fontSize = 13.sp)
            }
        }
        if (g.likes.isNotEmpty() || g.memory.isNotEmpty()) {
            Spacer(Modifier.height(10.dp))
            Panel(Modifier.padding(horizontal = 12.dp), title = "Things I remember about you") {
                if (g.likes.isNotEmpty()) Text("You like: ${g.likes.take(12).joinToString()}", color = Pal.text, fontSize = 13.sp)
                g.memory.filterKeys { it.startsWith("fav_") }.forEach { (k, v) -> Text("Favorite ${k.removePrefix("fav_")}: $v", color = Pal.text, fontSize = 13.sp) }
                g.memory.filterKeys { it.startsWith("note_") }.values.take(10).forEach { Text("• $it", color = Pal.sub, fontSize = 13.sp) }
            }
        }
        if (g.graveyard.isNotEmpty()) {
            Spacer(Modifier.height(10.dp))
            Panel(Modifier.padding(horizontal = 12.dp), title = "Hall of memories") {
                g.graveyard.forEach { m ->
                    Text("🪦 ${m.name} ${m.sex.symbol} — gen ${m.generation}, level ${m.level}, ${m.ageYears} yrs (${m.cause})", color = Pal.text, fontSize = 13.sp, modifier = Modifier.padding(vertical = 2.dp))
                }
            }
        }
    }
    if (renaming) {
        var name by remember { mutableStateOf(b.name) }
        AlertDialog(
            onDismissRequest = { renaming = false },
            title = { Text("Rename") },
            text = { OutlinedTextField(name, { name = it.take(16) }, singleLine = true, colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Pal.mint)) },
            confirmButton = { TextButton({ val n = name.trim(); if (n.isNotEmpty()) repo.act { _ -> this.g.buddy.name = n; emptyList() }; renaming = false }) { Text("Save") } },
            dismissButton = { TextButton({ renaming = false }) { Text("Cancel") } },
            containerColor = Pal.panel,
        )
    }
}

// ------------------------------------------------------------------ Journal

@Composable
fun JournalScreen(repo: GameRepository) {
    val g by rememberGame(repo)
    val df = remember { SimpleDateFormat("MMM d · h:mm a", Locale.getDefault()) }
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
        item { ScreenTitle("Journal", "The last ${g.journal.size} things that happened") }
        items(g.journal) { e ->
            Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.Top) {
                Text(e.icon, fontSize = 18.sp, modifier = Modifier.width(32.dp))
                Column {
                    Text(e.text, color = Pal.text, fontSize = 14.sp)
                    Text(df.format(Date(e.time)), color = Pal.sub, fontSize = 11.sp)
                }
            }
        }
        if (g.journal.isEmpty()) item { Text("Nothing yet!", color = Pal.sub, modifier = Modifier.padding(16.dp)) }
    }
}

// ------------------------------------------------------------------ Lab

@Composable
fun LabScreen(repo: GameRepository, hub: SensorHub) {
    val r by hub.body.readings.collectAsStateWithLifecycle()
    val db by hub.sound.db.collectAsStateWithLifecycle()
    var listening by remember { mutableStateOf(false) }
    androidx.compose.runtime.DisposableEffect(Unit) { onDispose { hub.sound.stop() } }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 16.dp)) {
        ScreenTitle("Sensor Lab", "Everything your buddy can feel through the phone")
        Panel(Modifier.padding(horizontal = 12.dp), title = "Dance party (microphone)") {
            Text("Play music or clap — loud sounds make your buddy dance.", color = Pal.sub, fontSize = 13.sp)
            Spacer(Modifier.height(8.dp))
            StatBar("Loudness", "🎤", (db / 90.0 * 100.0), Pal.violet)
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (hub.sound.canRun()) "Listen" else "Listen (needs mic permission)", color = Pal.text, modifier = Modifier.weight(1f))
                Switch(listening, { on -> listening = on; if (on) hub.sound.start() else hub.sound.stop() }, enabled = hub.sound.canRun(),
                    colors = SwitchDefaults.colors(checkedTrackColor = Pal.mint))
            }
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Motion & orientation") {
            KeyValue("Compass heading", if (r.hasCompass) "${r.heading.toInt()}° ${compassName(r.heading)}" else "no sensor")
            KeyValue("Pitch / roll", "${r.pitch.toInt()}° / ${r.roll.toInt()}°")
            KeyValue("Shake force", "%.1f m/s²".format(r.accel))
            KeyValue("Steps this session", if (r.hasStepCounter) "${r.stepsSession}" else "no sensor")
            Text("Shake the phone to play (too much makes your buddy dizzy). Walks add fitness.", color = Pal.sub, fontSize = 12.sp)
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Environment") {
            KeyValue("Light", if (r.hasLight) "${r.lux.toInt()} lux" else "no sensor")
            KeyValue("Proximity", if (r.hasProximity) (if (r.proximityNear) "NEAR 🙈" else "far") else "no sensor")
            KeyValue("Air pressure", if (r.hasBarometer) "%.1f hPa".format(r.pressureHpa) else "no sensor")
            KeyValue("Altitude (barometric)", if (r.altitudeM.isNaN()) "—" else "%.0f m".format(r.altitudeM))
            KeyValue("Magnetic field", "%.0f µT %s".format(r.magneticUT, if (r.magneticUT > 200) "🧲 MAGNET!" else ""))
            KeyValue("Battery", if (r.batteryPct >= 0) "${r.batteryPct}% ${if (r.charging) "⚡ charging" else ""}" else "—")
            Text("Cover the top of the phone and uncover it for peekaboo. Darkness makes your buddy sleepy. Plugging in the charger is a snack!", color = Pal.sub, fontSize = 12.sp)
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Radios") {
            val wifi by hub.wifi.results.collectAsStateWithLifecycle()
            val bt by hub.bt.devices.collectAsStateWithLifecycle()
            val sats by hub.gnss.satellites.collectAsStateWithLifecycle()
            KeyValue("Wi-Fi networks in range", "${wifi.size}")
            KeyValue("Bluetooth devices in range", "${bt.size}")
            KeyValue("Satellites in view", "${sats.size}")
            KeyValue("NFC", "Tap a tag to the back of the phone to feed it")
        }
        Spacer(Modifier.height(8.dp))
        Text("Sensors are only read while the app is open.", color = Pal.sub.copy(alpha = 0.6f), fontSize = 11.sp, modifier = Modifier.padding(horizontal = 16.dp))
    }
}

// ------------------------------------------------------------------ Settings

@Composable
fun SettingsScreen(repo: GameRepository, hub: SensorHub, requestPermissions: () -> Unit) {
    val g by rememberGame(repo)
    var confirmReset by remember { mutableStateOf(false) }
    val s = g.settings
    fun set(block: com.realcak3d.blipling.core.Settings.() -> Unit) {
        repo.act { _ -> this.g.settings.block(); emptyList() }
        hub.applySettings()
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 16.dp)) {
        ScreenTitle("Settings")
        Panel(Modifier.padding(horizontal = 12.dp), title = "Options") {
            Toggle("Care reminders (notifications)", s.notifications) { v -> set { notifications = v } }
            Toggle("Vibration", s.vibration) { v -> set { vibration = v } }
            Toggle("Beeps", s.sounds) { v -> set { sounds = v } }
            Toggle("Look up product names online (Open Food Facts)", s.onlineProductLookup) { v -> set { onlineProductLookup = v } }
            Toggle("Auto-sleep at night (10pm–7am)", s.autoSleepAtNight) { v -> set { autoSleepAtNight = v } }
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Permissions") {
            Text(
                "Camera → scanning food\nLocation → Wi-Fi/Bluetooth scans and GPS satellites\nNearby devices → Bluetooth & Wi-Fi radar\n" +
                    "Physical activity → step counting\nMicrophone → dance party (only when switched on)\nNotifications → care reminders",
                color = Pal.sub, fontSize = 13.sp, lineHeight = 19.sp,
            )
            Spacer(Modifier.height(8.dp))
            BigButton("Grant permissions", Pal.mint, Modifier.fillMaxWidth()) { requestPermissions() }
            Spacer(Modifier.height(6.dp))
            Text("Tip: Android limits apps to 4 Wi-Fi scans per 2 minutes. Developer options → \"Wi-Fi scan throttling\" can turn that off for a faster Wi-Fi radar.", color = Pal.sub, fontSize = 12.sp)
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "About") {
            KeyValue("App", "Blipling")
            KeyValue("Brain", "Rule-based phrase engine (no AI)")
            KeyValue("Achievements", "${Achievements.all.size}")
            KeyValue("Shop items", "${Items.all.size}")
            Text("All data stays on this phone. The only network call is the optional product-name lookup.", color = Pal.sub, fontSize = 12.sp)
        }
        Spacer(Modifier.height(10.dp))
        Panel(Modifier.padding(horizontal = 12.dp), title = "Danger zone") {
            BigButton("Reset everything", Pal.red, Modifier.fillMaxWidth()) { confirmReset = true }
        }
    }
    if (confirmReset) {
        AlertDialog(
            onDismissRequest = { confirmReset = false },
            title = { Text("Start over?") },
            text = { Text("This deletes your buddy, coins, items, achievements and history. It can't be undone.") },
            confirmButton = { TextButton({ repo.resetEverything(); confirmReset = false }) { Text("Delete everything", color = Pal.red) } },
            dismissButton = { TextButton({ confirmReset = false }) { Text("Cancel") } },
            containerColor = Pal.panel,
        )
    }
}

@Composable
private fun Toggle(label: String, value: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = Pal.text, fontSize = 14.sp, modifier = Modifier.weight(1f))
        Switch(value, onChange, colors = SwitchDefaults.colors(checkedTrackColor = Pal.mint))
    }
}
