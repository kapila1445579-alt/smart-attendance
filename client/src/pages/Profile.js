import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import { Face as FaceIcon } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FaceRegistration from '../components/FaceRegistration';

const Profile = () => {
  const { user } = useAuth();
  const [registeringFace, setRegisteringFace] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFaceRegistrationSuccess = () => {
    setMessage('Face registered successfully!');
    setRegisteringFace(false);
    // Refresh page to update user data
    window.location.reload();
  };

  const handleFaceRegistrationError = (err) => {
    setError(err || 'Failed to register face');
    setRegisteringFace(false);
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={user?.name || ''}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                value={user?.email || ''}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Role"
                value={user?.role || ''}
                disabled
                sx={{ mb: 2 }}
              />
              {user?.studentId && (
                <TextField
                  fullWidth
                  label="Student ID"
                  value={user.studentId}
                  disabled
                  sx={{ mb: 2 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {user?.role === 'student' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Face Registration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Register your face to enable facial recognition attendance.
              </Typography>
              {user?.faceDescriptor ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Face is registered
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Face not registered yet
                </Alert>
              )}
              <Button
                variant="contained"
                startIcon={<FaceIcon />}
                onClick={() => setRegisteringFace(true)}
              >
                {user?.faceDescriptor ? 'Re-register Face' : 'Register Face'}
              </Button>
              {registeringFace && (
                <Box sx={{ mt: 3 }}>
                  <FaceRegistration
                    onSuccess={handleFaceRegistrationSuccess}
                    onError={handleFaceRegistrationError}
                    onCancel={() => setRegisteringFace(false)}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
};

export default Profile;

