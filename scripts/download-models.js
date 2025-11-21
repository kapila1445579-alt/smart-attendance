const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/';
const MODELS_DIR = path.join(__dirname, '../client/public/models');

// Models to download
const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('Created models directory:', MODELS_DIR);
}

// Download function
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Downloaded:', path.basename(dest));
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });
  });
}

// Download all models
async function downloadModels() {
  console.log('Starting model downloads...\n');
  
  for (const model of models) {
    const url = MODEL_BASE_URL + model;
    const dest = path.join(MODELS_DIR, model);
    
    // Skip if already exists
    if (fs.existsSync(dest)) {
      console.log('Skipping (already exists):', model);
      continue;
    }
    
    try {
      await downloadFile(url, dest);
    } catch (error) {
      console.error(`Error downloading ${model}:`, error.message);
    }
  }
  
  console.log('\nModel download complete!');
  console.log('Models saved to:', MODELS_DIR);
}

// Run download
downloadModels().catch(console.error);

