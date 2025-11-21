import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { Nfc, CheckCircle } from '@mui/icons-material';
import api from '../services/api';

const NFCScanner = ({ sessionId, onSuccess, onError }) => {
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [nfcSupported, setNfcSupported] = useState(false);

  useEffect(() => {
    // Check if Web NFC API is supported
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    } else {
      setError('NFC is not supported in this browser. Please use Chrome on Android or Edge on Windows.');
    }
  }, []);

  const handleNFCScan = async () => {
    if (!nfcSupported) {
      setError('NFC is not supported in this browser.');
      return;
    }

    setScanning(true);
    setError('');

    try {
      // Web NFC API
      const ndef = new window.NDEFReader();
      
      await ndef.scan();
      
      ndef.addEventListener('reading', async (event) => {
        try {
          const decoder = new TextDecoder();
          const nfcId = decoder.decode(event.message.records[0].data);

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

          // Send to backend
          const response = await api.post('/attendance/mark-nfc', {
            sessionId,
            nfcId,
            location
          });

          if (response.data.success) {
            setSuccess(true);
            setScanning(false);
            setTimeout(() => {
              if (onSuccess) onSuccess();
            }, 2000);
          } else {
            setError(response.data.message || 'NFC verification failed');
            setScanning(false);
          }
        } catch (err) {
          console.error('Error processing NFC:', err);
          setError(err.response?.data?.message || 'Failed to verify NFC. Please try again.');
          setScanning(false);
        }
      });

      ndef.addEventListener('readingerror', (event) => {
        setError('Error reading NFC tag. Please try again.');
        setScanning(false);
      });

    } catch (err) {
      console.error('Error starting NFC scan:', err);
      setError('Failed to start NFC scanner. Please ensure NFC is enabled and try again.');
      setScanning(false);
    }
  };

  const handleManualNFC = async () => {
    // Fallback: Manual NFC ID entry
    const nfcId = prompt('Enter your NFC ID:');
    if (!nfcId) return;

    setScanning(true);
    setError('');

    try {
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

      const response = await api.post('/attendance/mark-nfc', {
        sessionId,
        nfcId,
        location
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setError(response.data.message || 'NFC verification failed');
      }
    } catch (err) {
      console.error('Error processing NFC:', err);
      setError(err.response?.data?.message || 'Failed to verify NFC. Please try again.');
    } finally {
      setScanning(false);
    }
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
          NFC Attendance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {nfcSupported
            ? 'Tap your NFC card or device on the reader'
            : 'NFC is not supported. Please use manual entry or another method.'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!nfcSupported && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Web NFC API is only supported in Chrome on Android and Edge on Windows.
            You can use manual entry as an alternative.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          {nfcSupported ? (
            <Button
              variant="contained"
              startIcon={<Nfc />}
              onClick={handleNFCScan}
              disabled={scanning}
              size="large"
            >
              {scanning ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Scanning...
                </>
              ) : (
                'Start NFC Scan'
              )}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Nfc />}
              onClick={handleManualNFC}
              disabled={scanning}
              size="large"
            >
              {scanning ? 'Processing...' : 'Enter NFC ID Manually'}
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={() => {
              if (onError) onError('Cancelled');
            }}
          >
            Cancel
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NFCScanner;

