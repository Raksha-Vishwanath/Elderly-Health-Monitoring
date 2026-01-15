const { execSync } = require('child_process');
const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key
const serviceAccount = require(path.resolve(__dirname, 'firebase-service-account.json'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 1. Run your Python script and get JSON output
try {
  // Replace 'azure_script.py' with your actual script filename if different
  const output = execSync('python azure_script.py').toString();
  const metrics = JSON.parse(output);

  // 2. Add userId and createdAt
  metrics.userId = '9didw5QUBSdK99FymrenCaFNUOw1';
  metrics.createdAt = new Date().toISOString();

  // 3. Store in Firestore
  db.collection('healthMetrics').add(metrics)
    .then(() => {
      console.log('Metrics uploaded!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error uploading metrics:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Error running Python script or parsing output:', err);
  process.exit(1);
} 