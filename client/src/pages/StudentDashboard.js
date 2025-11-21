import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import { QrCodeScanner, Face, Nfc } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FaceRecognition from '../components/FaceRecognition';
import QRScanner from '../components/QRScanner';
import NFCScanner from '../components/NFCScanner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [method, setMethod] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchActiveSessions();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      // This would need a new endpoint to get active sessions for student
      // For now, we'll use a placeholder
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const handleMarkAttendance = (methodType, sessionId) => {
    setMethod(methodType);
    setSessionId(sessionId);
    setError('');
  };

  const handleAttendanceSuccess = () => {
    setMethod(null);
    setSessionId('');
    fetchActiveSessions();
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Student Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {method ? (
          <Box sx={{ mt: 4 }}>
            {method === 'face' && (
              <FaceRecognition
                sessionId={sessionId}
                onSuccess={handleAttendanceSuccess}
                onError={(err) => setError(err)}
              />
            )}
            {method === 'qr' && (
              <QRScanner
                sessionId={sessionId}
                onSuccess={handleAttendanceSuccess}
                onError={(err) => setError(err)}
              />
            )}
            {method === 'nfc' && (
              <NFCScanner
                sessionId={sessionId}
                onSuccess={handleAttendanceSuccess}
                onError={(err) => setError(err)}
              />
            )}
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      My Classes
                    </Typography>
                    {classes.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        You are not enrolled in any classes yet.
                      </Typography>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        {classes.map((classItem) => (
                          <Card key={classItem._id} sx={{ mb: 2, p: 2 }}>
                            <Typography variant="subtitle1">
                              {classItem.name} ({classItem.code})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Faculty: {classItem.faculty?.name}
                            </Typography>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Mark Attendance
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Enter Session ID"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Face />}
                            onClick={() => handleMarkAttendance('face', sessionId)}
                            disabled={!sessionId}
                          >
                            Face Recognition
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<QrCodeScanner />}
                            onClick={() => handleMarkAttendance('qr', sessionId)}
                            disabled={!sessionId}
                          >
                            Scan QR Code
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Nfc />}
                            onClick={() => handleMarkAttendance('nfc', sessionId)}
                            disabled={!sessionId}
                          >
                            NFC
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </>
  );
};

export default StudentDashboard;

