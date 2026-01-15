import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("C:/Users/Khushi Sinha/med/firebase-service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

try:
    doc_ref = db.collection("healthMetrics").add({"test": 123})
    print("Success! Document written with ID:", doc_ref[1].id)
except Exception as e:
    print("Error writing to Firestore:", e) 