// Copy this file to config.h (same folder) and fill in your values.
// config.h is git-ignored so your Wi-Fi password never gets pushed.
#pragma once

// ---- Wi-Fi ----------------------------------------------------------------
// Leave WIFI_SSID empty and the ESP32 starts its own hotspot instead
// (SSID "PresenceRadar", password below, dashboard at http://192.168.4.1).
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define AP_PASSWORD "radar1234"  // hotspot password, min 8 chars
#define HOSTNAME "presence"      // dashboard at http://presence.local

// ---- Wiring (ESP32 DevKit, UART2) -----------------------------------------
#define RADAR_RX_PIN 16  // ESP32 RX2  <- radar TX
#define RADAR_TX_PIN 17  // ESP32 TX2  -> radar RX
#define RADAR_OUT_PIN 4  // radar OUT (optional, digital presence line); -1 to disable
#define STATUS_LED_PIN 2 // on-board blue LED lights while someone is present; -1 to disable

// ---- Detection tuning -----------------------------------------------------
// Each gate is 0.75 m. 8 gates ~= 6 m, 4 gates ~= 3 m (good for a desk/room corner).
#define MAX_MOVING_GATE 8
#define MAX_STATIONARY_GATE 8
// Seconds the radar keeps saying "present" after the person goes completely still/leaves.
#define RADAR_HOLD_SECONDS 5
// Write the gate/hold settings above into the radar at boot.
#define APPLY_RADAR_CONFIG 1

// ---- Optional webhook -----------------------------------------------------
// When presence changes, the ESP32 POSTs JSON {"present":true,...} here.
// Works with Home Assistant webhooks, Node-RED, n8n, ntfy, etc. Empty = off.
#define WEBHOOK_URL ""

// ---- Clock (for event timestamps) -----------------------------------------
// POSIX TZ string. US Eastern: "EST5EDT,M3.2.0,M11.1.0"; Central: "CST6CDT,M3.2.0,M11.1.0";
// Mountain: "MST7MDT,M3.2.0,M11.1.0"; Pacific: "PST8PDT,M3.2.0,M11.1.0"
#define TIMEZONE "EST5EDT,M3.2.0,M11.1.0"
