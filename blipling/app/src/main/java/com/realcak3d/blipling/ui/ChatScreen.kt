package com.realcak3d.blipling.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.realcak3d.blipling.core.Phrases
import com.realcak3d.blipling.core.Topic
import com.realcak3d.blipling.data.GameRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private data class Msg(val fromBuddy: Boolean, val text: String)

/** Chat history survives screen switches for the session. */
private val history = mutableStateListOf<Msg>()

@Composable
fun ChatScreen(repo: GameRepository) {
    val g by rememberGame(repo)
    val speech by repo.speech.collectAsStateWithLifecycle()
    var input by remember { mutableStateOf("") }
    var typing by remember { mutableStateOf(false) }
    val list = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val now = System.currentTimeMillis()

    LaunchedEffect(Unit) {
        if (history.isEmpty()) history += Msg(true, Phrases.say(Topic.GREETING, repo.engine.ctx(System.currentTimeMillis())) + "  (type \"help\" for ideas)")
    }
    LaunchedEffect(history.size, typing) { if (history.isNotEmpty()) list.animateScrollToItem(history.size - 1 + if (typing) 1 else 0) }

    fun send(text: String) {
        val t = text.trim()
        if (t.isEmpty() || typing) return
        history += Msg(false, t)
        input = ""
        scope.launch {
            typing = true
            val reply = repo.talk(t)
            delay((350 + reply.text.length * 18L).coerceAtMost(1800))
            typing = false
            history += Msg(true, reply.text)
            if (history.size > 200) history.removeRange(0, history.size - 200)
        }
    }

    Column(Modifier.fillMaxSize().imePadding()) {
        Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(84.dp)) {
                BuddyView(g.look(now), speech.anim, speech.at, Modifier.fillMaxSize(), onTap = { repo.act { n -> pet(n) } })
            }
            Column(Modifier.padding(start = 6.dp)) {
                Text("Chat with ${g.buddy.name.ifBlank { "your egg" }}", color = Pal.text, fontSize = 18.sp)
                Text("Old-school brain · ${Phrases.jokes.size} jokes · ${Phrases.riddles.size} riddles · remembers what you tell it", color = Pal.sub, fontSize = 11.sp)
            }
        }
        LazyColumn(Modifier.weight(1f).fillMaxWidth().padding(horizontal = 10.dp), state = list, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            items(history.size) { i ->
                val m = history[i]
                Row(Modifier.fillMaxWidth(), horizontalArrangement = if (m.fromBuddy) Arrangement.Start else Arrangement.End) {
                    Text(
                        m.text, fontSize = 15.sp,
                        color = if (m.fromBuddy) Pal.bg else Pal.text,
                        modifier = Modifier
                            .widthIn(max = 290.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (m.fromBuddy) Color(0xFFE9FFF6) else Pal.panel2)
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }
            if (typing) item { Text("${g.buddy.name.ifBlank { "egg" }} is typing… ${Phrases.sounds.random()}", color = Pal.sub, fontSize = 12.sp) }
        }
        LazyRow(Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            val quick = listOf("How are you?", "Tell me a joke", "Riddle", "Tell me a story", "Sing!", "Fortune", "Guess a number", "Fun fact", "What do you remember?", "I love you", "Good night")
            item { Spacer(Modifier.size(4.dp)) }
            items(quick) { q ->
                Text(q, color = Pal.mint, fontSize = 13.sp, modifier = Modifier.clip(RoundedCornerShape(50)).background(Pal.panel).clickable { send(q) }.padding(horizontal = 12.dp, vertical = 7.dp))
            }
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = input, onValueChange = { input = it.take(200) }, modifier = Modifier.weight(1f),
                placeholder = { Text("Say something…") }, singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { send(input) }),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Pal.mint, unfocusedBorderColor = Pal.line),
            )
            Spacer(Modifier.size(8.dp))
            BigButton("Send", Pal.mint) { send(input) }
        }
        Spacer(Modifier.height(4.dp))
    }
}
