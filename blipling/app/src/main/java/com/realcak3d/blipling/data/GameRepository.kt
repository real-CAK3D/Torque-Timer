package com.realcak3d.blipling.data

import android.content.Context
import com.realcak3d.blipling.core.Anim
import com.realcak3d.blipling.core.ChatBrain
import com.realcak3d.blipling.core.Codec
import com.realcak3d.blipling.core.Engine
import com.realcak3d.blipling.core.GameData
import com.realcak3d.blipling.core.GameEvent
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow

/** The single owner of game state. Every change goes through [act], which saves and publishes a fresh snapshot. */
class GameRepository private constructor(context: Context) {

    private val prefs = context.getSharedPreferences("blipling_save", Context.MODE_PRIVATE)
    private val lock = Any()

    val data: GameData = load()
    val engine = Engine(data)
    val chat = ChatBrain(engine)

    private val _state = MutableStateFlow(snapshot())
    /** An immutable-by-convention deep copy for the UI. Never mutate it. */
    val state: StateFlow<GameData> = _state.asStateFlow()

    private val _events = MutableSharedFlow<GameEvent>(extraBufferCapacity = 64)
    val events: SharedFlow<GameEvent> = _events.asSharedFlow()

    private val _speech = MutableStateFlow(Speech("", Anim.NONE, 0L))
    val speech: StateFlow<Speech> = _speech.asStateFlow()

    data class Speech(val text: String, val anim: Anim, val at: Long)

    private fun load(): GameData {
        val raw = prefs.getString(KEY, null)
        val g = raw?.let { runCatching { Codec.decode(it) }.getOrNull() } ?: GameData()
        if (g.buddy.eggLaidAt == 0L && !g.buddy.hatched) Engine(g).newEgg(System.currentTimeMillis())
        return g
    }

    private fun snapshot(): GameData = Codec.decode(Codec.encode(data))

    fun act(block: Engine.(now: Long) -> List<GameEvent>): List<GameEvent> {
        val events: List<GameEvent>
        synchronized(lock) {
            events = engine.block(System.currentTimeMillis())
            persist()
        }
        publish(events)
        return events
    }

    /** For chat: returns the reply text and publishes side effects. */
    fun talk(text: String): ChatBrain.Reply {
        val reply: ChatBrain.Reply
        synchronized(lock) {
            reply = chat.respond(text, System.currentTimeMillis())
            persist()
        }
        publish(reply.events.filter { it !is GameEvent.Say })
        if (reply.anim != Anim.NONE) _speech.value = Speech("", reply.anim, System.currentTimeMillis())
        return reply
    }

    fun say(text: String, anim: Anim = Anim.NONE) {
        _speech.value = Speech(text, anim, System.currentTimeMillis())
    }

    fun publish(events: List<GameEvent>) {
        _state.value = snapshot()
        for (e in events) {
            if (e is GameEvent.Say) _speech.value = Speech(e.text, e.anim, System.currentTimeMillis())
            _events.tryEmit(e)
        }
    }

    private fun persist() {
        prefs.edit().putString(KEY, Codec.encode(data)).apply()
    }

    fun resetEverything() {
        synchronized(lock) {
            val fresh = GameData()
            // Copy into the existing instance so Engine/Chat keep their references.
            data.buddy = fresh.buddy; data.coins = fresh.coins; data.ownerName = ""
            data.inventory.clear(); data.inventory.putAll(fresh.inventory)
            data.ownedCosmetics.clear(); data.achievements.clear(); data.counters.clear()
            data.codeLastEaten.clear(); data.codeTimesEaten.clear(); data.seenWifi.clear(); data.seenBt.clear()
            data.friendNames.clear(); data.constellations.clear(); data.memory.clear(); data.likes.clear()
            data.journal.clear(); data.graveyard.clear(); data.daily.clear(); data.bestScores.clear()
            data.lastFoodName = ""; data.favoriteFood = ""; data.created = 0L
            engine.newEgg(System.currentTimeMillis())
            persist()
        }
        publish(emptyList())
        say("*a fresh egg appears*")
    }

    companion object {
        private const val KEY = "game"
        @Volatile private var instance: GameRepository? = null
        fun get(context: Context): GameRepository =
            instance ?: synchronized(this) { instance ?: GameRepository(context.applicationContext).also { instance = it } }
    }
}
