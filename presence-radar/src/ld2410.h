// Minimal, dependency-free driver for the Hi-Link HLK-LD2410 24 GHz presence radar.
//
// The module streams "report" frames at 256000 baud, ~10 per second:
//   F4 F3 F2 F1 | len(2, LE) | payload | F8 F7 F6 F5
// Basic-mode payload:
//   0x02 0xAA state movDist(2) movEnergy(1) statDist(2) statEnergy(1) detDist(2) 0x55 0x00
// (engineering mode is type 0x01 and appends per-gate energies; the leading fields are identical)
//
// Commands go the other way in frames headed FD FC FB FA and tailed 04 03 02 01.
#pragma once
#include <Arduino.h>

namespace ld2410_detail {
static const uint8_t HDR[4] = {0xF4, 0xF3, 0xF2, 0xF1};
static const uint8_t TAIL[4] = {0xF8, 0xF7, 0xF6, 0xF5};
}  // namespace ld2410_detail

class LD2410 {
 public:
  enum Target : uint8_t { NONE = 0, MOVING = 1, STATIONARY = 2, BOTH = 3 };

  struct Reading {
    uint8_t target = NONE;
    uint16_t movingCm = 0;
    uint8_t movingEnergy = 0;      // 0-100
    uint16_t stationaryCm = 0;
    uint8_t stationaryEnergy = 0;  // 0-100
    uint16_t detectionCm = 0;
  };

  void begin(HardwareSerial& port, int rxPin, int txPin, uint32_t baud = 256000) {
    port_ = &port;
    port_->begin(baud, SERIAL_8N1, rxPin, txPin);
  }

  // Call often from loop(). Returns true when a new reading was decoded.
  bool poll() {
    bool got = false;
    while (port_ && port_->available()) {
      if (feed((uint8_t)port_->read())) got = true;
    }
    return got;
  }

  const Reading& reading() const { return reading_; }
  uint32_t lastFrameMs() const { return lastFrameMs_; }
  uint32_t frameCount() const { return frames_; }
  uint32_t badFrames() const { return bad_; }
  bool alive(uint32_t timeoutMs = 1500) const {
    return frames_ > 0 && millis() - lastFrameMs_ < timeoutMs;
  }

  // maxMovingGate / maxStationaryGate: 2..8, each gate is 0.75 m (8 => ~6 m).
  // holdSeconds: how long the radar keeps reporting "present" after the target goes quiet.
  void configure(uint8_t maxMovingGate, uint8_t maxStationaryGate, uint16_t holdSeconds) {
    const uint8_t enable[] = {0xFF, 0x00, 0x01, 0x00};
    const uint8_t params[] = {
        0x60, 0x00,
        0x00, 0x00, maxMovingGate, 0x00, 0x00, 0x00,
        0x01, 0x00, maxStationaryGate, 0x00, 0x00, 0x00,
        0x02, 0x00, (uint8_t)(holdSeconds & 0xFF), (uint8_t)(holdSeconds >> 8), 0x00, 0x00,
    };
    const uint8_t endCfg[] = {0xFE, 0x00};
    sendCommand(enable, sizeof(enable));
    delay(100);
    sendCommand(params, sizeof(params));
    delay(100);
    sendCommand(endCfg, sizeof(endCfg));
    delay(100);
  }

 private:
  void sendCommand(const uint8_t* body, uint16_t n) {
    const uint8_t head[] = {0xFD, 0xFC, 0xFB, 0xFA, (uint8_t)(n & 0xFF), (uint8_t)(n >> 8)};
    const uint8_t tail[] = {0x04, 0x03, 0x02, 0x01};
    port_->write(head, sizeof(head));
    port_->write(body, n);
    port_->write(tail, sizeof(tail));
    port_->flush();
  }

  bool feed(uint8_t b) {
    // Hunt for the 4-byte header, resyncing on any mismatch.
    if (len_ < 4) {
      if (b == ld2410_detail::HDR[len_]) {
        buf_[len_++] = b;
      } else {
        len_ = (b == ld2410_detail::HDR[0]) ? 1 : 0;
        if (len_) buf_[0] = b;
      }
      return false;
    }
    buf_[len_++] = b;
    if (len_ < 6) return false;

    const uint16_t payloadLen = buf_[4] | (buf_[5] << 8);
    const size_t total = 6 + payloadLen + 4;
    if (payloadLen < 11 || total > sizeof(buf_)) {  // garbage length, start over
      bad_++;
      len_ = 0;
      return false;
    }
    if (len_ < total) return false;

    len_ = 0;
    if (memcmp(buf_ + total - 4, ld2410_detail::TAIL, 4) != 0) {
      bad_++;
      return false;
    }
    const uint8_t* p = buf_ + 6;
    if ((p[0] != 0x01 && p[0] != 0x02) || p[1] != 0xAA) {
      bad_++;
      return false;
    }
    reading_.target = p[2] & 0x03;
    reading_.movingCm = p[3] | (p[4] << 8);
    reading_.movingEnergy = p[5];
    reading_.stationaryCm = p[6] | (p[7] << 8);
    reading_.stationaryEnergy = p[8];
    reading_.detectionCm = p[9] | (p[10] << 8);
    lastFrameMs_ = millis();
    frames_++;
    return true;
  }

  HardwareSerial* port_ = nullptr;
  uint8_t buf_[64];
  size_t len_ = 0;
  Reading reading_;
  uint32_t lastFrameMs_ = 0;
  uint32_t frames_ = 0;
  uint32_t bad_ = 0;
};
