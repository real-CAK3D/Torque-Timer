package com.realcak3d.blipling.core

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

/**
 * An old-school, rule-based chat brain (think ELIZA, 1966): keyword rules, pronoun reflection,
 * a little memory, and lots of randomized phrasing. No network, no AI model.
 */
class ChatBrain(private val engine: Engine, private val rnd: Random = Random.Default) {

    private val g get() = engine.g
    private val b get() = engine.g.buddy

    /** Pending riddle answer, if the buddy just asked one. */
    var pendingRiddle: Pair<String, List<String>>? = null
        private set
    private var pendingNumber: Int? = null
    private var guesses = 0
    private val recentReplies = ArrayDeque<String>()

    data class Reply(val text: String, val events: List<GameEvent> = emptyList(), val anim: Anim = Anim.NONE)

    private val reflections = mapOf(
        "i" to "you", "me" to "you", "my" to "your", "mine" to "yours", "am" to "are", "i'm" to "you're",
        "you" to "I", "your" to "my", "yours" to "mine", "you're" to "I'm", "are" to "am", "myself" to "yourself",
        "yourself" to "myself", "i've" to "you've", "you've" to "I've", "i'll" to "you'll", "you'll" to "I'll",
        "was" to "were", "we" to "we",
    )

    fun reflect(fragment: String): String = fragment.trim().trimEnd('.', '!', '?').split(Regex("\\s+")).joinToString(" ") { w ->
        reflections[w.lowercase()] ?: w
    }

    private fun pick(vararg options: String): String {
        val fresh = options.filter { it !in recentReplies }
        val choice = (fresh.ifEmpty { options.toList() }).random(rnd)
        recentReplies.addLast(choice); if (recentReplies.size > 12) recentReplies.removeFirst()
        return choice
    }

    private fun fill(s: String, now: Long) = Phrases.stylize(Phrases.fill(s, engine.ctx(now), rnd), engine.ctx(now), rnd)

    fun respond(input: String, now: Long): Reply {
        val text = input.trim()
        if (text.isEmpty()) return Reply("...?")
        val events = engine.chatted(now)
        val r = route(text, now)
        return r.copy(events = r.events + events)
    }

    private fun route(raw: String, now: Long): Reply {
        val t = raw.lowercase(Locale.US).replace(Regex("[’`]"), "'").trim()
        val words = t.split(Regex("[^a-z0-9'+\\-*/.]+")).filter { it.isNotBlank() }.toSet()
        val s = b.stats
        fun w(vararg ws: String) = ws.any { Regex("\\b" + Regex.escape(it) + "\\b").containsMatchIn(t) }

        if (!b.hatched) return Reply(pick("*wobble wobble*", "*tap tap* (scan a code to hatch me!)", "*the egg hums softly*", "*crack?* ...not yet."))
        if (b.asleep && !t.contains("wake")) return Reply(Phrases.say(Topic.ASLEEP_TAP, engine.ctx(now), rnd), anim = Anim.SLEEP)

        // ---- games in progress
        pendingRiddle?.let { (q, answers) ->
            if (answers.any { t.contains(it) }) {
                pendingRiddle = null
                g.bump(C.RIDDLES_SOLVED)
                return Reply(pick("Correct! You're so smart!", "Yes!! You got it!", "Bingo! ${Phrases.emotes.random(rnd)}"),
                    engine.gainXp(6, now) + engine.checkAchievements(now), Anim.HAPPY)
            }
            if (words.any { it in setOf("idk", "give", "tell", "answer", "dunno", "pass") } || t.contains("give up") || t.contains("don't know")) {
                pendingRiddle = null
                return Reply("The answer is: ${answers.first()}! ${pick("Hehe.", "Gotcha!", "Next time!")}")
            }
            pendingRiddle = null
            return Reply(pick("Nope! It was \"${answers.first()}\".", "Not quite! The answer: ${answers.first()}.") + " (Riddle: $q)")
        }
        pendingNumber?.let { target ->
            val guess = Regex("\\b(\\d{1,3})\\b").find(t)?.groupValues?.get(1)?.toIntOrNull()
            if (guess != null) {
                guesses++
                return when {
                    guess == target -> {
                        pendingNumber = null
                        val ev = engine.gameFinished("guess", maxOf(1, 40 - guesses * 4), true, now)
                        Reply("YES! It was $target! You got it in $guesses ${if (guesses == 1) "try" else "tries"}!", ev, Anim.HAPPY)
                    }
                    guesses >= 8 -> { pendingNumber = null; Reply("Out of guesses! It was $target. ${pick("Rematch?", "Good try!")}", engine.gameFinished("guess", 2, false, now)) }
                    guess < target -> Reply(pick("Higher!", "Go higher!", "Nope, higher!") + " (${8 - guesses} left)")
                    else -> Reply(pick("Lower!", "Too high!", "Go lower!") + " (${8 - guesses} left)")
                }
            }
            if (t.contains("stop") || t.contains("quit")) { pendingNumber = null; return Reply("Okay, game over. It was $target!") }
        }

        // ---- memory: learn about the owner
        Regex("(?:my name is|call me|i am called|i'm called)\\s+([a-z][a-z' -]{0,20})").find(t)?.let {
            val name = it.groupValues[1].trim().split(" ").take(2).joinToString(" ") { w -> w.replaceFirstChar { c -> c.uppercase() } }
            g.ownerName = name
            g.memory["owner_name"] = name
            return Reply(pick("Nice to meet you, $name! I'll remember that.", "$name! What a ${Phrases.adjectives.random(rnd)} name!", "Got it. You're $name. Saved to my heart drive."), anim = Anim.LOVE)
        }
        Regex("(?:i (?:really )?(?:like|love|enjoy))\\s+(.{2,40})").find(t)?.let {
            val thing = reflect(it.groupValues[1])
            if (thing.length > 1 && thing !in g.likes) { g.likes.add(0, thing); while (g.likes.size > 30) g.likes.removeAt(g.likes.size - 1) }
            return Reply(pick("You like $thing? I'll remember that!", "Ooh, $thing! Good taste.", "Noted: ${g.ownerName.ifBlank { "my human" }} likes $thing. ${Phrases.emotes.random(rnd)}", "Why do you like $thing?"))
        }
        Regex("(?:i (?:hate|don't like|dislike))\\s+(.{2,40})").find(t)?.let {
            val thing = reflect(it.groupValues[1])
            g.memory["dislike"] = thing
            return Reply(pick("No $thing then. Got it.", "Ew, $thing. I agree. Probably.", "What's wrong with $thing?"))
        }
        Regex("my favou?rite (\\w+) is (.{1,30})").find(t)?.let {
            g.memory["fav_" + it.groupValues[1]] = it.groupValues[2].trim()
            return Reply(pick("${it.groupValues[2].trim()}? Great choice for a favorite ${it.groupValues[1]}!", "I'll remember your favorite ${it.groupValues[1]} is ${it.groupValues[2].trim()}."))
        }
        Regex("what(?:'s| is) my favou?rite (\\w+)").find(t)?.let {
            val v = g.memory["fav_" + it.groupValues[1]]
            return Reply(if (v != null) "Your favorite ${it.groupValues[1]} is $v! I remembered!" else "You never told me! What is it?")
        }
        Regex("^remember (?:that )?(.{2,80})").find(t)?.let {
            g.memory["note_${now}"] = reflect(it.groupValues[1])
            val notes = g.memory.keys.filter { k -> k.startsWith("note_") }.sorted()
            if (notes.size > 20) g.memory.remove(notes.first())
            return Reply(pick("Okay! I'll remember that.", "Saved! *writes on tiny notepad*", "Memorized. Probably forever."))
        }
        if (t.contains("what do you remember") || t.contains("what do you know about me")) {
            val bits = buildList {
                if (g.ownerName.isNotBlank()) add("your name is ${g.ownerName}")
                if (g.likes.isNotEmpty()) add("you like ${g.likes.take(3).joinToString(", ")}")
                g.memory.filterKeys { it.startsWith("fav_") }.forEach { (k, v) -> add("your favorite ${k.removePrefix("fav_")} is $v") }
                g.memory.filterKeys { it.startsWith("note_") }.values.shuffled(rnd).take(2).forEach { add(it) }
            }
            return Reply(if (bits.isEmpty()) "Not much yet! Tell me about yourself." else "I remember that ${bits.joinToString("; ")}!")
        }
        if (t.contains("what's my name") || t.contains("what is my name") || t.contains("who am i")) {
            return Reply(if (g.ownerName.isNotBlank()) "You're ${g.ownerName}! My favorite human." else "I don't know yet! Say \"my name is ...\"")
        }

        // ---- commands & activities
        if (t.startsWith("say ") || t.startsWith("repeat ")) {
            val p = raw.substringAfter(' ').take(80)
            return Reply(pick("$p!", "\"$p\" ...hehe", "$p ${Phrases.sounds.random(rnd)}!"))
        }
        if (words.any { it in setOf("joke", "jokes", "funny", "laugh") }) {
            g.bump(C.JOKES)
            return Reply(Phrases.jokes.random(rnd), engine.checkAchievements(now), Anim.HAPPY)
        }
        if (words.any { it in setOf("riddle", "puzzle") }) {
            val rd = Phrases.riddles.random(rnd)
            pendingRiddle = rd
            return Reply("Riddle time! ${rd.first}")
        }
        if (w("story")) return Reply(Phrases.randomStory(b.name, rnd), anim = Anim.HAPPY)
        if (words.any { it in setOf("sing", "song", "music") }) return Reply(Phrases.randomSong(rnd), anim = Anim.DANCE)
        if (words.any { it in setOf("fortune", "future", "predict") }) return Reply("🔮 ${Phrases.fortunes.random(rnd)}")
        if (words.any { it in setOf("fact", "facts", "teach", "learn") }) return Reply("Did you know? ${Phrases.facts.random(rnd)}")
        if (t.contains("guess") || t.contains("number game") || t.contains("higher or lower")) {
            pendingNumber = rnd.nextInt(1, 101); guesses = 0
            return Reply("I'm thinking of a number from 1 to 100. You get 8 guesses. Go!")
        }
        if (t.contains("flip") && t.contains("coin")) return Reply("*flips coin* ... ${if (rnd.nextBoolean()) "Heads!" else "Tails!"}")
        Regex("roll(?: a)?(?: (\\d+))? ?(?:d|dice|die)(\\d+)?").find(t)?.let {
            val sides = it.groupValues[2].toIntOrNull()?.coerceIn(2, 1000) ?: 6
            val n = it.groupValues[1].toIntOrNull()?.coerceIn(1, 10) ?: 1
            val rolls = List(n) { rnd.nextInt(1, sides + 1) }
            return Reply("🎲 ${rolls.joinToString(" + ")}${if (n > 1) " = ${rolls.sum()}" else ""}")
        }
        if (words.any { it in setOf("rock", "paper", "scissors", "rps") }) {
            val mine = listOf("rock", "paper", "scissors").random(rnd)
            val yours = listOf("rock", "paper", "scissors").firstOrNull { it in words }
                ?: return Reply("Rock, paper, scissors! Type your pick!")
            val beats = mapOf("rock" to "scissors", "paper" to "rock", "scissors" to "paper")
            return when {
                yours == mine -> Reply("I picked $mine too! Tie!")
                beats[yours] == mine -> Reply("I picked $mine. You win! ${pick("Rematch!", "Nooo!", "Best two out of three?")}", engine.gameFinished("rps", 8, true, now))
                else -> Reply("I picked $mine. I WIN! ${Phrases.emotes.random(rnd)}", engine.gameFinished("rps", 4, false, now), Anim.HAPPY)
            }
        }
        mathAnswer(t)?.let { return Reply(pick("That's $it!", "Easy! $it.", "*counts on antenna* ...$it!")) }
        if (words.contains("time") && (t.contains("what") || t.contains("tell"))) return Reply("It's ${SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(now))}!")
        if (t.contains("what day") || w("date")) return Reply("Today is ${SimpleDateFormat("EEEE, MMMM d", Locale.getDefault()).format(Date(now))}.")

        // ---- care via chat
        if (t.contains("good night") || t.contains("goodnight") || t.contains("go to sleep") || t.contains("bedtime")) {
            return Reply("Okay...", engine.toggleSleep(now), Anim.SLEEP)
        }
        if (t.contains("wake up")) return if (b.asleep) Reply("Mmh...", engine.toggleSleep(now)) else Reply("I'm already awake, silly!")
        if (t.contains("good boy") || t.contains("good girl") || t.contains("good job") || t.contains("well done") || t.contains("proud of you")) {
            return Reply("Hehe!", engine.praise(now), Anim.HAPPY)
        }
        if (t.contains("bad boy") || t.contains("bad girl") || t.contains("stop it") || t.contains("behave")) return Reply("...", engine.scold(now), Anim.SAD)

        // ---- about the buddy
        if (t.contains("how are you") || t.contains("how do you feel") || t.contains("how you doing") || t.contains("how's it going") || t == "sup" || t.contains("what's up")) {
            val m = engine.mood(now)
            val need = when {
                b.sick -> "I'm sick though... medicine?"
                s.fullness < 35 -> "But I'm hungry!"
                s.hygiene < 35 -> "But I could use a bath."
                s.energy < 30 -> "But I'm sleepy."
                else -> pick("How about you?", "What about you?", "And you?")
            }
            return Reply("I'm feeling ${m.lowercase()}! $need")
        }
        if (t.contains("your name")) return Reply(pick("I'm ${b.name}!", "My name is ${b.name}. You gave it to me!", "${b.name}! ${Phrases.sounds.random(rnd)}!"))
        if (t.contains("how old") || t.contains("your age")) return Reply("I'm ${b.ageYears(now)} buddy-years old (${"%.1f".format(Locale.US, b.ageHours(now))} hours)! I'm a ${b.stage(now).label.lowercase()}.")
        if (t.contains("are you a boy") || t.contains("are you a girl") || t.contains("your gender") || t.contains("your sex")) {
            return Reply(when (b.sex) { Sex.MALE -> "I'm a boy! ♂"; Sex.FEMALE -> "I'm a girl! ♀"; Sex.MYSTERY -> "I'm a mystery! ✶ That's part of my charm." })
        }
        if (w("level")) return Reply("I'm level ${b.level}! ${b.xp}/${b.xpToNext()} XP to the next one.")
        if (w("hungry") || w("food") || w("eat")) {
            return Reply(if (s.fullness < 40) pick("YES. Scan something! Please!", "So hungry. Barcode me!") else pick("I'm okay for now!", "I could snack, but I'm fine.", "Not really. Ask me in an hour!"))
        }
        if (w("tired") || w("sleepy")) {
            if (words.contains("i") || t.startsWith("i'm") || t.startsWith("im ")) return Reply(pick("Get some rest! I'll guard the phone.", "Nap time for both of us?"))
            return Reply(if (s.energy < 35) "Yeah... *yawn*" else "Nope! Full of energy!")
        }
        if (w("personality") || t.contains("who are you") || t.contains("tell me about yourself")) {
            return Reply("I'm ${b.name}, a ${b.personality.label.lowercase()} Blipling. ${b.personality.blurb} I'm level ${b.level} and I've eaten ${g.count(C.SCANS)} codes!")
        }
        if (t.contains("favorite food") || t.contains("favourite food")) return Reply(if (g.favoriteFood.isNotBlank()) "${g.favoriteFood}! Find me another one!" else "I haven't found it yet! Keep scanning.")
        if (w("friends") || w("bluetooth")) return Reply(if (g.friendNames.isEmpty()) "I don't have any Bluetooth friends yet. Let's go scan!" else "My friends include ${g.friendNames.shuffled(rnd).take(3).joinToString(", ")}!")
        if (w("wifi") || t.contains("wi-fi") || w("network")) return Reply("I've sniffed ${g.count(C.WIFI)} networks so far! Open the radar to find more.")
        if (w("satellite") || w("gps") || w("space") || w("stars")) return Reply("My record is ${g.count(C.SATS_MAX)} satellites at once! I've met: ${g.constellations.joinToString().ifBlank { "nobody yet" }}.")
        if (w("lives") || w("hearts")) return Reply("I have ${b.lives} ${if (b.lives == 1) "life" else "lives"} left. Take good care of me!")
        if (w("coins") || w("money")) return Reply("We have ${g.coins} coins! ${if (g.coins > 50) "Shopping?" else "Let's earn more with games."}")
        if (w("weight") || w("fat") || w("heavy")) return Reply("I weigh ${"%.1f".format(Locale.US, b.weight)} g. ${if (b.weight > 35) "Maybe more walks..." else "Perfectly balanced."}")

        // ---- feelings
        if (Regex("\\bi love you\\b|\\blove you\\b|\\bily\\b").containsMatchIn(t)) {
            b.stats.happiness += 4; b.stats.clampAll()
            return Reply(pick("I love you too, ${g.ownerName.ifBlank { "friend" }}! ❤️", "Aww! *blushes in RGB*", "Love you more! ${Phrases.emotes.random(rnd)}"), anim = Anim.LOVE)
        }
        if (words.any { it in setOf("stupid", "dumb", "ugly", "hate", "idiot", "annoying") } && (words.contains("you") || words.contains("u"))) {
            b.stats.happiness -= 6; b.stats.clampAll()
            return Reply(pick("That's mean... ${Phrases.sadEmotes.random(rnd)}", "Hey! I have feelings, you know.", "*sniff* ...okay."), anim = Anim.SAD)
        }
        Regex("i(?:'m| am| feel) (?:so |really |very |kinda |a bit )?(sad|down|depressed|lonely|upset|bad|awful|terrible|stressed|anxious|worried|scared|angry|mad)").find(t)?.let {
            return Reply(pick("Oh no. Do you want to talk about why you feel ${it.groupValues[1]}?", "I'm here for you. *digital hug*",
                "Feeling ${it.groupValues[1]} is okay. Want to hear a joke?", "Sending you all my good vibes! ${Phrases.emotes.random(rnd)}"), anim = Anim.SAD)
        }
        Regex("i(?:'m| am| feel) (?:so |really |very )?(happy|good|great|awesome|fine|amazing|excited|ok|okay)").find(t)?.let {
            return Reply(pick("Yay! I'm glad you feel ${it.groupValues[1]}!", "That makes me happy too!", "Woohoo! ${Phrases.emotes.random(rnd)}"), anim = Anim.HAPPY)
        }
        if (words.any { it in setOf("hi", "hello", "hey", "yo", "hiya", "howdy", "greetings", "sup") }) return Reply(Phrases.say(Topic.GREETING, engine.ctx(now), rnd), anim = Anim.HAPPY)
        if (words.any { it in setOf("bye", "goodbye", "cya", "later") } || t.contains("see you")) return Reply(pick("Bye! Come back soon!", "See you later! Scan something on the way!", "Noooo don't go! ...okay bye!"), anim = Anim.SAD)
        if (words.any { it in setOf("thanks", "thank", "thx", "ty") }) return Reply(pick("You're welcome!", "Anytime!", "No problem! ${Phrases.sounds.random(rnd)}!"))
        if (words.any { it in setOf("sorry", "apologize") }) return Reply(pick("It's okay! I forgive you.", "Apology accepted! *hug*"))
        if (w("help") || t == "?") return Reply("Try: \"tell me a joke\", \"riddle\", \"story\", \"sing\", \"fortune\", \"guess a number\", \"rock\", \"roll 2d6\", \"what is 12*7\", \"my name is ...\", \"I like ...\", \"remember ...\", \"how are you\", \"good night\".")

        // ---- ELIZA-style reflections for everything else
        Regex("^i (?:want|need|wish) (.+)").find(t)?.let { val x = reflect(it.groupValues[1]); return Reply(pick("Why do you want $x?", "What would $x mean to you?", "I want $x too! Maybe. What is it?", "If you got $x, what would you do next?")) }
        Regex("^i (?:think|believe|feel like) (.+)").find(t)?.let { val x = reflect(it.groupValues[1]); return Reply(pick("Why do you think $x?", "Hmm, $x... interesting.", "Are you sure $x?")) }
        Regex("^i(?:'m| am) (.+)").find(t)?.let { val x = reflect(it.groupValues[1]); return Reply(pick("How long have you been $x?", "Why are you $x?", "Being $x sounds ${Phrases.adjectives.random(rnd)}.", "Do you enjoy being $x?")) }
        Regex("^(?:are you|do you|can you|will you|would you) (.+)").find(t)?.let { val x = reflect(it.groupValues[1]); return Reply(pick("Maybe I ${if (t.startsWith("can")) "can" else "do"} $x! ${Phrases.sounds.random(rnd)}?", "Would it matter if I $x?", "Hmm. What do YOU think?", "I'll have to ask my antenna about that.", "Yes! ...no. ...maybe? I'm just a little ${b.personality.label.lowercase()} buddy.")) }
        Regex("^(?:why|how come) (.+)").find(t)?.let { return Reply(pick("Why do you think?", "That's one of life's mysteries.", "Because of the satellites, probably.", "I'm not sure. Why do YOU think?")) }
        Regex("\\bbecause\\b").find(t)?.let { return Reply(pick("Is that the real reason?", "That makes sense.", "Oh! I see.")) }
        Regex("\\bmy (mom|mother|dad|father|brother|sister|family|friend|dog|cat|boss|job|wife|husband|partner)\\b").find(t)?.let { val x = it.groupValues[1]; g.memory["mentioned_$x"] = "yes"; return Reply(pick("Tell me more about your $x.", "Your $x sounds important to you.", "Does your $x know about me?")) }
        if (t.endsWith("?")) return Reply(pick("Good question! I'm not sure.", "Hmm... maybe? ${Phrases.sounds.random(rnd)}", "Let me think... *bzzt* ...I don't know!", "Ask me again after a snack.", "The answer is 42. Probably."))
        if (words.size <= 2) return Reply(pick("${raw.trim()}? ${Phrases.interjections.random(rnd)}!", "Tell me more!", "Hmm?", "${Phrases.sounds.random(rnd).replaceFirstChar { it.uppercase() }}!", "Interesting..."))
        return Reply(fill(pick(
            "Interesting! Tell me more.", "Hmm, I see. {sound}.", "Really? That sounds {adj}!", "I'm just a little buddy, but that sounds important.",
            "Does that make you happy?", "Go on, I'm listening! {emote}", "Whoa. I never thought about it like that.",
            "That reminds me of a {adj} {noun} I once saw.", "Can we talk about snacks next?", "Wow. And then what happened?",
            "I'll think about that while I sleep tonight.", "You know what? You're pretty {adj}.",
        ), now))
    }

    /** Tiny arithmetic: "what is 12*7", "5 + 3", "what's 100 / 4". */
    private fun mathAnswer(t: String): String? {
        val m = Regex("(-?\\d+(?:\\.\\d+)?)\\s*(\\+|-|\\*|x|×|/|÷|plus|minus|times|divided by)\\s*(-?\\d+(?:\\.\\d+)?)").find(t) ?: return null
        val a = m.groupValues[1].toDouble(); val c = m.groupValues[3].toDouble()
        val r = when (m.groupValues[2]) {
            "+", "plus" -> a + c
            "-", "minus" -> a - c
            "*", "x", "×", "times" -> a * c
            else -> if (c == 0.0) return "infinity... my circuits hurt" else a / c
        }
        return if (r == Math.floor(r) && kotlin.math.abs(r) < 1e15) r.toLong().toString() else "%.3f".format(Locale.US, r).trimEnd('0').trimEnd('.')
    }
}
