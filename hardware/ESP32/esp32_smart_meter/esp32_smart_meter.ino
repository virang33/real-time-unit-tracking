/*
  =============================================================================
  GridOS ESP32 Smart Energy Meter & Real-Time Telemetry Bridge
  =============================================================================
  Features:
  1. Measures Voltage (V), Current (A), Power (W), Energy (kWh), Frequency (Hz), PF.
  2. Connects to local WiFi.
  3. Sends real-time telemetry JSON to GridOS Backend API via HTTP POST.
  4. Reads server relay commands (ON / OFF) to cut/restore load based on wallet balance.
  5. Supports PZEM-004T AC Energy Module OR analog/pulse sensing fallback.
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Install 'ArduinoJson' by Benoit Blanchon from Library Manager

// Optional: PZEM-004T v3.0 library
// #include <PZEM004Tv30.h>

// ==================== CONFIGURATION ====================
// 1. WiFi Credentials (e.g., Home Wi-Fi or Mobile Hotspot 2.4GHz)
const char* WIFI_SSID     = "YOUR_WIFI_OR_HOTSPOT_NAME";
const char* WIFI_PASSWORD = "YOUR_HOTSPOT_PASSWORD";

// 2. GridOS Backend Server URL (Configured for your local machine)
const char* SERVER_URL    = "http://10.227.16.238:11020/api/live-data";
const char* DEVICE_ID     = "ESP32-GRID-NODE-01";

// 3. Pin Definitions
#define RELAY_PIN       26   // GPIO connected to Relay module
#define STATUS_LED      2    // Built-in LED on most ESP32 Dev boards
#define PZEM_RX_PIN     16   // Connect to PZEM-004T TX
#define PZEM_TX_PIN     17   // Connect to PZEM-004T RX

// Send telemetry every 2 seconds
const unsigned long SEND_INTERVAL_MS = 2000;
unsigned long lastSendTime = 0;

// Uncomment below if using hardware PZEM-004T v3.0 module:
// PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F("   GridOS ESP32 Smart Unit Tracker      "));
  Serial.println(F("========================================"));

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Default: Relay closed (Power ON)
  digitalWrite(STATUS_LED, LOW);

  // Connect to WiFi
  connectWiFi();
}

void loop() {
  // Keep WiFi alive
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;
    readAndTransmitTelemetry();
  }
}

void connectWiFi() {
  // Speed up connection: disable Wi‑Fi sleep and enable auto‑reconnect
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);

  Serial.print(F("[WiFi] Connecting to: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Try longer (60 attempts) with a shorter delay (250 ms) → ~15 s total
  const int maxAttempts = 60;
  const int delayMs = 250;
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(delayMs);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println(F("[WiFi] Connected successfully!"));
    Serial.print(F("[WiFi] ESP32 IP Address: "));
    Serial.println(WiFi.localIP());
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.println(F("\n[WiFi] Connection timed out after ~15 s. Will retry on next loop."));
    digitalWrite(STATUS_LED, LOW);
  }
}

void readAndTransmitTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  // Sample values (replace with actual pzem.voltage(), pzem.current(), etc.)
  // If PZEM-004T is connected:
  /*
  float voltage     = pzem.voltage();
  float current     = pzem.current();
  float power       = pzem.power();
  float energy      = pzem.energy();
  float frequency   = pzem.frequency();
  float powerFactor = pzem.pf();
  */

  // Fallback demo/analog readings:
  float voltage     = 230.0 + (random(-15, 15) / 10.0); // e.g. 228.5V - 231.5V
  float current     = 0.85 + (random(-5, 5) / 100.0);   // e.g. 0.80A - 0.90A
  float power       = voltage * current;                // ~195 W
  static float accumulatedEnergy = 0.05;                // kWh
  accumulatedEnergy += (power * (SEND_INTERVAL_MS / 1000.0)) / 3600000.0;
  float frequency   = 50.0 + (random(-2, 2) / 10.0);
  float powerFactor = 0.95;

  // Build JSON Payload
  StaticJsonDocument<256> doc;
  doc["deviceId"]    = DEVICE_ID;
  doc["voltage"]     = serialized(String(voltage, 1));
  doc["current"]     = serialized(String(current, 2));
  doc["power"]       = serialized(String(power, 1));
  doc["energy"]      = serialized(String(accumulatedEnergy, 4));
  doc["frequency"]   = serialized(String(frequency, 1));
  doc["powerFactor"] = serialized(String(powerFactor, 2));

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.print(F("[HTTP] Sending: "));
  Serial.println(jsonPayload);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Response code: %d | Body: %s\n", httpCode, response.c_str());

    // Parse server response for relay command (e.g. if wallet runs out of balance)
    StaticJsonDocument<256> respDoc;
    DeserializationError error = deserializeJson(respDoc, response);
    if (!error) {
      const char* relayControl = respDoc["relayControl"] | "ON";
      if (strcmp(relayControl, "OFF") == 0) {
        digitalWrite(RELAY_PIN, LOW); // Cut load
        Serial.println(F("[RELAY] Turned OFF by Server (Zero Balance)"));
      } else {
        digitalWrite(RELAY_PIN, HIGH); // Restore load
      }
    }
  } else {
    Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}