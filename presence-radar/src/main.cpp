// Human presence radar: HLK-LD2410 + ESP32 DevKit.
// Serves a live dashboard over Wi-Fi, logs presence changes, lights the on-board LED,
// and (optionally) fires a webhook whenever someone arrives or leaves.
#include <Arduino.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <WiFi.h>
#include <time.h>

#if __has_include("config.h")
#include "config.h"
#else
#warning "include/config.h not found - using config.example.h (hotspot mode). Copy it to config.h to set Wi-Fi."
#include "config.example.h"
#endif

#include "dashboard.h"
#include "ld2410.h"

static LD2410 radar;
static WebServer server(80);

struct Event {
  uint32_t ms;     // millis() when it happened
  time_t epoch;    // wall-clock time, 0 if NTP not synced yet
  bool present;
  uint16_t distanceCm;
};
static const size_t MAX_EVENTS = 30;
static Event events[MAX_EVENTS];
static size_t eventCount = 0;  // total ever logged; newest at (eventCount-1) % MAX_EVENTS

static bool present = false;
static uint32_t presentSinceMs = 0;
static uint32_t presentTodayMs = 0;  // accumulated presence time since boot
static bool apMode = false;
static bool webhookPending = false;

static const char* targetName(uint8_t t) {
  switch (t) {
    case LD2410::MOVING: return "moving";
    case LD2410::STATIONARY: return "stationary";
    case LD2410::BOTH: return "moving+stationary";
    default: return "none";
  }
}

static bool outPinHigh() {
#if RADAR_OUT_PIN >= 0
  return digitalRead(RADAR_OUT_PIN) == HIGH;
#else
  return false;
#endif
}

static time_t nowEpoch() {
  time_t t = time(nullptr);
  return t > 1700000000 ? t : 0;  // anything earlier means NTP hasn't synced
}

static void logEvent(bool isPresent, uint16_t distanceCm) {
  events[eventCount % MAX_EVENTS] = {millis(), nowEpoch(), isPresent, distanceCm};
  eventCount++;
}

static uint32_t totalPresentMs() {
  return presentTodayMs + (present ? millis() - presentSinceMs : 0);
}

static void sendWebhook() {
  webhookPending = false;
  if (apMode || strlen(WEBHOOK_URL) == 0 || WiFi.status() != WL_CONNECTED) return;
  const LD2410::Reading& r = radar.reading();
  char body[160];
  snprintf(body, sizeof(body),
           "{\"present\":%s,\"target\":\"%s\",\"distance_cm\":%u,\"device\":\"%s\"}",
           present ? "true" : "false", targetName(r.target), r.detectionCm, HOSTNAME);
  HTTPClient http;
  http.setTimeout(2000);
  if (http.begin(WEBHOOK_URL)) {
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(body);
    Serial.printf("[webhook] POST -> %d\n", code);
    http.end();
  }
}

static void handleState() {
  const LD2410::Reading& r = radar.reading();
  const uint32_t now = millis();
  String j;
  j.reserve(1400);
  j += "{\"present\":";
  j += present ? "true" : "false";
  j += ",\"radarOnline\":";
  j += radar.alive() ? "true" : "false";
  j += ",\"outPin\":";
  j += outPinHigh() ? "true" : "false";
  j += ",\"target\":\"";
  j += targetName(r.target);
  j += "\",\"movingCm\":" + String(r.movingCm);
  j += ",\"movingEnergy\":" + String(r.movingEnergy);
  j += ",\"stationaryCm\":" + String(r.stationaryCm);
  j += ",\"stationaryEnergy\":" + String(r.stationaryEnergy);
  j += ",\"detectionCm\":" + String(r.detectionCm);
  j += ",\"maxRangeCm\":" + String(max(MAX_MOVING_GATE, MAX_STATIONARY_GATE) * 75);
  j += ",\"stateForMs\":" + String(present ? now - presentSinceMs : (eventCount ? now - events[(eventCount - 1) % MAX_EVENTS].ms : now));
  j += ",\"totalPresentMs\":" + String(totalPresentMs());
  j += ",\"uptimeMs\":" + String(now);
  j += ",\"frames\":" + String(radar.frameCount());
  j += ",\"badFrames\":" + String(radar.badFrames());
  j += ",\"rssi\":" + String(apMode ? 0 : WiFi.RSSI());
  j += ",\"events\":[";
  const size_t n = min(eventCount, MAX_EVENTS);
  for (size_t i = 0; i < n; i++) {
    const Event& e = events[(eventCount - 1 - i) % MAX_EVENTS];  // newest first
    if (i) j += ",";
    j += "{\"agoMs\":" + String(now - e.ms) + ",\"epoch\":" + String((uint32_t)e.epoch) +
         ",\"present\":" + (e.present ? "true" : "false") + ",\"cm\":" + String(e.distanceCm) + "}";
  }
  j += "]}";
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", j);
}

static void startWifi() {
  WiFi.setHostname(HOSTNAME);
  if (strlen(WIFI_SSID) > 0) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.printf("Connecting to Wi-Fi \"%s\"", WIFI_SSID);
    const uint32_t start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
      delay(400);
      Serial.print('.');
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
      WiFi.setAutoReconnect(true);
      Serial.printf("Wi-Fi OK. Dashboard: http://%s/  or  http://%s.local/\n",
                    WiFi.localIP().toString().c_str(), HOSTNAME);
      configTzTime(TIMEZONE, "pool.ntp.org", "time.nist.gov");
      return;
    }
    Serial.println("Wi-Fi failed - falling back to hotspot mode.");
  }
  apMode = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP("PresenceRadar", AP_PASSWORD);
  Serial.printf("Hotspot \"PresenceRadar\" (password %s). Dashboard: http://%s/\n", AP_PASSWORD,
                WiFi.softAPIP().toString().c_str());
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== LD2410 presence radar ===");

#if STATUS_LED_PIN >= 0
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);
#endif
#if RADAR_OUT_PIN >= 0
  pinMode(RADAR_OUT_PIN, INPUT_PULLDOWN);
#endif

  radar.begin(Serial2, RADAR_RX_PIN, RADAR_TX_PIN);
#if APPLY_RADAR_CONFIG
  delay(500);  // let the radar finish booting
  radar.configure(MAX_MOVING_GATE, MAX_STATIONARY_GATE, RADAR_HOLD_SECONDS);
  Serial.printf("Radar configured: moving gates %d, stationary gates %d, hold %ds\n",
                MAX_MOVING_GATE, MAX_STATIONARY_GATE, RADAR_HOLD_SECONDS);
#endif

  startWifi();
  if (MDNS.begin(HOSTNAME)) MDNS.addService("http", "tcp", 80);

  server.on("/", HTTP_GET, [] { server.send_P(200, "text/html", DASHBOARD_HTML); });
  server.on("/api/state", HTTP_GET, handleState);
  server.onNotFound([] { server.send(404, "text/plain", "not found"); });
  server.begin();
}

void loop() {
  radar.poll();
  server.handleClient();

  // Presence = radar is talking to us AND it reports a target.
  const bool nowPresent = radar.alive() && radar.reading().target != LD2410::NONE;
  if (nowPresent != present) {
    const uint32_t now = millis();
    if (present) presentTodayMs += now - presentSinceMs;
    present = nowPresent;
    if (present) presentSinceMs = now;
    logEvent(present, radar.reading().detectionCm);
    webhookPending = true;
#if STATUS_LED_PIN >= 0
    digitalWrite(STATUS_LED_PIN, present ? HIGH : LOW);
#endif
    Serial.printf("[%8lu ms] %s  (%s, %u cm)\n", (unsigned long)now,
                  present ? "PERSON DETECTED" : "area clear", targetName(radar.reading().target),
                  radar.reading().detectionCm);
  }
  if (webhookPending) sendWebhook();

  // Once-a-second status line so the serial monitor shows what the radar sees.
  static uint32_t lastPrint = 0;
  if (millis() - lastPrint >= 1000) {
    lastPrint = millis();
    if (!radar.alive()) {
      Serial.println("No data from radar - check wiring (radar TX -> GPIO16, RX -> GPIO17, VCC -> 5V).");
    } else {
      const LD2410::Reading& r = radar.reading();
      Serial.printf("target=%-17s moving=%3ucm/%3u%%  still=%3ucm/%3u%%  OUT=%d\n", targetName(r.target),
                    r.movingCm, r.movingEnergy, r.stationaryCm, r.stationaryEnergy, outPinHigh());
    }
  }
}
