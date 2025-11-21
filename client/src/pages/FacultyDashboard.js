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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AttendanceSession from './AttendanceSession';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    classId: '',
    sessionType: 'lecture',
    verificationMethod: 'qr',
    duration: 60,
  });
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    day: 'Monday',
    time: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [classError, setClassError] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchSessions();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleCreateClass = async () => {
    setClassError('');
    setClassLoading(true);

    try {
      await api.post('/classes', {
        name: classForm.name.trim(),
        code: classForm.code.trim().toUpperCase(),
        schedule: {
          day: classForm.day,
          time: classForm.time,
          location: classForm.location,
        },
      });

      setClassDialogOpen(false);
      setClassForm({
        name: '',
        code: '',
        day: 'Monday',
        time: '',
        location: '',
      });
      fetchClasses();
    } catch (error) {
      setClassError(error.response?.data?.message || 'Failed to create class');
    } finally {
      setClassLoading(false);
    }
  };

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const fetchSessions = async () => {
    try {
      // This would need a new endpoint
      // For now, placeholder
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleCreateSession = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/attendance/create-session', formData);
      setOpenDialog(false);
      setFormData({
        classId: '',
        sessionType: 'lecture',
        verificationMethod: 'qr',
        duration: 60,
      });
      fetchSessions();
      // Navigate to session page
      if (response.data.data.session) {
        setSelectedSession(response.data.data.session);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  if (selectedSession) {
    return (
      <AttendanceSession
        sessionId={selectedSession._id}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Typography variant="h4">Faculty Dashboard</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SchoolIcon />}
              onClick={() => setClassDialogOpen(true)}
            >
              New Class
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Create Session
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  My Classes
                </Typography>
                {classes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    You don't have any classes yet. Click "New Class" to create your
                    first class.
                  </Typography>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {classes.map((classItem) => (
                      <Card key={classItem._id} sx={{ mb: 2, p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle1">
                              {classItem.name} ({classItem.code})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {classItem.students?.length || 0} students
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setFormData({ ...formData, classId: classItem._id });
                              setOpenDialog(true);
                            }}
                          >
                            Create Session
                          </Button>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog
          open={classDialogOpen}
          onClose={() => {
            setClassDialogOpen(false);
            setClassError('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Class</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {classError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setClassError('')}>
                  {classError}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Class Name"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Class Code"
                value={classForm.code}
                onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                sx={{ mb: 2 }}
                helperText="Example: CSE101"
              />
              <TextField
                fullWidth
                select
                label="Day"
                value={classForm.day}
                onChange={(e) => setClassForm({ ...classForm, day: e.target.value })}
                sx={{ mb: 2 }}
              >
                {daysOfWeek.map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Time"
                value={classForm.time}
                onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="e.g., 10:00 AM - 11:00 AM"
              />
              <TextField
                fullWidth
                label="Location"
                value={classForm.location}
                onChange={(e) => setClassForm({ ...classForm, location: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClassDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateClass}
              variant="contained"
              disabled={
                classLoading ||
                !classForm.name.trim() ||
                !classForm.code.trim()
              }
            >
              {classLoading ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Attendance Session</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                select
                label="Class"
                value={formData.classId}
                onChange={(e) =>
                  setFormData({ ...formData, classId: e.target.value })
                }
                sx={{ mb: 2 }}
              >
                {classes.map((classItem) => (
                  <MenuItem key={classItem._id} value={classItem._id}>
                    {classItem.name} ({classItem.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Session Type"
                value={formData.sessionType}
                onChange={(e) =>
                  setFormData({ ...formData, sessionType: e.target.value })
                }
                sx={{ mb: 2 }}
              >
                <MenuItem value="lecture">Lecture</MenuItem>
                <MenuItem value="laboratory">Laboratory</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="Verification Method"
                value={formData.verificationMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    verificationMethod: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              >
                <MenuItem value="face">Facial Recognition</MenuItem>
                <MenuItem value="qr">QR Code</MenuItem>
                <MenuItem value="nfc">NFC</MenuItem>
                <MenuItem value="hybrid">Hybrid (QR + Face)</MenuItem>
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: parseInt(e.target.value) })
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSession}
              variant="contained"
              disabled={loading || !formData.classId}
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default FacultyDashboard;

