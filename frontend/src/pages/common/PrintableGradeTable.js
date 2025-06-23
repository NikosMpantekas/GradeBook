import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Grid,
  Button,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Print as PrintIcon, 
  SaveAlt as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar 
} from 'recharts';

// Styled components for print-specific elements
const PrintableContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#ffffff',
  padding: theme.spacing(4),
  margin: 'auto',
  maxWidth: '1000px',
  '@media print': {
    margin: 0,
    padding: theme.spacing(1),
    width: '100%',
    boxShadow: 'none',
    pageBreakInside: 'avoid'
  }
}));

const PrintHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  '@media print': {
    marginBottom: theme.spacing(2)
  }
}));

const PrintFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  '@media print': {
    fontSize: '0.7rem'
  }
}));

const PrintSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  pageBreakInside: 'avoid',
  '@media print': {
    marginBottom: theme.spacing(2)
  }
}));

const PrintControls = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  color: 'white',
  '@media print': {
    display: 'none'
  }
}));

const PrintableGradeTable = ({ 
  student, 
  startDate, 
  endDate, 
  grades = [], 
  subjectBreakdown = {},
  classAverages = {},
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const printContainerRef = useRef(null);

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle print action
  const handlePrint = () => {
    window.print();
  };

  // Handle save as PDF
  const handleSaveAsPDF = () => {
    // Modern browsers have PDF saving built into the print dialog
    window.print();
  };

  // Prepare data for bar chart - grade distribution
  const prepareBarChartData = () => {
    if (!grades || grades.length === 0) return [];
    
    // Group grades by subject
    const subjectMap = {};
    
    grades.forEach(grade => {
      if (!subjectMap[grade.subject]) {
        subjectMap[grade.subject] = {
          subject: grade.subject,
          studentAverage: subjectBreakdown[grade.subject]?.average || 0,
          classAverage: classAverages[grade.subject] || 0
        };
      }
    });
    
    return Object.values(subjectMap);
  };

  // Prepare data for line chart - grade progression
  const prepareLineChartData = () => {
    if (!grades || grades.length === 0) return [];
    
    // Sort grades by date
    const sortedGrades = [...grades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return sortedGrades.map(grade => ({
      date: new Date(grade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      grade: grade.grade,
      subject: grade.subject
    }));
  };

  // Prepare data for radar chart - subject coverage
  const prepareRadarChartData = () => {
    if (!subjectBreakdown || Object.keys(subjectBreakdown).length === 0) return [];
    
    return Object.entries(subjectBreakdown).map(([subject, stats]) => ({
      subject,
      studentScore: stats.average,
      classAverage: classAverages[subject] || 0,
      fullMark: 100
    }));
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Print Controls - visible only on screen */}
      <PrintControls>
        <Typography variant="h6">Grade Report</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<SaveIcon />} 
            onClick={handleSaveAsPDF}
            sx={{ mr: 1 }}
          >
            Save as PDF
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<CloseIcon />} 
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </PrintControls>

      {/* Main Printable Content */}
      <PrintableContainer ref={printContainerRef}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={8}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <PrintHeader>
              <Typography variant="h4" gutterBottom>
                Academic Grade Report
              </Typography>
              <Typography variant="h5" gutterBottom>
                {student?.student?.name || 'Student Name'}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {student?.student?.email || 'Student Email'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Period: {formatDate(startDate)} - {formatDate(endDate)}
              </Typography>
            </PrintHeader>
          
            <Divider sx={{ my: 3 }} />

            {/* Grade Summary */}
            <PrintSection>
              <Typography variant="h6" gutterBottom>
                Grade Summary
              </Typography>
              <Paper elevation={0} variant="outlined">
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Subject</strong></TableCell>
                        <TableCell align="center"><strong>Average Grade</strong></TableCell>
                        <TableCell align="center"><strong>Class Average</strong></TableCell>
                        <TableCell align="center"><strong>Difference</strong></TableCell>
                        <TableCell align="center"><strong>Grade Count</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(subjectBreakdown || {}).map(([subject, stats]) => {
                        const classAvg = classAverages[subject] || 0;
                        const difference = stats.average - classAvg;
                        
                        return (
                          <TableRow key={subject}>
                            <TableCell>{subject}</TableCell>
                            <TableCell align="center">{stats.average.toFixed(1)}</TableCell>
                            <TableCell align="center">{classAvg.toFixed(1)}</TableCell>
                            <TableCell 
                              align="center"
                              sx={{ 
                                color: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'text.primary',
                                fontWeight: Math.abs(difference) > 10 ? 'bold' : 'normal'
                              }}
                            >
                              {difference > 0 ? '+' : ''}{difference.toFixed(1)}
                            </TableCell>
                            <TableCell align="center">{stats.count}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </PrintSection>

            {/* Grade Comparison Graph */}
            <PrintSection>
              <Typography variant="h6" gutterBottom>
                Grade Comparison by Subject
              </Typography>
              <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={prepareBarChartData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="studentAverage" name="Student Average" fill="#8884d8" />
                    <Bar dataKey="classAverage" name="Class Average" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </PrintSection>

            {/* Subject Performance Radar */}
            <PrintSection>
              <Typography variant="h6" gutterBottom>
                Subject Performance Overview
              </Typography>
              <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={prepareRadarChartData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Student Score" dataKey="studentScore" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Class Average" dataKey="classAverage" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>
            </PrintSection>

            {/* Grade Progression */}
            <PrintSection>
              <Typography variant="h6" gutterBottom>
                Grade Progression Over Time
              </Typography>
              <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={prepareLineChartData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="grade" name="Grade" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </PrintSection>

            {/* Detailed Grade List */}
            <PrintSection>
              <Typography variant="h6" gutterBottom>
                Detailed Grade List
              </Typography>
              <Paper elevation={0} variant="outlined">
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Subject</strong></TableCell>
                        <TableCell align="center"><strong>Grade</strong></TableCell>
                        <TableCell><strong>Comment</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(grades || []).map((grade) => (
                        <TableRow key={grade._id}>
                          <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                          <TableCell>{grade.subject}</TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              fontWeight: 'bold',
                              color: grade.grade >= 70 ? 'success.main' : grade.grade >= 50 ? 'warning.main' : 'error.main'
                            }}
                          >
                            {grade.grade}
                          </TableCell>
                          <TableCell>{grade.comment || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {(!grades || grades.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No grades found for the selected period</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </PrintSection>
            
            <Divider sx={{ my: 3 }} />

            <PrintFooter>
              <Typography variant="body2">
                This report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Typography>
              <Typography variant="caption">
                GradeBook Report System | Academic Year 2025
              </Typography>
            </PrintFooter>
          </>
        )}
      </PrintableContainer>
    </Box>
  );
};

export default PrintableGradeTable;
