import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    classId: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchReports();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.classId) params.classId = filters.classId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (user?.role === 'student') params.studentId = user.id;

      const response = await api.get('/attendance/reports', { params });
      setReports(response.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleApplyFilters = () => {
    fetchReports();
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Attendance Reports
        </Typography>

        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {user?.role !== 'student' && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Class"
                  value={filters.classId}
                  onChange={(e) => handleFilterChange('classId', e.target.value)}
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {classes.map((classItem) => (
                    <MenuItem key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Card>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                {user?.role !== 'student' && <TableCell>Student</TableCell>}
                <TableCell>Class</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      {new Date(report.date).toLocaleDateString()}
                    </TableCell>
                    {user?.role !== 'student' && (
                      <TableCell>
                        {report.studentId?.name || 'Unknown'}
                      </TableCell>
                    )}
                    <TableCell>
                      {report.classId?.name} ({report.classId?.code})
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={
                          report.status === 'present'
                            ? 'success'
                            : report.status === 'late'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{report.method}</TableCell>
                    <TableCell>
                      {new Date(report.markedAt).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};

export default Reports;

