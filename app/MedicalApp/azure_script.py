import time
import json
import logging
import os
from azure.eventhub import EventHubConsumerClient
from azure.core.exceptions import AzureError, ResourceNotFoundError, HttpResponseError
from azure.digitaltwins.core import DigitalTwinsClient
from azure.identity import AzureCliCredential

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore

# ==============================
# Configuration and Setup
# ==============================

# Environment Variables for Secure Access
event_hub_connection_string = os.getenv("EVENT_HUB_CONN_STRING", "your_event_hub_connection_string")
event_hub_name = os.getenv("EVENT_HUB_NAME", "your_event_hub_name")
device_id = os.getenv("DEVICE_ID", "esp32Device")
adt_instance_url = os.getenv("ADT_INSTANCE_URL", "your_adt_url")
twin_id = os.getenv("TWIN_ID", "esp32Device")
firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS", "path/to/your/firebase-service-account.json")

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize clients
try:
    # Azure clients
    event_hub_client = EventHubConsumerClient.from_connection_string(
        event_hub_connection_string, consumer_group="$Default", eventhub_name=event_hub_name
    )
    credential = AzureCliCredential()
    dt_client = DigitalTwinsClient(adt_instance_url, credential)

    # Firebase client
    cred = credentials.Certificate(firebase_credentials_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    logger.info("[✓] All clients initialized successfully.")
except Exception as e:
    logger.error(f"[✗] Error initializing clients: {e}")
    exit(1)

# ==============================
# Digital Twin Helper Functions
# ==============================

def check_twin_exists():
    try:
        dt_client.get_digital_twin(twin_id)
        logger.info(f"[✓] Twin '{twin_id}' found.")
        return True
    except ResourceNotFoundError:
        logger.error(f"[✗] Twin ID '{twin_id}' not found. Please ensure it exists.")
        return False

def convert_types(payload: dict) -> dict:
    type_mapping = {
        "gps_lat": float, "gps_lng": float, "gps_alt": float, "gps_speed": float,
        "dht_temp": float, "dht_hum": float, "lm35_temp": float,
        "spo2": int, "bpm": int,
        "acc_x": float, "acc_y": float, "acc_z": float,
        "gyro_x": float, "gyro_y": float, "gyro_z": float
    }
    for key, value in list(payload.items()):
        if key in type_mapping:
            try:
                payload[key] = type_mapping[key](value)
                logger.info(f"[~] Converted '{key}' to {type_mapping[key].__name__}: {payload[key]}")
            except ValueError:
                logger.warning(f"[!] Failed to convert '{key}' with value '{value}'. Skipping update.")
                payload.pop(key)
    return payload

def update_digital_twin(payload: dict):
    payload = convert_types(payload)
    patch = [{"op": "add", "path": f"/{key}", "value": value} for key, value in payload.items()]
    if not patch:
        logger.warning("[!] No valid properties to update.")
        return
    try:
        dt_client.update_digital_twin(twin_id, patch)
        logger.info(f"[✓] Digital Twin '{twin_id}' updated successfully with payload: {json.dumps(payload)}")
        logger.info("[~] Waiting for 2 minutes before the next cycle...")
        time.sleep(60)
    except HttpResponseError as e:
        logger.error(f"[✗] Failed to update Digital Twin: {e}")
    except Exception as e:
        logger.error(f"[✗] Unexpected error: {e}")

# ==============================
# IoT Hub Event Processor
# ==============================

def on_event(partition_context, event):
    try:
        try:
            message_data = event.body_as_json()
        except Exception:
            logger.warning("[!] Non-JSON event received. Skipping.")
            partition_context.update_checkpoint()
            return

        logger.info("[*] Received message from IoT Hub: %s", json.dumps(message_data, indent=2))

        if isinstance(message_data, dict) and message_data.get("device_id") == device_id:
            logger.info(f"[✓] Message from device '{device_id}' received.")
            message_data.pop("device_id", None)

            # Update Azure Digital Twin
            update_digital_twin(message_data)

            # Save to Firebase Firestore
            try:
                message_data['timestamp'] = firestore.SERVER_TIMESTAMP
                message_data['createdAt'] = firestore.SERVER_TIMESTAMP
                db.collection("healthMetrics").add(message_data)
                logger.info("[✓] Data stored in Firestore successfully.")
            except Exception as firebase_error:
                logger.error(f"[✗] Failed to write to Firestore: {firebase_error}")
        else:
            logger.info("[!] Message ignored: Device ID mismatch or payload format incorrect.")

    except Exception as e:
        logger.error(f"[✗] Error processing event: {e}")
    finally:
        partition_context.update_checkpoint()

# ==============================
# Main Runner
# ==============================

logger.info("[*] Starting IoT → Digital Twin + Firebase relay...")
if not check_twin_exists():
    logger.error("[✗] Twin not found. Exiting.")
    exit(1)

try:
    with event_hub_client:
        logger.info("[*] Listening for messages...")
        event_hub_client.receive(on_event, starting_position="-1")
except KeyboardInterrupt:
    logger.info("[!] Stopped by user.")
except AzureError as e:
    logger.error(f"[✗] Azure Event Hub error: {e}")
except Exception as e:
    logger.error(f"[✗] Unexpected error: {e}")
finally:
    logger.info("[*] Shutting down listener gracefully.") 