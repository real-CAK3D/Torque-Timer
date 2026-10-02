# Presence Radar (HLK-LD2410 + ESP32)

A human presence detector that also sees people who are sitting still. The ESP32 reads the
LD2410 24 GHz radar over UART and serves a live dashboard on your Wi-Fi. The dashboard shows
whether someone is present, how far away they are, whether they're moving or still, and a log
of arrivals and departures. The ESP32's blue LED lights while someone is detected, and an
optional webhook fires when someone arrives or leaves.

## Wiring

The cable has a small **1.25 mm plug** on one end and **2.54 mm Dupont sockets** on the other.

- The small plug goes into the radar's 5-pin socket. It's keyed, so it only fits one way. Don't force it.
- The Dupont ends go onto the ESP32's header pins as shown below.

**Read the labels printed on the radar board next to each pin.** Cable wire colors aren't
standard, so follow each wire from its pin on the radar to its Dupont end.

| LD2410 pin (silkscreen) | ESP32 DevKit pin | Notes |
|---|---|---|
| **VCC** | **VIN** (also labeled **5V**) | Needs **5 V**. 3.3 V gives unreliable readings. |
| **GND** | **GND** | |
| **TX** (UART_Tx) | **GPIO16** (RX2) | TX always goes to RX |
| **RX** (UART_Rx) | **GPIO17** (TX2) | RX always goes to TX |
| **OUT** | **GPIO4** | Optional. High while a person is detected. |

```
   LD2410                ESP32 DevKit
  ┌────────┐            ┌──────────────┐
  │ VCC  ──┼────────────┼── VIN / 5V   │
  │ GND  ──┼────────────┼── GND        │
  │ TX   ──┼────────────┼── GPIO16 RX2 │
  │ RX   ──┼────────────┼── GPIO17 TX2 │
  │ OUT  ──┼────────────┼── GPIO4      │
  └────────┘            └──────────────┘
```

The radar's TX/RX/OUT pins run at 3.3 V, so they connect straight to the ESP32 without a level
shifter.

**Placement:** point the flat antenna side (the side with the gold patch traces) toward the
room. Mount it about 1–1.5 m high, away from fans, curtains, and the back of a running monitor,
because moving objects cause false detections. It detects through thin plastic but not through
metal.

## Software setup

1. Install [VS Code](https://code.visualstudio.com/) and its **PlatformIO IDE** extension.
2. Open this `presence-radar` folder in VS Code.
3. Copy `include/config.example.h` to `include/config.h` and set `WIFI_SSID` and
   `WIFI_PASSWORD`. Use 2.4 GHz Wi-Fi, because the ESP32 can't connect to 5 GHz.
4. Plug in the ESP32 and click **PlatformIO: Upload** (the → arrow in the bottom bar).
   If it gets stuck on `Connecting....___`, hold the board's **BOOT** button until the upload starts.
5. Click **Serial Monitor** (the plug icon). You'll see the dashboard address, and then one line
   per second like this:
   ```
   target=stationary        moving=  0cm/  0%  still= 85cm/ 62%  OUT=1
   ```
6. Open `http://presence.local` or the IP address it printed, on a phone or PC on the same Wi-Fi.

If you skip step 3, or Wi-Fi fails, the ESP32 starts its own hotspot called **PresenceRadar**
(password `radar1234`). The dashboard is then at `http://192.168.4.1`.

## Tuning (in `config.h`)

- `MAX_MOVING_GATE` / `MAX_STATIONARY_GATE` set the range. Each gate is 0.75 m, so `4` ≈ 3 m and
  `8` ≈ 6 m. Lower them if it detects people in the next room.
- `RADAR_HOLD_SECONDS` sets how long it keeps saying "present" after the person stops being
  detected.
- `WEBHOOK_URL` sets an address that gets a JSON POST on every change, for example a Home
  Assistant webhook, Node-RED, or n8n:
  `{"present":true,"target":"stationary","distance_cm":85,"device":"presence"}`

For finer per-gate sensitivity, use Hi-Link's **HLKRadarTool** phone app over the radar's
Bluetooth.

## Troubleshooting

**Windows says "USB device not recognized / malfunctioned" when plugging in the ESP32**
1. **Unplug the radar from the ESP32 first**, then plug in only the bare ESP32. If the error goes
   away, check the radar wiring. VCC and GND swapped, or 5 V touching a GPIO pin, can make the
   board brown out or get damaged.
2. **Try a different USB cable.** Many cables are charge-only or flaky. Use one you know transfers
   data, such as a phone sync cable.
3. Plug directly into the PC, not a hub or front-panel port. Try a different port.
4. **Install the USB-serial driver.** Look at the small chip next to the board's USB connector:
   - **CP2102 / CP2104** (square, "SILABS"): install the *CP210x Universal Windows Driver* from Silicon Labs.
   - **CH340 / CH9102** (rectangular, "WCH"): install the *CH341SER* driver from WCH.

   Then unplug the board, plug it back in, and check **Device Manager → Ports (COM & LPT)** for a
   new COM port.
5. Make sure nothing metal under the board, such as a screwdriver or foil, is shorting its pins.

**Serial monitor says "No data from radar"**: TX and RX are probably swapped. Swap the GPIO16 and
GPIO17 wires. Also check that VCC is on 5 V, not 3.3 V.

**Always "Person detected" with nobody there**: aim the radar away from fans, AC vents, and
swaying objects, or lower the gate counts.
