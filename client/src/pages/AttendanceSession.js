import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Stop as StopIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

const AttendanceSession = ({ sessionId: propSessionId, onBack }) => {
  const { id: paramSessionId } = useParams();
  const sessionId = propSessionId || paramSessionId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchSession();
    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionId]);

  const connectSocket = () => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    newSocket.emit('join-session', sessionId);
    
    newSocket.on('attendance-marked', (data) => {
      setAttendance((prev) => [...prev, data]);
      fetchSession();
    });

    newSocket.on('session-ended', () => {
      fetchSession();
    });

    setSocket(newSocket);
  };

  const fetchSession = async () => {
    try {
      const response = await api.get(`/attendance/session/${sessionId}`);
      setSession(response.data.data);
      setAttendance(response.data.data.attendance || []);
      
      // If QR code method, fetch QR code
      if (
        response.data.data.verificationMethod === 'qr' ||
        response.data.data.verificationMethod === 'hybrid'
      ) {
        // QR code should be in the session creation response
        // For now, we'll generate it client-side if needed
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      await api.put(`/attendance/session/${sessionId}/end`);
      fetchSession();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (!session) {
    return (
      <>
        <Navbar />
        <Container>
          <Typography>Loading...</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {(onBack || user?.role === 'faculty') && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => (onBack ? onBack() : navigate('/faculty'))}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
          )}
          <Typography variant="h4">
            {session.classId?.name} - {session.sessionType}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Attendance List</Typography>
                  <Chip
                    label={session.status}
                    color={
                      session.status === 'active' ? 'success' : 'default'
                    }
                  />
                </Box>
                <List>
                  {attendance.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No attendance marked yet.
                    </Typography>
                  ) : (
                    attendance.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.studentId?.name || 'Unknown'}
                          secondary={`Marked at: ${new Date(
                            item.markedAt
                          ).toLocaleString()} via ${item.method}`}
                        />
                        <Chip label={item.method} size="small" />
                      </ListItem>
                    ))
                  )}
                </List>
                {user?.role === 'faculty' && session.status === 'active' && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={handleEndSession}
                    >
                      End Session
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            {session.verificationMethod === 'qr' ||
            session.verificationMethod === 'hybrid' ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    QR Code
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      p: 2,
                    }}
                  >
                    {session.qrCode?.code ? (
                      <QRCodeSVG
                        value={JSON.stringify({
                          sessionId: session._id,
                          code: session.qrCode.code,
                          expiresAt: session.qrCode.expiresAt,
                        })}
                        size={200}
                      />
                    ) : (
                      <Typography>QR Code not available</Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Students can scan this QR code to mark attendance
                  </Typography>
                </CardContent>
              </Card>
            ) : null}

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Info
                </Typography>
                <Typography variant="body2">
                  <strong>Method:</strong> {session.verificationMethod}
                </Typography>
                <Typography variant="body2">
                  <strong>Started:</strong>{' '}
                  {new Date(session.startTime).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Duration:</strong> {session.duration} minutes
                </Typography>
                <Typography variant="body2">
                  <strong>Total Marked:</strong> {attendance.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default AttendanceSession;

