import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Avatar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Person as PersonIcon, Print as PrintIcon } from '@mui/icons-material';
import { getStudentDetailedStats } from '../../api/studentStatsAPI';
import PrintableGradeTable from './PrintableGradeTable';

const StudentGradeDetails = ({ 
  open, 
  onClose, 
  student 
}) => {
  const printWindowRef = useRef(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [classAverages, setClassAverages] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);

  useEffect(() => {
    if (open && student) {
      fetchStudentDetails();
    }
  }, [open, student]);

  // Fetch detailed student statistics
  const fetchStudentDetails = async () => {
    if (!student) return;
    
    try {
      setDetailsLoading(true);
      setDetailsError('');
      
      console.log('[StudentGradeDetails] Fetching detailed stats for student:', student.student._id);
      
      // Pass date parameters if available
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      
      const data = await getStudentDetailedStats(student.student._id, params.toString());
      
      console.log('[StudentGradeDetails] Received detailed student stats:', data);
      setStudentDetails(data);
    } catch (error) {
      console.error('[StudentGradeDetails] Error fetching detailed student stats:', error);
      setDetailsError(error.message || 'Failed to load detailed student statistics');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDateChange = () => {
    // Refetch with new date range
    fetchStudentDetails();
  };

  const handlePrintableTable = () => {
    console.log('[StudentGradeDetails] Generating printable table for student:', student?.student?.name);
    
    // Mock class averages data - in a real implementation, this would come from an API call
    // Ideally, we'd add a new endpoint to get class averages for comparison
    const mockClassAverages = {};
    
    // Generate mock class averages based on student's subjects
    // In a real implementation, these would come from the backend
    if (studentDetails && studentDetails.subjectBreakdown) {
      Object.keys(studentDetails.subjectBreakdown).forEach(subject => {
        // Create a realistic class average that's sometimes higher, sometimes lower than the student's
        const studentAvg = studentDetails.subjectBreakdown[subject].average;
        const variance = Math.random() * 20 - 10; // Random variance between -10 and +10
        mockClassAverages[subject] = Math.min(100, Math.max(0, studentAvg + variance));
      });
    }
    
    setClassAverages(mockClassAverages);
    setShowPrintPreview(true);
    
    // In a production app, you might want to open this in a new window
    // const printWindow = window.open('', '_blank', 'width=1000,height=800');
    // printWindowRef.current = printWindow;
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
  };
  
  // If print preview is active, show the printable table component
  if (showPrintPreview && studentDetails) {
    return (
      <PrintableGradeTable 
        student={student}
        startDate={startDate}
        endDate={endDate}
        grades={studentDetails.grades}
        subjectBreakdown={studentDetails.subjectBreakdown}
        classAverages={classAverages}
        onClose={handleClosePrintPreview}
      />
    );
  }
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {student?.student?.name || 'Student'} - Grade Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student?.student?.email || ''}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrintableTable}
          >
            Printable Table
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Period Selection */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Select Period
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  onClick={handleDateChange}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  Apply
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Box>

        {/* Student Details Display */}
        {detailsError ? (
          <Alert severity="error">{detailsError}</Alert>
        ) : detailsLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : studentDetails ? (
          <Grid container spacing={3}>
            {/* Overview */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Grade Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={1}>
                    <Typography variant="h4" color="white">
                      {studentDetails.overview?.gradeCount || 0}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Total Grades
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={1}>
                    <Typography variant="h4" color="white">
                      {studentDetails.overview?.averageGrade || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Average
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={1}>
                    <Typography variant="h4" color="white">
                      {Object.keys(studentDetails.subjectBreakdown || {}).length}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Subjects
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Subject Breakdown */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Subject Performance
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Grades</TableCell>
                      <TableCell align="center">Average</TableCell>
                      <TableCell align="center">Highest</TableCell>
                      <TableCell align="center">Lowest</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(studentDetails.subjectBreakdown || {}).map(([subject, stats]) => (
                      <TableRow key={subject}>
                        <TableCell>{subject}</TableCell>
                        <TableCell align="center">{stats.count}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={stats.average}
                            size="small"
                            color={stats.average >= 70 ? 'success' : stats.average >= 50 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="center">{stats.highest}</TableCell>
                        <TableCell align="center">{stats.lowest}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Individual Grades List */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Individual Grades
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Comment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentDetails.grades?.map((grade) => (
                      <TableRow key={grade._id}>
                        <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                        <TableCell>{grade.subject}</TableCell>
                        <TableCell>
                          <Chip
                            label={grade.grade}
                            size="small"
                            color={grade.grade >= 70 ? 'success' : grade.grade >= 50 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{grade.comment || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!studentDetails.grades || studentDetails.grades.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No grades found for the selected period</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">Select a student to view detailed grades</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentGradeDetails;
