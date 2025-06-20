# Elderly Health Monitoring System
This project aims to build a smart, cloud-connected healthcare system that enables real-time remote monitoring of vital signs for the elderly or individuals requiring continuous medical care. It brings together IoT sensors, Azure IoT services, Digital Twin modeling, and a mobile application for both patients and caregivers.

The system enables real-time tracking of key health parameters including heart rate, SpO₂, environment temperature, body temperature, GPS location, and motion data via gyroscope sensors. These readings are collected through an ESP32 microcontroller and transmitted over Wi-Fi to Azure IoT Hub. From there, the data is mapped to Azure Digital Twins, creating a live virtual model of the patient that updates in real time. To make this data accessible and actionable, we developed a mobile app using Expo and React Native, which allows users to view real-time health graphs, receive medication reminders through a tablet scheduling feature, interact with a 3D visualization of the digital twin, and receive instant alerts whenever any vital sign crosses predefined safe thresholds.

<img width="739" alt="Review 2 System Diagram" src="https://github.com/user-attachments/assets/0969f4b2-752c-48bf-b527-01252a43bb79" />

## Hardware Setup
All sensor components were integrated with the ESP32 Wi-Fi-enabled microcontroller, which served as the central hub for data collection and transmission. The system included a range of sensors: DHT11 for environment temperature and humidity, MAX30100 for heart rate and SpO₂, MPU6050 for accelerometer and gyroscope data, a GPS module for real-time location tracking, and an LM35 sensor for precise body temperature monitoring. Together, these components enabled comprehensive and continuous health data acquisition for the digital twin system.

![WhatsApp Image 2025-06-19 at 1 50 45 PM](https://github.com/user-attachments/assets/8ba3d1be-a754-4a9a-b9a9-ec785a156c62)

## Azure Cloud
In the cloud layer, we set up an Azure IoT Hub to receive real-time sensor data from the ESP32 device over MQTT. The Function App that listens to incoming messages from the IoT Hub, processes the data, and updates the corresponding Azure Digital Twin instance. This Digital Twin serves as a live, cloud-based model of the patient, continuously reflecting the latest health metrics and environmental conditions. This architecture ensures seamless data flow from physical sensors to a dynamic virtual model, enabling real-time monitoring and intelligent health insights.


<img width="499" alt="az" src="https://github.com/user-attachments/assets/1e342100-ffd9-460c-a72f-064e444830d6" />


<img width="290" alt="az1" src="https://github.com/user-attachments/assets/33f18b22-3dec-484d-aa48-9dad4ce9649a" />

## Mobile Application
The mobile application, built using React Native with Expo, is designed to provide an intuitive and accessible interface for both caregivers and patients. The app features a clean home screen for navigation, interactive graphs that display live sensor data, a 3D digital twin model for visualizing the patient's current state, and a tablet scheduler that provides timely medication reminders. With a focus on usability and responsiveness, the app ensures that critical health insights are always just a tap away.

<img width="632" alt="Screenshot 2025-06-19 134709" src="https://github.com/user-attachments/assets/5d2c1f9d-37f8-4080-98ba-20a9424dcc5d" />

<img width="223" alt="mine" src="https://github.com/user-attachments/assets/9464e33c-8f64-4388-b793-e9794937f897" />




