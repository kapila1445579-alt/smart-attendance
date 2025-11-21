import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {user?.role === 'student' && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <SchoolIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  <Typography variant="h5" component="h2" gutterBottom>
                    Student Portal
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mark your attendance, view your records, and track your
                    attendance statistics.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate('/student')}
                  >
                    Go to Student Dashboard
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}

          {user?.role === 'faculty' && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <PersonIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  <Typography variant="h5" component="h2" gutterBottom>
                    Faculty Portal
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create attendance sessions, monitor real-time attendance,
                    and generate reports.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate('/faculty')}
                  >
                    Go to Faculty Dashboard
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  View Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access detailed attendance reports and analytics.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/reports')}
                >
                  View Reports
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;

