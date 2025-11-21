import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { CameraAlt, CheckCircle } from '@mui/icons-material';
import * as faceapi from 'face-api.js';
import api from '../services/api';

const FaceRegistration = ({ onSuccess, onError, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadModels();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error('Error loading models:', err);
      if (onError) onError('Failed to load face recognition models. Please refresh the page.');
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (onError) onError('Failed to access camera. Please grant camera permissions.');
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndRegister = async () => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current) {
      if (onError) onError('Models not loaded or camera not ready');
      return;
    }

    setCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };

      faceapi.matchDimensions(canvas, displaySize);

      // Detect face
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        if (onError) onError('No face detected. Please ensure your face is clearly visible.');
        setCapturing(false);
        return;
      }

      // Draw detection on canvas
      const resizedDetection = faceapi.resizeResults(detection, displaySize);
      faceapi.draw.drawDetections(canvas, resizedDetection);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);

      // Capture image
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Send to backend
      const response = await api.post('/auth/register-face', {
        image: imageData
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          stopCamera();
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        if (onError) onError(response.data.message || 'Face registration failed');
        setCapturing(false);
      }
    } catch (err) {
      console.error('Error registering face:', err);
      if (onError) onError(err.response?.data?.message || 'Failed to register face. Please try again.');
      setCapturing(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading face recognition models...
        </Typography>
      </Card>
    );
  }

  if (success) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Face Registered Successfully!
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Register Your Face
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Position your face in front of the camera and click "Capture & Register"
        </Typography>

        <Box sx={{ position: 'relative', mb: 2 }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              maxWidth: '640px',
              borderRadius: '8px',
              transform: 'scaleX(-1)'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              maxWidth: '640px',
              transform: 'scaleX(-1)'
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<CameraAlt />}
            onClick={captureAndRegister}
            disabled={capturing || !modelsLoaded}
            size="large"
          >
            {capturing ? 'Registering...' : 'Capture & Register'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              stopCamera();
              if (onCancel) onCancel();
            }}
          >
            Cancel
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FaceRegistration;

