import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton
} from '@mui/material';
import { 
  Close as CloseIcon,
  Print as PrintIcon, 
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getStudentDetailedStats } from '../../api/studentStatsAPI';

// Helper function to format dates for API
const formatDateForApi = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

const StudentGradeDetails = ({ open, onClose, student }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);

  useEffect(() => {
    if (open && student) {
      fetchStudentDetails();
    }
  }, [open, student, startDate, endDate]);

  const fetchStudentDetails = async () => {
    if (!student?.student?._id) return;

    try {
      setDetailsLoading(true);
      setDetailsError('');
      
      // Build query parameters for date filtering
      const queryParams = [];
      if (startDate) queryParams.push(`startDate=${formatDateForApi(startDate)}`);
      if (endDate) queryParams.push(`endDate=${formatDateForApi(endDate)}`);
      
      const queryString = queryParams.length > 0 ? queryParams.join('&') : '';
      
      console.log('[StudentGradeDetails] Fetching details for student:', student.student._id);
      console.log('[StudentGradeDetails] With query params:', queryString);
      
      const data = await getStudentDetailedStats(student.student._id, queryString);
      setStudentDetails(data);
    } catch (error) {
      console.error('[StudentGradeDetails] Error fetching student details:', error);
      setDetailsError(error.message || 'Failed to load student details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    fetchStudentDetails();
  };

  const handlePrintableTable = () => {
    if (!student?.student?._id || !studentDetails) return;

    // Generate query parameters for the new window
    const params = new URLSearchParams();
    params.append('studentId', student.student._id);
    params.append('studentName', student.student.name);
    params.append('studentEmail', student.student.email || '');
    
    if (startDate) params.append('startDate', formatDateForApi(startDate));
    if (endDate) params.append('endDate', formatDateForApi(endDate));
    
    // Store data in localStorage for the print page to access
    localStorage.setItem('printGradeData', JSON.stringify({
      student: student,
      grades: studentDetails.grades || [],
      subjectBreakdown: studentDetails.subjectBreakdown || {},
      totalAverage: studentDetails.totalAverage || 0,
      totalGrades: studentDetails.totalGrades || 0,
      startDate: startDate ? formatDateForApi(startDate) : null,
      endDate: endDate ? formatDateForApi(endDate) : null
    }));

    // Open a new window for printing
    const printWindow = window.open(`/print-grades?${params.toString()}`, '_blank', 'width=1200,height=800');
    if (printWindow) {
      printWindow.focus();
    } else {
      alert('Please allow pop-ups for this site to use the print feature.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid #eee', p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Student Grade Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {student ? (
          <>
            <Box mb={3}>
              <Card variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        {student?.student?.name || 'Student Name'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {student?.student?.email || 'No email available'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PrintIcon />}
                          onClick={handlePrintableTable}
                          disabled={detailsLoading || !studentDetails}
                        >
                          Printable Table
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            <Box mb={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Select Period
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    <Grid item xs={12} md={5}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Start Date"
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="End Date"
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        onClick={handleDateRangeChange}
                        sx={{ height: '40px' }}
                      >
                        Apply
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {detailsLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : detailsError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {detailsError}
              </Alert>
            ) : (
              <>
                {studentDetails ? (
                  <>
                    <Box mb={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Grade Summary
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Box textAlign="center" p={2}>
                                <Typography variant="h4" color="primary">
                                  {studentDetails.totalAverage?.toFixed(1) || '0.0'}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Average Grade
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box textAlign="center" p={2}>
                                <Typography variant="h4" color="primary">
                                  {studentDetails.totalGrades || '0'}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Total Grades
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box textAlign="center" p={2}>
                                <Typography variant="h4" color="primary">
                                  {Object.keys(studentDetails.subjectBreakdown || {}).length || '0'}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Subjects
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box mb={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Subject Performance
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Subject</TableCell>
                                  <TableCell align="center">Average Grade</TableCell>
                                  <TableCell align="center">Highest</TableCell>
                                  <TableCell align="center">Lowest</TableCell>
                                  <TableCell align="center">Count</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(studentDetails.subjectBreakdown || {}).map(([subject, stats]) => (
                                  <TableRow key={subject}>
                                    <TableCell component="th" scope="row">
                                      {subject}
                                    </TableCell>
                                    <TableCell align="center">{stats.average.toFixed(1)}</TableCell>
                                    <TableCell align="center">{stats.highest}</TableCell>
                                    <TableCell align="center">{stats.lowest}</TableCell>
                                    <TableCell align="center">{stats.count}</TableCell>
                                  </TableRow>
                                ))}
                                {Object.keys(studentDetails.subjectBreakdown || {}).length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center">
                                      No subject data available
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Individual Grades
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Subject</TableCell>
                                  <TableCell align="center">Grade</TableCell>
                                  <TableCell>Comment</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(studentDetails.grades || []).map((grade) => (
                                  <TableRow key={grade._id}>
                                    <TableCell>
                                      {new Date(grade.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{grade.subject}</TableCell>
                                    <TableCell 
                                      align="center"
                                      sx={{ 
                                        fontWeight: 'bold',
                                        color: grade.grade >= 70 ? 'success.main' : 
                                               grade.grade >= 50 ? 'warning.main' : 'error.main'
                                      }}
                                    >
                                      {grade.grade}
                                    </TableCell>
                                    <TableCell>{grade.comment || '-'}</TableCell>
                                  </TableRow>
                                ))}
                                {(studentDetails.grades || []).length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={4} align="center">
                                      No grades found for this student
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">
                    Select a date range to view student details
                  </Alert>
                )}
              </>
            )}
          </>
        ) : (
          <Alert severity="warning">
            No student selected
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentGradeDetails;
