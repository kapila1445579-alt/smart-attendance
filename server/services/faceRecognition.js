const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const path = require('path');

// Configure face-api.js to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

// Load face-api models
const loadModels = async () => {
  if (modelsLoaded) return;
  
  try {
    const modelsPath = path.join(__dirname, '../models');
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath)
    ]);
    
    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    // In production, you might want to download models or use a cloud service
    throw new Error('Failed to load face recognition models');
  }
};

// Initialize models on module load
loadModels().catch(err => {
  console.warn('Models will be loaded on first use:', err.message);
});

// Extract face descriptor from image
const extractFaceDescriptor = async (imageBuffer) => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const img = await faceapi.bufferToImage(imageBuffer);
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in image');
    }

    return Array.from(detection.descriptor);
  } catch (error) {
    console.error('Error extracting face descriptor:', error);
    throw error;
  }
};

// Compare two face descriptors
const compareFaces = (descriptor1, descriptor2, threshold = 0.6) => {
  if (!descriptor1 || !descriptor2) {
    return false;
  }

  // Calculate Euclidean distance
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return distance < threshold;
};

// Verify face match
const verifyFace = async (imageBuffer, storedDescriptor) => {
  try {
    const extractedDescriptor = await extractFaceDescriptor(imageBuffer);
    return compareFaces(extractedDescriptor, storedDescriptor);
  } catch (error) {
    console.error('Error verifying face:', error);
    return false;
  }
};

module.exports = {
  extractFaceDescriptor,
  compareFaces,
  verifyFace,
  loadModels
};

