import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Analytics as AnalyticsIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  CalendarToday as CalendarIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const StudentStats = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent && startDate && endDate) {
      fetchGradesData();
    }
  }, [selectedStudent, startDate, endDate]);

  // Fetch students list
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch grades data for selected student and date range
  const fetchGradesData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/api/grades/student-period-analysis`, {
        params: {
          studentId: selectedStudent,
          startDate: startDate ? startDate.toISOString().split('T')[0] : null,
          endDate: endDate ? endDate.toISOString().split('T')[0] : null
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGradesData(response.data);
    } catch (error) {
      console.error('Error fetching grades data:', error);
      setError('Failed to load grades data');
      setGradesData(null);
    } finally {
      setLoading(false);
    }
  };

  // Get role-specific header info
  const getRoleInfo = () => {
    if (user?.role === 'admin') {
      return {
        icon: <AdminIcon fontSize="large" />,
        title: 'Admin Student Analysis',
        description: 'Detailed grade analysis and class comparison'
      };
    } else {
      return {
        icon: <SchoolIcon fontSize="large" />,
        title: 'Student Grade Analysis',
        description: 'Detailed grade analysis and class comparison'
      };
    }
  };

  // Prepare chart data for subjects with multiple grades
  const prepareChartData = (subjectGrades) => {
    return subjectGrades.map((grade, index) => ({
      index: index + 1,
      grade: grade.value,
      date: new Date(grade.date).toLocaleDateString(),
      timestamp: new Date(grade.date).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Navigate to dedicated print page
  const handlePrintReport = () => {
    if (!selectedStudent || !startDate || !endDate) {
      alert('Please select a student and date range first.');
      return;
    }
    
    navigate('/student-stats/print', {
      state: {
        selectedStudent,
        selectedStudentData,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    });
  };

  const roleInfo = getRoleInfo();
  const selectedStudentData = students.find(s => s._id === selectedStudent);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4} className="no-print">
        <Box display="flex" alignItems="center">
          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            borderRadius: '50%',
            width: 56, 
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2
          }}>
            {roleInfo.icon}
          </Box>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {roleInfo.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {roleInfo.description}
            </Typography>
          </Box>
        </Box>
        
        {/* Print/PDF buttons */}
        {gradesData && (
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={handleSavePDF}
            >
              Save as PDF
            </Button>
          </Box>
        )}
      </Box>

      {/* Selection Controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }} className="no-print">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Select Student"
                  disabled={studentsLoading}
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.name} ({student.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                disabled={!selectedStudent}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                )}
                maxDate={endDate || new Date()}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                disabled={!selectedStudent || !startDate}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                )}
                minDate={startDate}
                maxDate={new Date()}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
        
        {/* Print Report Button */}
        {selectedStudent && startDate && endDate && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrintReport}
              sx={{ minWidth: 140 }}
            >
              Print Report
            </Button>
          </Box>
        )}
      </Paper>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} className="no-print">
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4} className="no-print">
          <CircularProgress />
        </Box>
      )}

      {/* Grades Analysis Content */}
      {gradesData && (
        <div id="printable-content">
          {/* Report Header */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box className="header" textAlign="center" mb={3}>
              <Typography variant="h3" component="h1" gutterBottom>
                Student Grade Analysis Report
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                {selectedStudentData?.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Date Range: {startDate ? startDate.toLocaleDateString() : 'N/A'} - {endDate ? endDate.toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generated on: {new Date().toLocaleDateString()}
              </Typography>

            </Box>
          </Paper>

          {/* Subject-wise Grades */}
          {gradesData.subjectAnalysis && Object.keys(gradesData.subjectAnalysis).length > 0 ? (
            Object.entries(gradesData.subjectAnalysis).map(([subjectName, subjectData]) => (
              <Paper key={subjectName} elevation={2} sx={{ p: 3, mb: 3 }} className="subject-section">
                <Typography variant="h5" gutterBottom>
                  📚 {subjectName}
                </Typography>
                
                {/* Summary Cards */}
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={12} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {subjectData.studentAverage?.toFixed(1) || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Student Average
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary">
                          {subjectData.classAverage?.toFixed(1) || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Class Average
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6">
                          {subjectData.grades?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Grades
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Chip 
                          label={subjectData.studentAverage >= subjectData.classAverage ? 'Above Average' : 'Below Average'}
                          color={subjectData.studentAverage >= subjectData.classAverage ? 'success' : 'warning'}
                          size="small"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Progress Graph for multiple grades */}
                {subjectData.grades && subjectData.grades.length > 1 && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      📈 Grade Progress Over Time
                    </Typography>
                    <Box sx={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={prepareChartData(subjectData.grades)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            domain={[0, 20]}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [value, 'Grade']}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="grade" 
                            stroke="#1976d2" 
                            strokeWidth={3}
                            dot={{ fill: '#1976d2', strokeWidth: 2, r: 6 }}
                            name="Grade"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}

                {/* Grades Table */}
                <Typography variant="h6" gutterBottom>
                  📋 All Grades
                </Typography>
                <TableContainer>
                  <Table className="grade-table" size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Grade</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell><strong>Teacher</strong></TableCell>
                        <TableCell><strong>vs Class Avg</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectData.grades?.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={grade.value}
                              size="small"
                              color={grade.value >= subjectData.classAverage ? 'success' : grade.value >= subjectData.classAverage * 0.8 ? 'warning' : 'error'}
                            />
                          </TableCell>
                          <TableCell>{grade.description || '-'}</TableCell>
                          <TableCell>{grade.teacher?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={grade.value >= subjectData.classAverage ? '↗️ Above' : '↘️ Below'}
                              size="small"
                              variant="outlined"
                              color={grade.value >= subjectData.classAverage ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No grades found for this period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))
          ) : (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No grades found for the selected period
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try selecting a different time period or check if grades have been recorded
              </Typography>
            </Paper>
          )}
        </div>
      )}

      {/* Selection prompt */}
      {!selectedStudent || !startDate || !endDate ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a student and date range to view grade analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a student and select start/end dates above to generate a detailed grade report with class comparisons and progress charts
          </Typography>
        </Paper>
      ) : null}
    </Container>
  );
};

export default StudentStats;
