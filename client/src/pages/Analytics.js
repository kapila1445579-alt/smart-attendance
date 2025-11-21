import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Analytics = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedClass(response.data.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/analytics/class/${selectedClass}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchAnalytics();
    }
  }, [selectedClass]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Attendance Analytics
        </Typography>

        <Card sx={{ mb: 3, p: 2 }}>
          <TextField
            select
            label="Select Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            sx={{ minWidth: 300 }}
          >
            {classes.map((classItem) => (
              <MenuItem key={classItem._id} value={classItem._id}>
                {classItem.name} ({classItem.code})
              </MenuItem>
            ))}
          </TextField>
        </Card>

        {analytics && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Sessions
                    </Typography>
                    <Typography variant="h4">
                      {analytics.summary.totalSessions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Students
                    </Typography>
                    <Typography variant="h4">
                      {analytics.summary.totalStudents}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Present
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {analytics.summary.present}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Overall %
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {analytics.summary.overallPercentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Method Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Face', value: analytics.methodStats.face },
                            { name: 'QR', value: analytics.methodStats.qr },
                            { name: 'NFC', value: analytics.methodStats.nfc },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Face', value: analytics.methodStats.face },
                            { name: 'QR', value: analytics.methodStats.qr },
                            { name: 'NFC', value: analytics.methodStats.nfc },
                          ].map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Student Attendance Overview
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {Object.entries(analytics.studentStats).map(
                        ([studentId, stats]) => (
                          <Paper
                            key={studentId}
                            sx={{ p: 2, mb: 1 }}
                          >
                            <Typography variant="body2" gutterBottom>
                              Student ID: {studentId}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Typography variant="body2">
                                Present: {stats.present}
                              </Typography>
                              <Typography variant="body2">
                                Absent: {stats.absent}
                              </Typography>
                              <Typography variant="body2" color="primary">
                                {stats.percentage}%
                              </Typography>
                            </Box>
                          </Paper>
                        )
                      )}
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

export default Analytics;

