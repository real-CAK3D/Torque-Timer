package com.realcak3d.blipling.ui

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.realcak3d.blipling.MainActivity
import com.realcak3d.blipling.core.GameEvent
import com.realcak3d.blipling.data.GameRepository
import com.realcak3d.blipling.sensors.SensorHub
import kotlinx.coroutines.delay

enum class Screen(val title: String, val icon: String) {
    HOME("Home", "🏠"), SCAN("Feed", "📷"), RADAR("Radar", "📡"), CHAT("Chat", "💬"), MORE("More", "☰"),
    SKY("Sky", "🛰️"), GAMES("Games", "🎮"), SHOP("Shop", "🛍️"), AWARDS("Awards", "🏆"), PROFILE("Profile", "🪪"),
    JOURNAL("Journal", "📜"), LAB("Sensor Lab", "🧪"), SETTINGS("Settings", "⚙️"),
}

@Composable
fun BliplingRoot(repo: GameRepository, hub: SensorHub, hasNfc: Boolean) {
    var screen by rememberSaveable { mutableStateOf(Screen.HOME) }
    var asked by rememberSaveable { mutableStateOf(false) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        hub.refreshPermissions()
    }
    LaunchedEffect(Unit) {
        if (!asked) { asked = true; launcher.launch(MainActivity.runtimePermissions) }
    }
    BackHandler(enabled = screen != Screen.HOME) { screen = if (screen.ordinal > Screen.MORE.ordinal) Screen.MORE else Screen.HOME }

    // Achievement / level-up banner
    var banner by remember { mutableStateOf<Pair<String, String>?>(null) }
    LaunchedEffect(Unit) {
        repo.events.collect { e ->
            when (e) {
                is GameEvent.Unlocked -> banner = "${e.achievement.icon}  Achievement unlocked" to "${e.achievement.title} · +${e.achievement.coins} coins"
                is GameEvent.LevelUp -> banner = "⭐  Level up!" to "Now level ${e.level}"
                is GameEvent.Died -> banner = if (e.livesLeft > 0) "💔  Lost a life" to "Cause: ${e.cause}. ${e.livesLeft} left." else "🪦  Game over" to "Cause: ${e.cause}"
                else -> {}
            }
        }
    }
    LaunchedEffect(banner) { if (banner != null) { delay(3200); banner = null } }

    val tabs = listOf(Screen.HOME, Screen.SCAN, Screen.RADAR, Screen.CHAT, Screen.MORE)
    Scaffold(
        containerColor = Pal.bg,
        bottomBar = {
            NavigationBar(containerColor = Pal.panel) {
                tabs.forEach { tab ->
                    val selected = screen == tab || (tab == Screen.MORE && screen.ordinal > Screen.MORE.ordinal)
                    NavigationBarItem(
                        selected = selected,
                        onClick = { screen = tab },
                        icon = {
                            Icon(
                                when (tab) {
                                    Screen.HOME -> Icons.Filled.Home
                                    Screen.SCAN -> Icons.Filled.QrCodeScanner
                                    Screen.RADAR -> Icons.Filled.Radar
                                    Screen.CHAT -> Icons.Filled.Chat
                                    else -> Icons.Filled.MoreHoriz
                                }, contentDescription = tab.title
                            )
                        },
                        label = { Text(tab.title) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Pal.bg, indicatorColor = Pal.mint, selectedTextColor = Pal.mint,
                            unselectedIconColor = Pal.sub, unselectedTextColor = Pal.sub,
                        ),
                    )
                }
            }
        },
    ) { pad ->
        Box(Modifier.fillMaxSize().padding(pad)) {
            when (screen) {
                Screen.HOME -> HomeScreen(repo, hub, go = { screen = it })
                Screen.SCAN -> ScanScreen(repo, hub, hasNfc)
                Screen.RADAR -> RadarScreen(repo, hub)
                Screen.CHAT -> ChatScreen(repo)
                Screen.MORE -> MoreScreen(go = { screen = it })
                Screen.SKY -> SkyScreen(repo, hub)
                Screen.GAMES -> GamesScreen(repo, hub)
                Screen.SHOP -> ShopScreen(repo)
                Screen.AWARDS -> AwardsScreen(repo)
                Screen.PROFILE -> ProfileScreen(repo)
                Screen.JOURNAL -> JournalScreen(repo)
                Screen.LAB -> LabScreen(repo, hub)
                Screen.SETTINGS -> SettingsScreen(repo, hub, requestPermissions = { launcher.launch(MainActivity.runtimePermissions) })
            }
            AnimatedVisibility(
                visible = banner != null,
                enter = slideInVertically { -it } + fadeIn(),
                exit = slideOutVertically { -it } + fadeOut(),
                modifier = Modifier.align(Alignment.TopCenter).padding(12.dp),
            ) {
                val b = banner
                if (b != null) {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Pal.panel2)
                            .border(1.dp, Pal.amber.copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                            .padding(14.dp)
                    ) {
                        Text(b.first, color = Pal.amber, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text(b.second, color = Pal.text, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun MoreScreen(go: (Screen) -> Unit) {
    val items = listOf(Screen.SKY, Screen.GAMES, Screen.SHOP, Screen.AWARDS, Screen.PROFILE, Screen.JOURNAL, Screen.LAB, Screen.SETTINGS)
    val blurbs = mapOf(
        Screen.SKY to "GPS satellites overhead", Screen.GAMES to "Mini-games for coins", Screen.SHOP to "Items, hats & paint",
        Screen.AWARDS to "Achievements", Screen.PROFILE to "Stats & life story", Screen.JOURNAL to "Everything that happened",
        Screen.LAB to "Live phone sensors", Screen.SETTINGS to "Options & permissions",
    )
    Column(Modifier.fillMaxSize()) {
        ScreenTitle("More", "Everything else your buddy can do")
        LazyVerticalGrid(GridCells.Fixed(2), Modifier.padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(items) { s ->
                Column(
                    Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(Pal.panel)
                        .border(1.dp, Pal.line, RoundedCornerShape(18.dp))
                        .clickable { go(s) }
                        .padding(16.dp)
                ) {
                    Text(s.icon, fontSize = 30.sp)
                    Spacer(Modifier.width(4.dp))
                    Text(s.title, color = Pal.text, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(blurbs[s] ?: "", color = Pal.sub, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun rememberGame(repo: GameRepository) = repo.state.collectAsStateWithLifecycle()

@Composable
fun Row2(content: @Composable () -> Unit) = Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) { content() }
