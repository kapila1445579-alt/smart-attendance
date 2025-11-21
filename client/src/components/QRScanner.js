import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Card, CardContent, Alert, TextField } from '@mui/material';
import { QrCodeScanner, CheckCircle } from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

const QRScanner = ({ sessionId, onSuccess, onError }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, [scanning]);

  const startScanning = async () => {
    try {
      setError('');
      setScanning(true);

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          await handleQRCode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const handleQRCode = async (qrData) => {
    try {
      await stopScanning();

      // Get location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (err) {
          console.warn('Location not available:', err);
        }
      }

      const response = await api.post('/attendance/mark-qr', {
        sessionId,
        qrData,
        location
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(response.data.message || 'Invalid QR code');
        setScanning(false);
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError(err.response?.data?.message || 'Failed to verify QR code. Please try again.');
      setScanning(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      setError('Please enter a QR code');
      return;
    }
    await handleQRCode(manualCode);
  };

  if (success) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Attendance Marked Successfully!
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          QR Code Scanner
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Scan the QR code displayed by your instructor or enter the code manually
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!scanning ? (
          <Box>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<QrCodeScanner />}
                onClick={startScanning}
                size="large"
              >
                Start Scanner
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Or enter QR code manually:
              </Typography>
              <TextField
                fullWidth
                label="QR Code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                fullWidth
                onClick={handleManualSubmit}
              >
                Submit
              </Button>
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => onError('Cancelled')}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box
              id="qr-reader"
              sx={{
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
                mb: 2
              }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={stopScanning}
              >
                Stop Scanner
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;

