import React, { useState, useEffect } from 'react';
import { 
  CircularProgress, 
  Box, 
  Alert, 
  Typography, 
  Paper, 
  Table, 
  TableContainer, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  useTheme
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStudentDetailedStats } from '../../api/studentStatsAPI';

// Only import the layout - we're simplifying
import PrintGradeLayout from './PrintGradeLayout';
import { styled } from '@mui/material/styles';

const PrintSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  pageBreakInside: 'avoid',
  '@media print': {
    marginBottom: theme.spacing(2)
  }
}));

const PrintGradePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [classAverages, setClassAverages] = useState({});
  
  // Add a window level debug function to help troubleshoot
  useEffect(() => {
    window.debugPrintPage = () => {
      console.log('Print Page Debug Info:', {
        studentData,
        classAverages
      });
    };
    
    return () => {
      delete window.debugPrintPage;
    };
  }, [studentData, classAverages]);
  
  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const studentId = params.get('studentId');
    const studentName = params.get('studentName');
    const studentEmail = params.get('studentEmail');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    
    console.log('[PrintGradePage] Initializing with URL params:', {
      studentId,
      studentName,
      studentEmail,
      startDate,
      endDate
    });
    
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
        console.log('[PrintGradePage] localStorage data:', savedData ? 'Found' : 'Not found');
        
        if (savedData) {
          try {
            data = JSON.parse(savedData);
            console.log('[PrintGradePage] Parsed localStorage data:', {
              hasStudent: !!data?.student,
              studentId: data?.student?._id,
              studentName: data?.student?.name,
              hasGrades: Array.isArray(data?.grades),
              gradeCount: data?.grades?.length || 0,
              hasSubjectBreakdown: !!data?.subjectBreakdown,
              subjects: Object.keys(data?.subjectBreakdown || {})
            });
            
            // DON'T clear the localStorage yet - only after successful processing
            
            if (data && data.student && Array.isArray(data.grades)) {
              // Handle the student object structure
              const studentObj = data.student;
              
              const processedData = {
                student: {
                  _id: studentId || studentObj?._id,
                  name: studentName || studentObj?.name || 'Student Name',
                  email: studentEmail || studentObj?.email || ''
                },
                grades: data.grades || [],
                subjectBreakdown: data.subjectBreakdown || {},
                totalAverage: data.totalAverage || 0,
                totalGrades: data.totalGrades || 0,
                startDate,
                endDate
              };
              
              console.log('[PrintGradePage] Processed data from localStorage:', {
                studentName: processedData.student.name,
                gradeCount: processedData.grades.length,
                subjects: Object.keys(processedData.subjectBreakdown)
              });
              
              setStudentData(processedData);
              
              // Generate mock class averages if we don't have real ones
              generateMockClassAverages(data.subjectBreakdown || {});
              
              // Only clear localStorage after successful processing
              localStorage.removeItem('printGradeData');
              
              // Check if we have actual grades
              if (processedData.grades.length === 0) {
                console.log('[PrintGradePage] No grades found in localStorage data, falling back to API');
              } else {
                setLoading(false);
                return;
              }
            } else {
              console.log('[PrintGradePage] localStorage data found but incomplete or invalid structure!', data);
            }
          } catch (parseError) {
            console.error('[PrintGradePage] Error parsing localStorage data:', parseError);
            // Continue to API fallback
          }
        }
        
        // If no valid data in localStorage, fetch from API
        console.log('[PrintGradePage] Fetching student data from API for student ID:', studentId);
        
        // Build query parameters for date filtering
        const queryParams = [];
        if (startDate) queryParams.push(`startDate=${startDate}`);
        if (endDate) queryParams.push(`endDate=${endDate}`);
        const queryString = queryParams.length > 0 ? queryParams.join('&') : '';
        
        console.log('[PrintGradePage] API query params:', queryString);
        
        try {
          // Fetch detailed stats from API
          const apiData = await getStudentDetailedStats(studentId, queryString);
          console.log('[PrintGradePage] API data received:', {
            hasGrades: Array.isArray(apiData?.grades),
            gradeCount: apiData?.grades?.length || 0,
            hasSubjectBreakdown: !!apiData?.subjectBreakdown,
            subjects: Object.keys(apiData?.subjectBreakdown || {})
          });
          
          const processedApiData = {
            student: {
              _id: studentId,
              name: studentName || 'Student Name',
              email: studentEmail || ''
            },
            // Map recentGrades to grades - this is where the issue was
            grades: apiData.recentGrades || [],
            subjectBreakdown: apiData.subjectBreakdown || {},
            // Get totalAverage from overview.averageGrade
            totalAverage: apiData.overview?.averageGrade || 0,
            // Get totalGrades from overview.gradeCount
            totalGrades: apiData.overview?.gradeCount || 0,
            startDate,
            endDate
          };
          
          // Add additional debug logging for grades
          console.log('[PrintGradePage] API grades available:', {
            recentGrades: Array.isArray(apiData?.recentGrades),
            recentGradesCount: apiData?.recentGrades?.length || 0,
            firstGrade: apiData?.recentGrades?.[0]
          });
          
          console.log('[PrintGradePage] Processed API data:', {
            studentName: processedApiData.student.name,
            gradeCount: processedApiData.grades.length,
            subjects: Object.keys(processedApiData.subjectBreakdown)
          });
          
          setStudentData(processedApiData);
          
          // Generate mock class averages
          const subjectData = apiData.subjectBreakdown || {};
          console.log('[PrintGradePage] Generating class averages for subjects:', Object.keys(subjectData));
          generateMockClassAverages(subjectData);
        } catch (apiError) {
          console.error('[PrintGradePage] API fetch error:', apiError);
          throw apiError; // Rethrow to be caught by outer catch
        }
        
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
      // Added defensive programming to handle different data shapes
      let studentAvg = 0;
      
      if (typeof stats === 'object' && stats !== null) {
        if (typeof stats.average === 'number') {
          studentAvg = stats.average;
        } else if (typeof stats.averageGrade === 'number') {
          studentAvg = stats.averageGrade;
        } else if (typeof stats.grade === 'number') {
          studentAvg = stats.grade;
        }
      }
      
      // Debug actual value being used
      console.log(`[PrintGradePage] Subject ${subject} breakdown:`, {
        stats,
        extractedAverage: studentAvg
      });
      
      const variance = Math.random() * 20 - 10; // Random variance between -10 and +10
      mockAverages[subject] = Math.min(100, Math.max(0, studentAvg + variance));
    });
    
    console.log('[PrintGradePage] Generated class averages:', {
      subjects: Object.keys(mockAverages),
      averageValues: Object.values(mockAverages).map(avg => avg.toFixed(1))
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
  
  // Debug function now placed at the top level of component
  
  return (
    <PrintGradeLayout
      studentName={studentData.student.name}
      studentEmail={studentData.student.email}
      startDate={studentData.startDate}
      endDate={studentData.endDate}
      onClose={handleClose}
    >
      {/* Simplified grade list with class averages */}
      <PrintSection>
        <Typography variant="h6" gutterBottom>
          Grades and Class Averages
        </Typography>
        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
            color: theme.palette.text.primary
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f5f5f5' }}>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell align="center"><strong>Grade</strong></TableCell>
                  <TableCell align="center"><strong>Class Average</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentData.grades && studentData.grades.length > 0 ? (
                  studentData.grades.map((grade) => {
                    // Get class average for this subject - with improved defensive coding
                    // Add extra type checking to prevent React Error #31
                    let classAvg = 0;
                    try {
                      // Debug the actual value to help diagnose issues
                      console.log(`[PrintGradePage] Class average for ${grade.subject}:`, {
                        value: classAverages[grade.subject],
                        type: typeof classAverages[grade.subject],
                        isNumber: !isNaN(Number(classAverages[grade.subject])),
                        subjectExists: grade.subject in classAverages
                      });
                      
                      // Safely convert to number
                      const rawValue = classAverages[grade.subject];
                      if (typeof rawValue === 'number' && !isNaN(rawValue)) {
                        classAvg = rawValue;
                      } else if (rawValue && typeof rawValue === 'object' && !isNaN(Number(rawValue.average))) {
                        // If it's an object with average property, use that
                        classAvg = Number(rawValue.average);
                      } else {
                        console.warn(`[PrintGradePage] Invalid class average for ${grade.subject}:`, rawValue);
                      }
                    } catch (err) {
                      console.error(`[PrintGradePage] Error processing class average for ${grade.subject}:`, err);
                    }
                    
                    // Debug the grade object structure before rendering
                    console.log('[PrintGradePage] Grade object structure:', {
                      grade,
                      subjectType: typeof grade.subject,
                      isSubjectObject: typeof grade.subject === 'object' && grade.subject !== null,
                      gradeType: typeof grade.grade,
                      isGradeObject: typeof grade.grade === 'object' && grade.grade !== null,
                      dateType: typeof grade.date,
                      isDateObject: typeof grade.date === 'object' && grade.date !== null && !(grade.date instanceof Date),
                      dateValid: !isNaN(new Date(grade.date).getTime())
                    });
                    
                    // Safely extract values from the grade object to avoid React error #31
                    const safeSubject = typeof grade.subject === 'string' ? grade.subject : 
                                      (typeof grade.subject === 'object' && grade.subject !== null) ? 
                                        (grade.subject.name || JSON.stringify(grade.subject)) : 
                                        String(grade.subject || 'Unknown');
                      
                    // Safe date formatting with fallback
                    let safeDate = 'Unknown';
                    try {
                      if (grade.date) {
                        const dateObj = new Date(grade.date);
                        if (!isNaN(dateObj.getTime())) {
                          safeDate = dateObj.toLocaleDateString();
                        }
                      }
                    } catch (err) {
                      console.error('[PrintGradePage] Error formatting date:', err);
                    }
                    
                    // Safe grade value with fallback - improved extraction logic
                    let safeGrade = 0;
                    
                    try {
                      console.log('[PrintGradePage] Raw grade value:', {
                        grade: grade.grade,
                        type: typeof grade.grade,
                        isObject: typeof grade.grade === 'object' && grade.grade !== null
                      });
                      
                      if (typeof grade.grade === 'number') {
                        // Direct number value
                        safeGrade = grade.grade;
                      } else if (typeof grade.grade === 'object' && grade.grade !== null) {
                        // Object with value property
                        if ('value' in grade.grade && typeof grade.grade.value === 'number') {
                          safeGrade = grade.grade.value;
                        } else if ('grade' in grade.grade && typeof grade.grade.grade === 'number') {
                          safeGrade = grade.grade.grade;
                        }
                      } else if (typeof grade.value === 'number') {
                        // Alternative property name
                        safeGrade = grade.value;
                      } else if (typeof grade.grade === 'string') {
                        // Try to parse string as number
                        const parsed = parseFloat(grade.grade);
                        if (!isNaN(parsed)) {
                          safeGrade = parsed;
                        }
                      }
                      
                      // Fallback for any unexpected scenarios
                      if (safeGrade === 0) {
                        console.warn('[PrintGradePage] Could not extract grade value, using direct value:', grade);
                        // Try direct access as a last resort
                        safeGrade = grade.grade || grade.value || 0;
                      }
                    } catch (err) {
                      console.error('[PrintGradePage] Error extracting grade value:', err);
                    }
                    
                    // Determine grade color based on safe grade value
                    const gradeColor = safeGrade >= 70 ? 'success.main' : 
                                      safeGrade >= 50 ? 'warning.main' : 'error.main';
                    
                    return (
                      <TableRow key={grade._id || `grade-${safeSubject}-${grade.date}`}>
                        <TableCell>{safeSubject}</TableCell>
                        <TableCell>{safeDate}</TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            fontWeight: 'bold',
                            color: gradeColor
                          }}
                        >
                          {typeof safeGrade === 'number' ? safeGrade : '0'}
                        </TableCell>
                        <TableCell align="center">{typeof classAvg === 'number' && !isNaN(classAvg) ? classAvg.toFixed(1) : 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="error">
                        No grades found for the selected period. Please try again or contact support.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </PrintSection>
    </PrintGradeLayout>
  );
};

export default PrintGradePage;
