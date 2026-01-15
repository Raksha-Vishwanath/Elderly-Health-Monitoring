import time
import json
import logging
import os
import sys
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
event_hub_connection_string = os.getenv("EVENT_HUB_CONN_STRING", "Endpoint=sb://ihsuprodblres063dednamespace.servicebus.windows.net/;SharedAccessKeyName=iothubowner;SharedAccessKey=C+gFpOse1fIQG0fS3aymfNZr73LjKWtm/AIoTM85+Ng=;EntityPath=iothub-ehub-elderlymon-65452121-34bbe72ce0")
event_hub_name = os.getenv("EVENT_HUB_NAME", "iothub-ehub-elderlymon-65452121-34bbe72ce0")
device_id = os.getenv("DEVICE_ID", "esp32Device")
adt_instance_url = os.getenv("ADT_INSTANCE_URL", "https://ElderlyTwin.api.eus.digitaltwins.azure.net")
twin_id = os.getenv("TWIN_ID", "esp32Device")
firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS", "C:/Users/Khushi Sinha/med/firebase-service-account.json")

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def log_and_print(message, level="info"):
    """Log message and print to console with immediate flush"""
    print(message, flush=True)
    if level == "info":
        logger.info(message)
    elif level == "error":
        logger.error(message)
    elif level == "warning":
        logger.warning(message)

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

    log_and_print("[✓] All clients initialized successfully.")
except Exception as e:
    log_and_print(f"[✗] Error initializing clients: {e}", "error")
    exit(1)

# ==============================
# Digital Twin Helper Functions
# ==============================

def check_twin_exists():
    try:
        dt_client.get_digital_twin(twin_id)
        log_and_print(f"[✓] Twin '{twin_id}' found.")
        return True
    except ResourceNotFoundError:
        log_and_print(f"[✗] Twin ID '{twin_id}' not found. Please ensure it exists.", "error")
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
                log_and_print(f"[~] Converted '{key}' to {type_mapping[key].__name__}: {payload[key]}")
            except ValueError:
                log_and_print(f"[!] Failed to convert '{key}' with value '{value}'. Skipping update.", "warning")
                payload.pop(key)
    return payload

def update_digital_twin(payload: dict):
    payload = convert_types(payload)
    patch = [{"op": "add", "path": f"/{key}", "value": value} for key, value in payload.items()]
    if not patch:
        log_and_print("[!] No valid properties to update.")
        return
    try:
        dt_client.update_digital_twin(twin_id, patch)
        log_and_print(f"[✓] Digital Twin '{twin_id}' updated successfully with payload: {json.dumps(payload)}")
        log_and_print("[~] Waiting for 2 minutes before the next cycle...")
        time.sleep(60)
    except HttpResponseError as e:
        log_and_print(f"[✗] Failed to update Digital Twin: {e}", "error")
    except Exception as e:
        log_and_print(f"[✗] Unexpected error: {e}", "error")

# ==============================
# IoT Hub Event Processor
# ==============================

def on_event(partition_context, event):
    global db
    try:
        log_and_print("\n=== New Event Received ===")
        try:
            message_data = event.body_as_json()
            log_and_print(f"Raw message data: {json.dumps(message_data, indent=2)}")
        except Exception as e:
            log_and_print(f"Error parsing JSON: {str(e)}", "error")
            partition_context.update_checkpoint()
            return

        if isinstance(message_data, dict) and message_data.get("device_id") == device_id:
            log_and_print(f"\nProcessing message from device: {device_id}")
            message_data.pop("device_id", None)
            log_and_print("Device ID removed from message data")

            # Save to Firebase Firestore FIRST
            try:
                log_and_print("\nPreparing Firestore data...")
                firestore_data = {
                    'dht_temp': message_data.get('dht_temp'),
                    'dht_hum': message_data.get('dht_hum'),
                    'lm35_temp': message_data.get('lm35_temp'),
                    'spo2': message_data.get('spo2'),
                    'bpm': message_data.get('bpm'),
                    'gps_lat': message_data.get('gps_lat'),
                    'gps_lng': message_data.get('gps_lng'),
                    'gps_alt': message_data.get('gps_alt'),
                    'gps_speed': message_data.get('gps_speed'),
                    'acc_x': message_data.get('acc_x'),
                    'acc_y': message_data.get('acc_y'),
                    'acc_z': message_data.get('acc_z'),
                    'gyro_x': message_data.get('gyro_x'),
                    'gyro_y': message_data.get('gyro_y'),
                    'gyro_z': message_data.get('gyro_z'),
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'createdAt': firestore.SERVER_TIMESTAMP
                }
                log_and_print("Firestore data prepared:")
                log_and_print(json.dumps({k: v for k, v in firestore_data.items() if k not in ['timestamp', 'createdAt']}, indent=2))
                firestore_data = {k: v for k, v in firestore_data.items() if v is not None}
                log_and_print(f"Number of fields after removing None values: {len(firestore_data)}")
                log_and_print("\nAttempting to write to Firestore...")
                doc_ref = db.collection("healthMetrics").add(firestore_data)
                log_and_print(f"Success! Document written with ID: {doc_ref[1].id}")
            except Exception as firebase_error:
                log_and_print(f"\nFirebase Error Details:", "error")
                log_and_print(f"Error Type: {type(firebase_error)}", "error")
                log_and_print(f"Error Message: {str(firebase_error)}", "error")
                log_and_print(f"Firebase Credentials Path: {firebase_credentials_path}", "error")
                try:
                    log_and_print("\nAttempting to reinitialize Firebase...")
                    firebase_admin.delete_app(firebase_admin.get_app())
                    cred = credentials.Certificate(firebase_credentials_path)
                    firebase_admin.initialize_app(cred)
                    db = firestore.client()
                    log_and_print("Firebase reinitialized successfully")
                except Exception as reinit_error:
                    log_and_print(f"Failed to reinitialize Firebase: {str(reinit_error)}", "error")

            # Now update Digital Twin
            log_and_print("\nUpdating Digital Twin...")
            update_digital_twin(message_data)

        else:
            log_and_print(f"\nMessage ignored: Device ID mismatch or invalid format", "warning")
            log_and_print(f"Expected device_id: {device_id}", "warning")
            log_and_print(f"Received data: {message_data}", "warning")

    except Exception as e:
        log_and_print(f"\nUnexpected error in event processing: {str(e)}", "error")
    finally:
        log_and_print("\n=== Event Processing Complete ===\n")
        partition_context.update_checkpoint()

# ==============================
# Main Runner
# ==============================

log_and_print("[*] Starting IoT → Digital Twin + Firebase relay...")
if not check_twin_exists():
    log_and_print("[✗] Twin not found. Exiting.", "error")
    exit(1)

try:
    with event_hub_client:
        log_and_print("[*] Listening for messages...")
        event_hub_client.receive(on_event, starting_position="-1")
except KeyboardInterrupt:
    log_and_print("[!] Stopped by user.")
except AzureError as e:
    log_and_print(f"[✗] Azure Event Hub error: {e}", "error")
except Exception as e:
    log_and_print(f"[✗] Unexpected error: {e}", "error")
finally:
    log_and_print("[*] Shutting down listener gracefully.") 