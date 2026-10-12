# Blipling 📡🐣

A pocket buddy for Android that you feed by **scanning things**: barcodes, QR codes, shipping labels, boarding passes and NFC tags. It sniffs **Wi-Fi** and **Bluetooth** with a pulsing, vibrating **radar**, stargazes at **GPS satellites**, counts your **steps**, dances to **music**, gets sleepy in the **dark**, and talks back with an old-school, rule-based **phrase brain**. No AI service and no account. Everything runs on the phone.

## Features

**Life sim (tamagotchi-style)**
- Name, sex (boy, girl or mystery), age (1 real day = 1 buddy year) and life stages: Egg → Baby → Child → Teen → Adult → Elder
- Vitals: fullness, happiness, energy, hygiene, health. Traits: fitness, smarts, social, discipline. Also weight.
- Each egg rolls a unique color, pattern (plain, spots, stripes or stars) and personality (Curious, Foodie, Social, Sleepy, Sporty or Nerdy). Personality changes how the buddy's stats drift.
- Poop, sickness, medicine, baths, sleep and wake, tantrums (scold or praise), night-time auto-sleep
- **Lives:** 3 to start, up to 5. You earn one every 10 levels or buy one. Neglect costs a life, and losing all of them ends the run. Achievements, coins and items carry over to the next generation, and a Hall of Memories lists past buddies.
- Being away from the app for less than 48 hours can't kill your buddy.
- Levels, XP and coins

**Feeding by scanning** (CameraX + ML Kit, works offline)
- Every code always produces the same food, generated from the code's contents: name, family, rarity (Common to Legendary) and a trait (Healthy, Junk, Spicy, Caffeinated, Spoiled and others).
- Grocery barcodes can look up the real product name and Nutri-Score from Open Food Facts. You can turn this off.
- QR content changes the flavor: links, Wi-Fi, contacts, map and text codes each taste different.
- Shipping labels, tickets and boarding passes, and **NFC tags** each count as their own food type.
- Eating the same code repeatedly gives less each time. A third helping in a day gets refused.

**Radar and sensors**
- Bluetooth LE plus classic discovery, and Wi-Fi scanning
- **Directional radar:** turn in a circle and the buddy learns which compass heading has the strongest signal (your body blocks part of it). It then shows a bearing arrow, an uncertainty wedge and an estimated distance. The ping and vibration speed up as you get closer and get stronger when you face the signal.
- GNSS sky view: GPS, GLONASS, Galileo, BeiDou, QZSS, SBAS and NavIC satellites plotted by azimuth and elevation
- Step counter, shake detection, light sensor (gets sleepy in the dark), proximity sensor (peekaboo), barometer and altitude, magnetometer (magnet detector), battery and charging, microphone (dance party)
- Haptics and beeps everywhere

**Talking**
- ELIZA-style chat: keyword rules, pronoun reflection, memory (your name, likes, favorites, notes) and mood-aware replies
- A large randomized phrase library. Babies babble, teens use slang and elders hand out wisdom.
- Jokes, riddles, stories, songs, fortunes, fun facts, guess-the-number, rock-paper-scissors, dice, coin flips and simple math

**More**
- 4 mini-games: Byte Catcher (tilt), Signal Simon, Quick Blip (reflexes), Code Match
- Shop: consumables, 9 hats and accessories, 6 paint jobs including animated Prism Paint
- 60+ achievements, journal, lifetime stats, Bluetooth friend list
- Care reminder notifications every 30 minutes via WorkManager

## Install

Grab `Blipling-x.y.z.apk` from **Releases**, open it on your phone and allow "install unknown apps". When asked, grant the permissions. Each one is explained in More → Settings.

## Build

```bash
./gradlew assembleRelease     # app/build/outputs/apk/release/app-release.apk
./gradlew testDebugUnitTest   # game-rule tests
```

Requires JDK 17+ and the Android SDK (compileSdk 35). Pushing a tag like `v1.0.0` makes GitHub Actions build a signed APK and attach it to a GitHub Release.

**Signing:** CI uses the secrets `BLIPLING_KEYSTORE` (path), `BLIPLING_KEYSTORE_PASSWORD`, `BLIPLING_KEY_ALIAS` and `BLIPLING_KEY_PASSWORD` when they are set. Otherwise it falls back to the bundled hobby keystore `app/blipling-release.jks` (password `blipling`), so every build can update the last one. That key is public, so swap in your own before sharing the app widely.

## Code map

| Path | What |
|---|---|
| `core/` | Pure Kotlin game rules (unit-tested): `Engine`, `Food`, `Phrases`, `Chat`, `Achievements`, `Items`, `RadarTracker`, `Codec` |
| `data/GameRepository` | Single source of truth and save file (SharedPreferences JSON) |
| `sensors/` | Wi-Fi, Bluetooth, GNSS, motion/light/proximity/pressure/magnet/steps, mic, haptics, NFC feeding |
| `ui/` | Jetpack Compose screens and the hand-drawn vector buddy (`BuddyView`) |
| `work/CareWorker` | Background reminders |
