#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "mbedtls/base64.h"
#include "mbedtls/md.h"
#include <time.h>
#include <Wire.h>
#include "MAX30100_PulseOximeter.h"
#include <DHT.h>
#include <TinyGPS++.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// WiFi credentials
const char* ssid = "Raksha";
const char* password = "my_password";

// Azure IoT Hub configuration
const char* host = "ElderlymonitoringIoTHubESP32.azure-devices.net";
const char* deviceId = "esp32Device";
const int mqttPort = 8883;
const char* resourceUri = "ElderlymonitoringIoTHubESP32.azure-devices.net/devices/esp32Device";
const char* key = "Ex8kjQZp0C3Ijsyuw87QS/7jLZM298aAd7/XAUKPa5c=";

const char* azure_root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIEtjCCA56gAwIBAgIQCv1eRG9c89YADp5Gwibf9jANBgkqhkiG9w0BAQsFADBh\n" \
"MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3\n" \
"d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH\n" \
"MjAeFw0yMjA0MjgwMDAwMDBaFw0zMjA0MjcyMzU5NTlaMEcxCzAJBgNVBAYTAlVT\n" \
"MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xGDAWBgNVBAMTD01TRlQg\n" \
"UlMyNTYgQ0EtMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMiJV34o\n" \
"eVNHI0mZGh1Rj9mdde3zSY7IhQNqAmRaTzOeRye8QsfhYFXSiMW25JddlcqaqGJ9\n" \
"GEMcJPWBIBIEdNVYl1bB5KQOl+3m68p59Pu7npC74lJRY8F+p8PLKZAJjSkDD9Ex\n" \
"mjHBlPcRrasgflPom3D0XB++nB1y+WLn+cB7DWLoj6qZSUDyWwnEDkkjfKee6ybx\n" \
"SAXq7oORPe9o2BKfgi7dTKlOd7eKhotw96yIgMx7yigE3Q3ARS8m+BOFZ/mx150g\n" \
"dKFfMcDNvSkCpxjVWnk//icrrmmEsn2xJbEuDCvtoSNvGIuCXxqhTM352HGfO2JK\n" \
"AF/Kjf5OrPn2QpECAwEAAaOCAYIwggF+MBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYD\n" \
"VR0OBBYEFAyBfpQ5X8d3on8XFnk46DWWjn+UMB8GA1UdIwQYMBaAFE4iVCAYlebj\n" \
"buYP+vq5Eu0GF485MA4GA1UdDwEB/wQEAwIBhjAdBgNVHSUEFjAUBggrBgEFBQcD\n" \
"AQYIKwYBBQUHAwIwdgYIKwYBBQUHAQEEajBoMCQGCCsGAQUFBzABhhhodHRwOi8v\n" \
"b2NzcC5kaWdpY2VydC5jb20wQAYIKwYBBQUHMAKGNGh0dHA6Ly9jYWNlcnRzLmRp\n" \
"Z2ljZXJ0LmNvbS9EaWdpQ2VydEdsb2JhbFJvb3RHMi5jcnQwQgYDVR0fBDswOTA3\n" \
"oDWgM4YxaHR0cDovL2NybDMuZGlnaWNlcnQuY29tL0RpZ2lDZXJ0R2xvYmFsUm9v\n" \
"dEcyLmNybDA9BgNVHSAENjA0MAsGCWCGSAGG/WwCATAHBgVngQwBATAIBgZngQwB\n" \
"AgEwCAYGZ4EMAQICMAgGBmeBDAECAzANBgkqhkiG9w0BAQsFAAOCAQEAdYWmf+AB\n" \
"klEQShTbhGPQmH1c9BfnEgUFMJsNpzo9dvRj1Uek+L9WfI3kBQn97oUtf25BQsfc\n" \
"kIIvTlE3WhA2Cg2yWLTVjH0Ny03dGsqoFYIypnuAwhOWUPHAu++vaUMcPUTUpQCb\n" \
"eC1h4YW4CCSTYN37D2Q555wxnni0elPj9O0pymWS8gZnsfoKjvoYi/qDPZw1/TSR\n" \
"penOgI6XjmlmPLBrk4LIw7P7PPg4uXUpCzzeybvARG/NIIkFv1eRYIbDF+bIkZbJ\n" \
"QFdB9BjjlA4ukAg2YkOyCiB8eXTBi2APaceh3+uBLIgLk8ysy52g2U3gP7Q26Jlg\n" \
"q/xKzj3O9hFh/g==\n" \
"-----END CERTIFICATE-----\n"; 

// MQTT client
WiFiClientSecure espClient;
PubSubClient client(espClient);
unsigned long sasExpiryTime = 0;
char sasToken[512];

// Sensor definitions
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

PulseOximeter pox;
uint32_t tsLastReport = 0;
#define REPORTING_PERIOD_MS 120000 // Every 2 min once

#define RXD2 18
#define TXD2 5
HardwareSerial gpsSerial(1);
TinyGPSPlus gps;

Adafruit_MPU6050 mpu;
sensors_event_t a, g, temp;

#define ADC_VREF_mV 3300.0
#define ADC_RESOLUTION 4096.0
#define PIN_LM35 33

String urlEncode(const char* msg) {
  String encodedMsg = "";
  char c, code0, code1;
  for (int i = 0; msg[i] != '\0'; i++) {
    c = msg[i];
    if (isalnum(c)) {
      encodedMsg += c;
    } else {
      code1 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code1 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      code0 = c + '0';
      if (c > 9) code0 = c - 10 + 'A';
      encodedMsg += '%';
      encodedMsg += code0;
      encodedMsg += code1;
    }
  }
  return encodedMsg;
}

void generateSasToken() {
  const unsigned long expiryPeriod = 3600;
  sasExpiryTime = time(NULL) + expiryPeriod;
  String stringToSign = urlEncode(resourceUri) + "\n" + String(sasExpiryTime);

  size_t decodedLen;
  unsigned char decodedKey[64];
  mbedtls_base64_decode(decodedKey, sizeof(decodedKey), &decodedLen, (const unsigned char*)key, strlen(key));

  unsigned char hmacResult[32];
  mbedtls_md_context_t ctx;
  const mbedtls_md_info_t* mdInfo = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mdInfo, 1);
  mbedtls_md_hmac_starts(&ctx, decodedKey, decodedLen);
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)stringToSign.c_str(), stringToSign.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  unsigned char base64Result[64];
  size_t base64Len;
  mbedtls_base64_encode(base64Result, sizeof(base64Result), &base64Len, hmacResult, sizeof(hmacResult));

  String signature = String((char*)base64Result).substring(0, base64Len);
  String encodedSignature = urlEncode(signature.c_str());

  String token = "SharedAccessSignature sr=" + urlEncode(resourceUri) + "&sig=" + encodedSignature + "&se=" + String(sasExpiryTime);
  token.toCharArray(sasToken, sizeof(sasToken));
}

void reconnect() {
  while (!client.connected()) {
    generateSasToken();
    String username = String(host) + "/" + deviceId + "/?api-version=2021-04-12";

    if (client.connect(deviceId, username.c_str(), sasToken)) {
      Serial.println("MQTT connected.");
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying...");
      delay(5000);
    }
  }
}

void onBeatDetected() {
  Serial.println("Beat Detected!");
}

void setup() {
  Serial.begin(115200);
  delay(100);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = time(nullptr);
  while (now < 100000) {
    delay(500);
    now = time(nullptr);
  }

  espClient.setCACert(azure_root_ca);
  espClient.setHandshakeTimeout(10);
  espClient.setTimeout(30);
  client.setBufferSize(1024);
  client.setServer(host, mqttPort);

  Wire.begin(21, 22);
  dht.begin();
  gpsSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);
  mpu.begin(0x68);
  pox.begin();
  pox.setOnBeatDetectedCallback(onBeatDetected);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  pox.update();

  if (millis() - tsLastReport > REPORTING_PERIOD_MS) {
    tsLastReport = millis();

    float temp_dht = dht.readTemperature();
    float hum_dht = dht.readHumidity();

    int adcVal = analogRead(PIN_LM35);
    float tempC = (adcVal * (ADC_VREF_mV / ADC_RESOLUTION)) / 10;

    float spo2 = pox.getSpO2();
    float bpm = pox.getHeartRate();

    while (gpsSerial.available()) {
      gps.encode(gpsSerial.read());
    }

    // GPS data
    String lat = gps.location.isValid() ? String(gps.location.lat(), 6) : "0.0";
    String lng = gps.location.isValid() ? String(gps.location.lng(), 6) : "0.0";
    String alt = gps.altitude.isValid() ? String(gps.altitude.meters(), 2) : "0.0";
    String speed = gps.speed.isValid() ? String(gps.speed.kmph(), 2) : "0.0";

    // MPU6050 data
    mpu.getEvent(&a, &g, &temp);

    StaticJsonDocument<768> doc;
    doc["dht_temp"] = temp_dht;
    doc["dht_hum"] = hum_dht;
    doc["lm35_temp"] = tempC;
    doc["spo2"] = spo2;
    doc["bpm"] = bpm;

    doc["gps_lat"] = lat;
    doc["gps_lng"] = lng;
    doc["gps_alt"] = alt;
    doc["gps_speed"] = speed;

    doc["acc_x"] = a.acceleration.x;
    doc["acc_y"] = a.acceleration.y;
    doc["acc_z"] = a.acceleration.z;

    doc["gyro_x"] = g.gyro.x;
    doc["gyro_y"] = g.gyro.y;
    doc["gyro_z"] = g.gyro.z;

    char payload[768];
    serializeJson(doc, payload);

    String topic = "devices/" + String(deviceId) + "/messages/events/";
    client.publish(topic.c_str(), payload);
    Serial.println("Data sent to Azure IoT Hub:");
    Serial.println(payload);
  }
}
