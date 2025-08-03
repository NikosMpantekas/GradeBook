import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_URL } from '../../config/appConfig';

const StudentStatsPrint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get parameters from URL state
  const { selectedStudent, selectedStudentData, startDate, endDate } = location.state || {};

  useEffect(() => {
    if (!selectedStudent || !startDate || !endDate) {
      navigate(-1); // Go back if missing required data
      return;
    }

    fetchGradeAnalysis();
  }, [selectedStudent, startDate, endDate]);

  const fetchGradeAnalysis = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/api/grades/student-period-analysis?studentId=${selectedStudent}&startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGradesData(data);
      } else {
        console.error('Failed to fetch grade analysis');
      }
    } catch (error) {
      console.error('Error fetching grade analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = () => {
    // Trigger browser's save as PDF
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh', p: 0 }}>
      {/* Print Controls - Hidden when printing */}
      <Box 
        className="no-print" 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid #ddd', 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'space-between',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Back to Analysis
        </Button>
        
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleSavePDF}
          >
            Save as PDF
          </Button>
        </Box>
      </Box>

      {/* Printable Content */}
      <Box sx={{ p: 4, maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" sx={{ mb: 1, color: 'black', fontWeight: 'bold' }}>
            Student Grade Analysis Report
          </Typography>
          <Typography variant="h5" sx={{ mb: 2, color: '#333' }}>
            {selectedStudentData?.name || 'Student Name'}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#666' }}>
            Period: {formatDate(startDate)} - {formatDate(endDate)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Generated on: {new Date().toLocaleDateString()}
          </Typography>
        </Box>

        {/* Grades by Subject */}
        {gradesData?.subjectAnalysis && Object.keys(gradesData.subjectAnalysis).length > 0 ? (
          Object.entries(gradesData.subjectAnalysis).map(([subjectName, subjectData]) => (
            <Box key={subjectName} sx={{ mb: 4 }}>
              {/* Subject Header */}
              <Typography variant="h6" sx={{ mb: 2, borderBottom: '2px solid #333', pb: 1, color: 'black' }}>
                {subjectName}
              </Typography>

              {/* Summary */}
              <Box sx={{ mb: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>Student Average:</Typography>
                  <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                    {subjectData.studentAverage?.toFixed(1) || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>Class Average:</Typography>
                  <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                    {subjectData.classAverage?.toFixed(1) || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>Total Grades:</Typography>
                  <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                    {subjectData.grades?.length || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>Performance:</Typography>
                  <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                    {subjectData.studentAverage >= subjectData.classAverage ? 'Above Average' : 'Below Average'}
                  </Typography>
                </Box>
              </Box>

              {/* Grades Table */}
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small" sx={{ border: '1px solid #ddd' }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'black', border: '1px solid #ddd' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'black', border: '1px solid #ddd' }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'black', border: '1px solid #ddd' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'black', border: '1px solid #ddd' }}>Teacher</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'black', border: '1px solid #ddd' }}>vs Class Avg</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjectData.grades?.map((grade, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ border: '1px solid #ddd', color: 'black' }}>
                          {formatDate(grade.date)}
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', color: 'black', fontWeight: 'bold' }}>
                          {grade.value}
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', color: 'black' }}>
                          {grade.description || '-'}
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', color: 'black' }}>
                          {grade.teacher?.name || 'Unknown'}
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', color: 'black' }}>
                          {grade.value >= subjectData.classAverage ? 'Above' : 'Below'}
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ border: '1px solid #ddd', color: '#666' }}>
                          No grades found for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))
        ) : (
          <Box textAlign="center" sx={{ py: 4 }}>
            <Typography variant="h6" sx={{ color: '#666' }}>
              No grades found for the selected period
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ddd', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#999' }}>
            GradeBook System - Student Grade Analysis Report
          </Typography>
        </Box>
      </Box>

      {/* Print-specific CSS */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          * {
            color: black !important;
            background: transparent !important;
          }
          
          table {
            border-collapse: collapse !important;
          }
          
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
          
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </Box>
  );
};

export default StudentStatsPrint;
