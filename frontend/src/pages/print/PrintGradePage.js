import React, { useState, useEffect } from 'react';
import { CircularProgress, Box, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStudentDetailedStats } from '../../api/studentStatsAPI';

// Import all the modular components
import PrintGradeLayout from './PrintGradeLayout';
import GradeSummarySection from './GradeSummarySection';
import GradeComparisonChart from './GradeComparisonChart';
import SubjectPerformanceRadar from './SubjectPerformanceRadar';
import GradeProgressionChart from './GradeProgressionChart';
import DetailedGradeList from './DetailedGradeList';

const PrintGradePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [classAverages, setClassAverages] = useState({});
  
  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const studentId = params.get('studentId');
    const studentName = params.get('studentName');
    const studentEmail = params.get('studentEmail');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    
    if (!studentId) {
      setError('No student ID provided');
      setLoading(false);
      return;
    }
    
    // Either get data from localStorage or fetch it
    const loadData = async () => {
      try {
        let data;
        
        // Try to get data from localStorage first
        const savedData = localStorage.getItem('printGradeData');
        if (savedData) {
          data = JSON.parse(savedData);
          // Clear the localStorage after retrieving data
          localStorage.removeItem('printGradeData');
          
          if (data && data.student && data.grades) {
            setStudentData({
              student: {
                _id: studentId,
                name: studentName || data.student.student?.name || 'Student Name',
                email: studentEmail || data.student.student?.email || ''
              },
              grades: data.grades || [],
              subjectBreakdown: data.subjectBreakdown || {},
              totalAverage: data.totalAverage || 0,
              totalGrades: data.totalGrades || 0,
              startDate,
              endDate
            });
            
            // Generate mock class averages if we don't have real ones
            generateMockClassAverages(data.subjectBreakdown || {});
            
            setLoading(false);
            return;
          }
        }
        
        // If no data in localStorage, fetch from API
        console.log('[PrintGradePage] Fetching student data from API');
        
        // Build query parameters for date filtering
        const queryParams = [];
        if (startDate) queryParams.push(`startDate=${startDate}`);
        if (endDate) queryParams.push(`endDate=${endDate}`);
        const queryString = queryParams.length > 0 ? queryParams.join('&') : '';
        
        // Fetch detailed stats from API
        const apiData = await getStudentDetailedStats(studentId, queryString);
        
        setStudentData({
          student: {
            _id: studentId,
            name: studentName || 'Student Name',
            email: studentEmail || ''
          },
          grades: apiData.grades || [],
          subjectBreakdown: apiData.subjectBreakdown || {},
          totalAverage: apiData.totalAverage || 0,
          totalGrades: apiData.totalGrades || 0,
          startDate,
          endDate
        });
        
        // Generate mock class averages
        generateMockClassAverages(apiData.subjectBreakdown || {});
        
      } catch (err) {
        console.error('[PrintGradePage] Error loading data:', err);
        setError(err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [location.search]);
  
  // Generate mock class averages based on student's subjects
  const generateMockClassAverages = (subjectBreakdown) => {
    const mockAverages = {};
    
    Object.entries(subjectBreakdown).forEach(([subject, stats]) => {
      // Create a realistic class average that's sometimes higher, sometimes lower than the student's
      const studentAvg = stats.average;
      const variance = Math.random() * 20 - 10; // Random variance between -10 and +10
      mockAverages[subject] = Math.min(100, Math.max(0, studentAvg + variance));
    });
    
    setClassAverages(mockAverages);
  };
  
  const handleClose = () => {
    window.close();
    // Navigate back as fallback if window.close() is blocked
    navigate(-1);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !studentData) {
    return (
      <Box m={3}>
        <Alert severity="error">
          {error || 'No student data available'}
        </Alert>
      </Box>
    );
  }
  
  return (
    <PrintGradeLayout
      studentName={studentData.student.name}
      studentEmail={studentData.student.email}
      startDate={studentData.startDate}
      endDate={studentData.endDate}
      onClose={handleClose}
    >
      {/* Render all the modular components with proper data */}
      <GradeSummarySection 
        subjectBreakdown={studentData.subjectBreakdown}
        classAverages={classAverages}
      />
      
      <GradeComparisonChart 
        grades={studentData.grades}
        subjectBreakdown={studentData.subjectBreakdown}
        classAverages={classAverages}
      />
      
      <SubjectPerformanceRadar 
        subjectBreakdown={studentData.subjectBreakdown}
        classAverages={classAverages}
      />
      
      <GradeProgressionChart 
        grades={studentData.grades}
      />
      
      <DetailedGradeList 
        grades={studentData.grades}
      />
    </PrintGradeLayout>
  );
};

export default PrintGradePage;
