const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const API_KEY = 'hellofinalproject'; // Change this to something strong and secret

const serviceAccount = require(path.resolve(__dirname, 'firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/upload-metrics', (req, res) => {
  // Simple API key check
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    console.log('Unauthorized request received.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const metrics = req.body;
  console.log('Received metrics:', metrics); // Log incoming data

  if (!metrics || typeof metrics !== 'object') {
    console.log('Invalid data received.');
    return res.status(400).json({ error: 'Invalid data' });
  }

  // Add createdAt if not present
  if (!metrics.createdAt) {
    metrics.createdAt = new Date().toISOString();
  }

  console.log('Writing metrics to Firestore...');
  db.collection('healthMetrics').add(metrics)
    .then(() => {
      console.log('Successfully wrote metrics to Firestore.');
      res.json({ success: true });
    })
    .catch(err => {
      console.error('Error uploading metrics:', err);
      res.status(500).json({ error: 'Failed to upload metrics' });
    });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 