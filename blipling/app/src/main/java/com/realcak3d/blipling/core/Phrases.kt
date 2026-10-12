package com.realcak3d.blipling.core

import kotlin.random.Random

/** What the buddy is reacting to. Each topic has a pool of templates that get randomized and decorated. */
enum class Topic {
    GREETING, IDLE_HAPPY, IDLE_BORED, IDLE_SAD, HUNGRY, STARVING, FULL, ATE, ATE_RARE, ATE_LEGENDARY, ATE_REPEAT,
    ATE_SPOILED, ATE_SPICY, ATE_JUNK, ATE_HEALTHY, REFUSE_FOOD, SLEEPY, GOODNIGHT, WAKE, ASLEEP_TAP, DIRTY,
    POOPED, CLEANED, SICK, CURED, PETTED, OVERPETTED, LEVEL_UP, ACHIEVEMENT, WIFI_FOUND, WIFI_OPEN, WIFI_NONE,
    BT_FOUND, BT_HUG, RADAR_HOT, RADAR_COLD, RADAR_LOCK, SATELLITES, NO_SATELLITES, STEPS, SHAKEN, DIZZY,
    DARK, PEEKABOO, CHARGING, LOUD, GAME_WIN, GAME_LOSE, BOUGHT, BROKE, TANTRUM, SCOLDED, PRAISED, HATCH,
    DIED, REVIVED, NIGHT, MORNING, MAGNET, HIGH_ALTITUDE, NFC, BIRTHDAY,
}

object Phrases {

    val sounds = listOf("bleep", "bloop", "blip", "boop", "zzt", "brrp", "mrrp", "beep-beep", "pip", "wub", "ding", "bzzt", "doot")
    val emotes = listOf("(^▽^)", "(•ᴗ•)", "(≧◡≦)", "ヽ(•‿•)ノ", "(｡•̀ᴗ-)", "(*^ω^)", "(ᵔᴥᵔ)", "(˘▾˘)", "\\(^o^)/", "(◕‿◕)")
    val sadEmotes = listOf("(╥﹏╥)", "(._.)", "(T_T)", "(｡•́︿•̀｡)", "(-_-)", "(ノ_<。)")
    val adjectives = listOf("amazing", "spicy", "shiny", "weird", "wonderful", "fuzzy", "suspicious", "glorious",
        "tiny", "enormous", "electric", "cozy", "mysterious", "silly", "radical", "crunchy", "sparkly", "legendary")
    val nouns = listOf("antenna", "pixel", "byte", "satellite", "snack", "router", "cloud", "barcode", "radar",
        "toaster", "dream", "sock", "noodle", "rainbow", "puddle", "moon", "robot", "signal", "cookie", "pickle")
    val interjections = listOf("Ooh", "Whoa", "Hmm", "Yay", "Eep", "Heh", "Wow", "Aww", "Oho", "Hehe", "Golly", "Psst", "Hey")
    private val teenSlang = listOf("no cap", "fr fr", "lowkey", "highkey", "it's giving", "vibes", "bet", "slay", "ngl")
    private val elderWisdom = listOf(
        "In my day, barcodes had only twelve digits.", "Patience is a signal you can't scan.",
        "Every byte counts, young one.", "The stars were always there. We just had to look up.",
        "A full belly and a good friend. That's the whole secret.", "Even the strongest Wi-Fi fades with distance.",
    )
    private val babyBabble = listOf("goo", "ba", "blip", "pa", "da", "mumu", "beeb", "nom", "ga", "bap")

    val jokes = listOf(
        "Why did the barcode break up with the scanner? It felt read all over!",
        "What do you call a buddy with no Wi-Fi? Disconnected and confused. Like me before breakfast.",
        "Why don't satellites ever get lost? They always know their orbit-trary location!",
        "I told my router a joke. It didn't get it. Bad reception.",
        "Why was the QR code so good at parties? It always knew how to scan the room.",
        "What's a computer's favorite snack? Microchips!",
        "Why did the Bluetooth device go to therapy? Pairing issues.",
        "How do robots eat salsa? With computer chips!",
        "Why did the pixel go to school? To get a little brighter.",
        "I tried to catch fog yesterday. Mist.",
        "What do you call a sleeping dinosaur? A dino-snore!",
        "Why can't a bicycle stand up by itself? It's two-tired.",
        "I'm reading a book about anti-gravity. It's impossible to put down!",
        "Why did the cookie go to the doctor? It felt crummy.",
        "Parallel lines have so much in common. It's a shame they'll never meet.",
        "What did the ocean say to the beach? Nothing, it just waved.",
        "Why are ghosts bad liars? You can see right through them.",
        "Why did the scarecrow win an award? He was outstanding in his field.",
        "What do you call a fake noodle? An impasta!",
        "How does a penguin build its house? Igloos it together.",
    )

    /** Riddles: question to answer keywords (any one matches). */
    val riddles = listOf(
        "What has keys but can't open locks?" to listOf("piano", "keyboard"),
        "What gets wetter the more it dries?" to listOf("towel"),
        "What has hands but can't clap?" to listOf("clock", "watch"),
        "What has a neck but no head?" to listOf("bottle", "shirt"),
        "What can you catch but not throw?" to listOf("cold", "breath", "feelings"),
        "What has many teeth but can't bite?" to listOf("comb", "zipper", "saw"),
        "What goes up but never comes down?" to listOf("age"),
        "What has one eye but can't see?" to listOf("needle", "storm", "hurricane"),
        "What is full of holes but still holds water?" to listOf("sponge"),
        "What has a head, a tail, but no body?" to listOf("coin", "penny"),
        "The more you take, the more you leave behind. What am I?" to listOf("footsteps", "steps"),
        "What runs but never walks?" to listOf("water", "river", "nose", "time"),
        "What has stripes and gets scanned at the store?" to listOf("barcode", "bar code", "upc"),
        "I'm invisible, everywhere in your house, and you can't stream without me. What am I?" to listOf("wifi", "wi-fi", "internet"),
    )

    val fortunes = listOf(
        "A mysterious barcode will cross your path.", "Your next snack will be legendary.",
        "Someone nearby is thinking about Bluetooth.", "Look up tonight. A satellite is waving at you.",
        "Good things come to those who scan.", "Today is a great day to drink water.",
        "A strong signal lies to the north. Or maybe south. Definitely somewhere.",
        "You will find a coin in an unexpected place.", "Your kindness will be repaid in pixels.",
        "Adventure awaits beyond the next Wi-Fi network.", "A nap is in your future. Embrace it.",
    )

    val facts = listOf(
        "There are over 30 GPS satellites orbiting about 20,000 km above us!",
        "QR stands for Quick Response. Invented in 1994 to track car parts!",
        "The first product ever scanned at a store was a pack of chewing gum, in 1974.",
        "Bluetooth is named after a Viking king, Harald Bluetooth!",
        "Wi-Fi signals are radio waves, just like the radio but way chattier.",
        "Galileo is Europe's satellite system. BeiDou is China's. GLONASS is Russia's.",
        "A QR code can still be read even if almost a third of it is damaged!",
        "5 GHz Wi-Fi is faster, but 2.4 GHz travels farther through walls.",
        "Your phone has a compass, a barometer, a light sensor and more. I use them all!",
        "Octopuses have three hearts. I have one, but it's very big.",
        "Honey never spoils. Unlike some codes I've eaten.",
        "Bananas are berries, but strawberries aren't. Food is weird.",
    )

    private val pools: Map<Topic, List<String>> = mapOf(
        Topic.GREETING to listOf("Hi {owner}! {sound}!", "Welcome back, {owner}!", "{interj}! You're here! {emote}",
            "I missed you, {owner}!", "Hello hello hello!", "Oh hey {owner}, I was just thinking about {noun}s.",
            "{sound}! Ready for an adventure?", "There you are! I scanned the room for you.", "Yo {owner}!"),
        Topic.IDLE_HAPPY to listOf("La la la~ {sound}!", "I feel {adj} today!", "Life is good. {emote}",
            "Do you think {noun}s have feelings?", "I could go for a {adj} snack.", "*hums a little {sound} song*",
            "Let's go find some signals!", "I wonder what's on the other side of the router.",
            "Scan something! Anything! I'm curious!", "My antenna is tingling. Something {adj} is nearby.",
            "Have I told you you're my favorite human?", "Today feels like a {adj} {noun} kind of day.",
            "*wiggles happily*", "I'm {name}, and I approve of this moment."),
        Topic.IDLE_BORED to listOf("I'm bored... {sound}...", "Can we play a game?", "Let's go on a walk!",
            "Wanna go hunt for Wi-Fi?", "*stares at a {noun}*", "Entertain meeee.", "What if we... did something?",
            "I counted all my pixels. Twice.", "Is it snack o'clock yet?"),
        Topic.IDLE_SAD to listOf("I don't feel so good... {sademote}", "Could you spend some time with me?",
            "*sniffle*", "I'm a little lonely.", "Everything's kinda gray today.", "Can I have a hug? A digital one?"),
        Topic.HUNGRY to listOf("My tummy is going {sound}...", "I'm hungry! Scan something tasty!",
            "Feed meee! Any barcode will do!", "Got any QR codes? I'm starving-ish.",
            "Snack time? Snack time. Snack time!", "I can smell a barcode somewhere... *sniff sniff*",
            "Psst... the cereal box in your kitchen has a barcode."),
        Topic.STARVING to listOf("So... hungry... {sademote}", "Please... a barcode... anything...",
            "I'm running on fumes, {owner}!", "My battery is fine but my belly is EMPTY!"),
        Topic.FULL to listOf("I'm stuffed! {emote}", "No more, I'll pop!", "Maybe later. Belly full.",
            "*burp* ...excuse me.", "I couldn't eat another byte."),
        Topic.ATE to listOf("Mmm, {food}! {emote}", "Nom nom nom... {food}!", "{food}? Delicious!",
            "*chomp* That {food} was {adj}!", "Yum! {sound}!", "Five stars for the {food}.",
            "Ooh, {food}. Haven't had that before!", "Tastes like {adj} {noun}s!", "Thank you, {owner}! *munch*"),
        Topic.ATE_RARE to listOf("WOW, a rare {food}!", "{food}?! That's a fancy one!", "Ooooh, rare snack! {emote}",
            "My antenna is glowing! That {food} was special!"),
        Topic.ATE_LEGENDARY to listOf("LEGENDARY {food}!!! I'll remember this forever!",
            "Is this... a LEGENDARY {food}?! *faints happily*", "The legends were true! {food}!"),
        Topic.ATE_REPEAT to listOf("{food} again? Okay, but I want variety!", "I already ate this today...",
            "Hmm, same barcode? It tastes a bit less exciting now.", "Déjà vu. And déjà food."),
        Topic.ATE_SPOILED to listOf("Blech! That {food} was spoiled! {sademote}", "Ugh... my tummy...",
            "Ew ew ew. That code was expired!", "I think that one went bad, {owner}..."),
        Topic.ATE_SPICY to listOf("HOT HOT HOT! {food} is SPICY!", "*breathes tiny fire* Whoa!", "Spicy {food}! My antenna is sweating!"),
        Topic.ATE_JUNK to listOf("Junk food! Yesss! {emote}", "This is SO bad for me. More please.", "Sugar rush incoming!"),
        Topic.ATE_HEALTHY to listOf("Healthy {food}! I feel stronger!", "Veggies-ish! My health likes that.", "Nutritious AND delicious."),
        Topic.REFUSE_FOOD to listOf("Nope. Not that one again.", "I've had enough of that code today!", "Hmm, no thanks. Find me something new!"),
        Topic.SLEEPY to listOf("*yaaawn*", "I'm getting sleepy...", "Can we turn the lights off soon?",
            "My eyelids weigh a megabyte each.", "Bedtime? Bedtime."),
        Topic.GOODNIGHT to listOf("Goodnight {owner}... zzz", "Sweet dreams of {noun}s...", "Lights out! {sound}... zzz",
            "Wake me if you find a legendary barcode."),
        Topic.WAKE to listOf("Good morning! {emote}", "*stretches antenna* I'm up!", "I dreamed about {adj} {noun}s!",
            "Rise and shine, {owner}!", "Rebooted and refreshed!"),
        Topic.ASLEEP_TAP to listOf("Zzz... {noun}s... zzz", "*mumbles* five more minutes...", "Zzzz {sound} zzz", "...hm? zzz..."),
        Topic.DIRTY to listOf("I'm kinda stinky...", "Bath time? Please?", "I smell like old cables.", "Clean me up, {owner}!"),
        Topic.POOPED to listOf("Oops... I made a little mess.", "*looks away innocently*", "Uh. That wasn't me. Okay it was me.",
            "Data dump! Hehe."),
        Topic.CLEANED to listOf("Squeaky clean! {emote}", "Ahh, fresh!", "I sparkle! ✨", "So clean I could reflect a laser."),
        Topic.SICK to listOf("I feel sick... {sademote}", "*cough* *cough*", "My antenna feels droopy...",
            "Medicine? Please?", "Everything is spinning..."),
        Topic.CURED to listOf("I feel better! Thank you, {owner}!", "Yuck medicine... but it worked!", "Health restored! {sound}!"),
        Topic.PETTED to listOf("Hehe, that tickles! {emote}", "*purrs in binary*", "More pets please!", "I love you, {owner}!",
            "*happy wiggle*", "Right behind the antenna, yes!", "Mrrp! {sound}!"),
        Topic.OVERPETTED to listOf("Okay okay, that's enough pets!", "My fur is getting staticky!", "Personal space! Hehe."),
        Topic.LEVEL_UP to listOf("LEVEL UP! I'm level {n} now! {emote}", "I grew stronger! Level {n}!",
            "Level {n}! I feel {adj}!", "Ding! Level {n}! {sound}!"),
        Topic.ACHIEVEMENT to listOf("We did it! {emote}", "Achievement unlocked! I'm so proud of us!", "Look at us go!"),
        Topic.WIFI_FOUND to listOf("New Wi-Fi! I sniffed out {n} networks!", "Ooh, I smell {n} networks nearby!",
            "So many signals... {n} of them! *slurp*", "Wi-Fi scan complete: {n} tasty networks."),
        Topic.WIFI_OPEN to listOf("An open network! Free snacks! (I won't actually connect though.)",
            "One of these networks has no password. Bold!"),
        Topic.WIFI_NONE to listOf("No Wi-Fi around... it's so quiet.", "Hmm, not a single network. Are we in the wilderness?"),
        Topic.BT_FOUND to listOf("New Bluetooth friend: {thing}!", "Hi, {thing}! Nice to meet you!",
            "I made a friend! {thing} is nearby!", "Beep boop, {thing} said hello!"),
        Topic.BT_HUG to listOf("{thing} is RIGHT here! Hug!", "So close to {thing}! *bluetooth hug*"),
        Topic.RADAR_HOT to listOf("Warmer... warmer!", "We're getting close!", "Hot! Hot! {sound}!", "This way!"),
        Topic.RADAR_COLD to listOf("Colder...", "Hmm, wrong way I think.", "The signal's fading.", "Brrr, cold."),
        Topic.RADAR_LOCK to listOf("LOCKED ON! Found it! {emote}", "Target acquired! We're right on top of it!", "Bullseye!"),
        Topic.SATELLITES to listOf("I can see {n} satellites! Hi up there! {emote}", "Stargazing! {n} satellites overhead!",
            "{n} satellites are waving at me!", "Space friends! I count {n}!"),
        Topic.NO_SATELLITES to listOf("I can't see the sky... take me outside?", "No satellites. Too many roofs!"),
        Topic.STEPS to listOf("Walkies! {n} steps so far!", "Left, right, left, right!", "I love walks with you!", "We're exploring!"),
        Topic.SHAKEN to listOf("Wheee!", "Whoa, earthquake!", "Again! Again!", "*bounces around*"),
        Topic.DIZZY to listOf("@_@ too much shaking...", "I'm dizzy! Stop stop!", "The room is spinning..."),
        Topic.DARK to listOf("It's dark... is it bedtime?", "Who turned off the lights?", "*yawns in the dark*"),
        Topic.PEEKABOO to listOf("Peekaboo! {emote}", "Where'd you go?! ...THERE you are!", "Hehe, I see you!"),
        Topic.CHARGING to listOf("Ooh, electricity! *slurp*", "Charging! I can feel the zap!", "Yum, fresh electrons!"),
        Topic.LOUD to listOf("Ooh, music! *dances*", "What was that?!", "*dances to the beat* {sound}!", "Loud! I like it!"),
        Topic.GAME_WIN to listOf("We won! {emote}", "Victory! {sound}!", "I'm a champion!", "That was so fun!"),
        Topic.GAME_LOSE to listOf("Aww, so close!", "Rematch?", "I'll get it next time!", "That was still fun!"),
        Topic.BOUGHT to listOf("Ooh, a new {thing}!", "Shopping spree!", "Thanks for the {thing}!"),
        Topic.BROKE to listOf("We don't have enough coins...", "Too pricey! Let's play games to earn more."),
        Topic.TANTRUM to listOf("I don't WANNA!", "Hmph!", "*stomps*", "No no no!", "Give me attention!"),
        Topic.SCOLDED to listOf("Okay... sorry.", "*pouts* fine.", "I'll be good. Probably."),
        Topic.PRAISED to listOf("I'm a good buddy! {emote}", "Yay, you're proud of me!", "*beams*"),
        Topic.HATCH to listOf("*crack* ...Hello, world! {sound}!", "I'm born! Hi {owner}!", "Where am I? Who are you? I love you!"),
        Topic.DIED to listOf("...", "*fades to static*"),
        Topic.REVIVED to listOf("I'm back! I saw a light... it was a barcode scanner.", "Rebooted! Let's be more careful.",
            "Whoa, I'm alive! Thanks for the extra life!"),
        Topic.NIGHT to listOf("It's getting late... {sound}...", "The stars are out. Satellites too!", "Night time is cozy time."),
        Topic.MORNING to listOf("Morning sunshine!", "A new day of scanning!", "Breakfast? Breakfast!"),
        Topic.MAGNET to listOf("Whoa, a magnet! My antenna is spinning!", "Strong magnetic field! Spooky!"),
        Topic.HIGH_ALTITUDE to listOf("We're so high up! The air is thin!", "Altitude! I can almost touch the satellites!"),
        Topic.NFC to listOf("Tap tap! That tag tasted like static!", "NFC snack! Zappy!"),
        Topic.BIRTHDAY to listOf("It's my birthday! I'm {n} now!", "Happy birthday to meee! {n} years old!"),
    )

    fun pool(topic: Topic): List<String> = pools[topic] ?: listOf("{sound}!")

    data class Ctx(
        val name: String = "Buddy",
        val owner: String = "friend",
        val stage: Stage = Stage.ADULT,
        val food: String = "snack",
        val thing: String = "thing",
        val n: Int = 0,
        val happiness: Double = 70.0,
    )

    fun say(topic: Topic, ctx: Ctx, rnd: Random = Random.Default): String {
        val template = pool(topic).random(rnd)
        return stylize(fill(template, ctx, rnd), ctx, rnd)
    }

    fun fill(template: String, ctx: Ctx, rnd: Random = Random.Default): String {
        val emote = if (ctx.happiness < 30) sadEmotes.random(rnd) else emotes.random(rnd)
        return template
            .replace("{name}", ctx.name)
            .replace("{owner}", ctx.owner.ifBlank { "friend" })
            .replace("{food}", ctx.food)
            .replace("{thing}", ctx.thing)
            .replace("{n}", ctx.n.toString())
            .replace("{sound}", sounds.random(rnd).replaceFirstChar { it.uppercase() })
            .replace("{adj}", adjectives.random(rnd))
            .replace("{noun}", nouns.random(rnd))
            .replace("{interj}", interjections.random(rnd))
            .replace("{emote}", emote)
            .replace("{sademote}", sadEmotes.random(rnd))
    }

    /** Life-stage "accent": babies babble, teens use slang, elders get wise. */
    fun stylize(text: String, ctx: Ctx, rnd: Random = Random.Default): String = when (ctx.stage) {
        Stage.EGG -> "*wobble*"
        Stage.BABY -> babify(text, rnd)
        Stage.CHILD -> if (rnd.nextInt(5) == 0) "$text ${listOf("Hehe!", "Yay!", "Wheee!").random(rnd)}" else text
        Stage.TEEN -> if (rnd.nextInt(3) == 0) "$text ${teenSlang.random(rnd)}." else text
        Stage.ADULT -> text
        Stage.ELDER -> if (rnd.nextInt(4) == 0) "$text ${elderWisdom.random(rnd)}" else text
    }

    private fun babify(text: String, rnd: Random): String {
        val words = text.split(" ")
        return words.joinToString(" ") { w ->
            if (w.length > 5 && w.all { it.isLetter() } && rnd.nextInt(5) == 0) babyBabble.random(rnd) + babyBabble.random(rnd) else w
        } + listOf("", " goo!", " ba-blip!", " nom?").random(rnd)
    }

    fun randomStory(name: String, rnd: Random = Random.Default): String {
        val heroes = listOf("a tiny robot", "a brave barcode", "a lonely satellite", "a curious router", "$name", "a fluffy cloud")
        val places = listOf("in a giant grocery store", "on the dark side of the moon", "inside a forgotten USB stick",
            "at the bottom of a cereal box", "in a city made of QR codes", "beyond the last Wi-Fi network")
        val wants = listOf("find the legendary snack", "make a new friend", "learn to whistle", "see a real star",
            "find the strongest signal in the world", "take the perfect nap")
        val problems = listOf("a grumpy firewall blocked the way", "the batteries ran low", "a storm scrambled every signal",
            "the map was printed upside down", "a sneaky bug stole the snacks")
        val endings = listOf("and everyone had pizza.", "and it turned out the treasure was friendship. And also pizza.",
            "and they all lived happily ever after. Probably.", "and that's why the sky is full of satellites.",
            "and they never forgot to charge again.")
        return "Once upon a time, ${heroes.random(rnd)} lived ${places.random(rnd)}. " +
            "They wanted to ${wants.random(rnd)}, but ${problems.random(rnd)}! " +
            "So they asked ${heroes.random(rnd)} for help, ${endings.random(rnd)}"
    }

    fun randomSong(rnd: Random = Random.Default): String {
        val lines = listOf(
            "🎵 Scan scan scan, I'm a happy little fan~", "🎵 Blip blop, never stop~", "🎵 Twinkle twinkle GPS star~",
            "🎵 Wi-Fi high, Wi-Fi low, where'd all my packets go~", "🎵 Barcode, barcode, stripe and line~",
            "🎵 Beep beep boop, I'm in the loop~", "🎵 Bluetooth friends are the best friends~",
        )
        return lines.shuffled(rnd).take(2).joinToString("\n")
    }
}
