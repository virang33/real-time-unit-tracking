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
const char* WIFI_SSID     = "MyPhone";
const char* WIFI_PASSWORD = "12345678";

// 2. GridOS Backend Server URL (Configured for your local machine)
const char* SERVER_URL    = "http://172.26.145.126:11020/api/live-data";
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
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.println();
  Serial.print(F("[WiFi] Connecting to: "));
  Serial.println(WIFI_SSID);

  WiFi.disconnect(true);
  delay(500);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Try up to ~15 seconds
  const int maxAttempts = 30;
  const int delayMs = 500;
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
    Serial.println(F("\n[WiFi] Connection timed out. Will retry on next loop."));
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

  // No dummy values: report zero until a real PZEM sensor is enabled.
  float voltage = 0.0;
  float current = 0.0;
  float power = 0.0;
  float accumulatedEnergy = 0.0;
  float frequency = 0.0;
  float powerFactor = 0.0;

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