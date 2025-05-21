import React, { useState, useEffect, Component } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserById } from '../../features/users/userSlice';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemAvatar,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  BarChart as BarChartIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format, subMonths } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Import actions
import { getUsers } from '../../features/users/userSlice';
import { getStudentGrades, getAllGrades } from '../../features/grades/gradeSlice';
import { getSubjects } from '../../features/subjects/subjectSlice';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Error boundary component to prevent white screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StudentProgress error boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error to console with additional debug information
    console.group('Student Progress Error Details:');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('Current URL:', window.location.href);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const errorStack = this.state.error?.stack || '';
      
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              There was an error displaying this student's information
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Error: {errorMessage}
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'left', whiteSpace: 'pre-wrap', mt: 2 }}>
                <details>
                  <summary>Error Details (for developers)</summary>
                  {errorStack}
                </details>
              </Typography>
            )}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon />} 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

const StudentProgress = () => {
  // Add state for error handling
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { studentId } = useParams(); // Get studentId from URL params
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Access current user from Redux store
  const { user } = useSelector((state) => state.auth);
  
  // Period selection for printing
  // We'll use these default values in our resetGradeStats function below
  
  const [periodFilter, setPeriodFilter] = useState({
    enabled: false,
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'), // Default to last 3 months
    endDate: format(new Date(), 'yyyy-MM-dd'), // Default to today,
  });
  
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const handlePrintDialogOpen = () => {
    setPrintDialogOpen(true);
  };

  const handlePrintDialogClose = () => {
    setPrintDialogOpen(false);
  };
  
  const handlePeriodChange = (event) => {
    setPeriodFilter({
      ...periodFilter,
      [event.target.name]: event.target.value,
    });
  };
  
  const handlePeriodToggle = (event) => {
    setPeriodFilter({
      ...periodFilter,
      enabled: event.target.checked,
    });
  };

  // Print function for student grades
  const handlePrintStudentGrades = () => {
    // Close the dialog first
    setPrintDialogOpen(false);
    
    // Prepare the print content
    const printWindow = window.open('', '_blank');
    
    // Filter grades by period if enabled
    let gradesToPrint = [...studentGrades];
    if (periodFilter.enabled && periodFilter.startDate && periodFilter.endDate) {
      gradesToPrint = studentGrades.filter(grade => {
        const gradeDate = new Date(grade.date);
        const startDate = new Date(periodFilter.startDate);
        const endDate = new Date(periodFilter.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day
        
        return gradeDate >= startDate && gradeDate <= endDate;
      });
    }
    
    if (!printWindow) {
      alert('Please allow popups to print student grades');
      return;
    }
    
    // Create a styled document for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Progress Report - ${selectedStudent?.name || 'Student'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1976d2;
              padding-bottom: 10px;
            }
            .student-info {
              display: flex;
              margin-bottom: 20px;
              align-items: center;
            }
            .stats-container {
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              margin-bottom: 20px;
            }
            .stat-box {
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 15px;
              width: 45%;
              margin-bottom: 15px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .stat-title {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
            }
            .avg-grade { color: #1976d2; }
            .high-grade { color: #4caf50; }
            .low-grade { color: #f44336; }
            .pass-rate { color: #ff9800; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .grade-value {
              font-weight: bold;
            }
            .pass {
              color: #4caf50;
            }
            .fail {
              color: #f44336;
            }
            .grade-tag {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 12px;
              color: white;
            }
            .pass-tag {
              background-color: #4caf50;
            }
            .fail-tag {
              background-color: #f44336;
            }
            .timestamp {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Progress Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="student-info">
            <h2>${selectedStudent?.name || 'Student'}</h2>
            <p>${selectedStudent?.email || 'No email provided'}</p>
          </div>
          
          <div class="stats-container">
            <div class="stat-box">
              <div class="stat-title">Average Grade</div>
              <div class="stat-value avg-grade">${gradeStats.averageGrade}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">Highest Grade</div>
              <div class="stat-value high-grade">${gradeStats.highestGrade}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">Lowest Grade</div>
              <div class="stat-value low-grade">${gradeStats.lowestGrade}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">Pass Rate</div>
              <div class="stat-value pass-rate">${gradeStats.passRate}%</div>
            </div>
          </div>
          
          <h3>Grade History</h3>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Grade</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${gradesToPrint.length > 0 ? 
                gradesToPrint.map(grade => `
                  <tr>
                    <td>${typeof grade.subject === 'object' ? grade.subject.name : 'Unknown Subject'}</td>
                    <td class="grade-value ${grade.value >= 50 ? 'pass' : 'fail'}">${grade.value}</td>
                    <td>${grade.description || '-'}</td>
                    <td>${format(new Date(grade.date), 'PP')}</td>
                    <td><span class="grade-tag ${grade.value >= 50 ? 'pass-tag' : 'fail-tag'}">${grade.value >= 50 ? 'Passed' : 'Failed'}</span></td>
                  </tr>
                `).join('') : 
                '<tr><td colspan="5" style="text-align: center;">No grades found for this student</td></tr>'
              }
            </tbody>
          </table>
          
          <div style="margin-top: 20px; font-size: 14px; color: #666;">
            ${periodFilter.enabled ? 
              `<p>Report Period: ${format(new Date(periodFilter.startDate), 'PP')} to ${format(new Date(periodFilter.endDate), 'PP')}</p>` : 
              '<p>Report Period: All time</p>'
            }
          </div>
          
          <div class="timestamp">
            <p>This is an official document from the Grade Tracker system.</p>
          </div>
        </body>
      </html>
    `);
    
    // Close the document for writing and trigger print
    printWindow.document.close();
    printWindow.focus();
    
    // Add slight delay to ensure styles are applied
    setTimeout(() => {
      printWindow.print();
      // Don't close the window automatically to allow manual printing
    }, 500);
  };
  
  // Get data from Redux store
  const { users, isLoading: usersLoading, isError: usersError } = useSelector((state) => state.users);
  const { grades, isLoading: gradesLoading, isError: gradesError } = useSelector((state) => state.grades);
  const { subjects, isLoading: subjectsLoading } = useSelector((state) => state.subjects);

  // Local state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeStats, setGradeStats] = useState({
    averageGrade: 'N/A',
    highestGrade: 'N/A',
    lowestGrade: 'N/A',
    passRate: 0,
    totalGrades: 0,
    gradesBySubject: {}
  });
  
  // Reset grade stats function
  const resetGradeStats = () => {
    try {
      setGradeStats({
        averageGrade: 'N/A',
        highestGrade: 'N/A',
        lowestGrade: 'N/A',
        passRate: 0,
        totalGrades: 0,
        gradesBySubject: {}
      });
    } catch (error) {
      logError('Error resetting grade stats', error);
    }
  };

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  // Fetch all users, grades for admin, and subjects
  useEffect(() => {
    if (user && user.role === 'admin') {
      dispatch(getUsers());
      dispatch(getAllGrades())
        .unwrap()
        .then(data => {
          console.log(`Successfully fetched ${data?.length || 0} grades for admin`);
        })
        .catch(error => {
          console.error('Error fetching all grades:', error);
        });
      dispatch(getSubjects());
    }
  }, [dispatch, user]);
  
  // Filter students based on search term
  useEffect(() => {
    if (Array.isArray(users)) {
      const students = users.filter(u => u && u.role === 'student');
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const filtered = students.filter(student => 
          student.name.toLowerCase().includes(search) || 
          (student.email && student.email.toLowerCase().includes(search))
        );
        setFilteredStudents(filtered);
      } else {
        setFilteredStudents(students);
      }
    }
  }, [users, searchTerm]);

  // Set selected student based on URL param with error handling
  useEffect(() => {
    // Create a flag to track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    const fetchStudentById = async (id) => {
      try {
        console.log('Directly fetching student with ID:', id);
        const result = await dispatch(getUserById(id)).unwrap();
        
        if (isMounted && result && result._id) {
          console.log('Successfully fetched student:', result.name);
          setSelectedStudent(result);
        } else if (isMounted) {
          console.error('Invalid student data returned');
          setSelectedStudent(null);
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        if (isMounted) {
          setSelectedStudent(null);
        }
      }
    };
    
    if (studentId) {
      try {
        // First, check if student is in the existing users array
        if (Array.isArray(users) && users.length > 0) {
          const student = users.find(u => u && u._id === studentId);
          
          if (student && student.name) {
            console.log('Found student in users array:', student.name);
            setSelectedStudent(student);
          } else {
            // Student not found in array, fetch directly
            console.log('Student not found in existing users, fetching directly...');
            fetchStudentById(studentId);
          }
        } else if (usersLoading) {
          // Show loading state while users are being fetched
          console.log('Users are still loading, setting loading state');
        } else {
          // Users array is empty/undefined but not loading - direct fetch
          console.log('Users array is empty or not available, fetching student directly');
          fetchStudentById(studentId);
        }
      } catch (error) {
        console.error('Error in student selection logic:', error);
        setSelectedStudent(null);
      }
    } else {
      // No studentId from params, reset state
      setSelectedStudent(null);
    }

    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [dispatch, studentId, users, usersLoading]);

  // Add error logger function for debugging
  const logError = (message, error, additionalData = {}) => {
    console.group(`StudentProgress Error: ${message}`);
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    console.error('Additional Data:', additionalData);
    console.groupEnd();
  };
  
  // Function to display error to user (if possible outside error boundary)
  const displayErrorMessage = (error) => {
    // Only try to show error if we have access to the alert component
    try {
      setErrorMessage(`Error: ${error?.message || 'Unknown error occurred'}`);
      setShowError(true);
    } catch (displayError) {
      console.error('Failed to display error message:', displayError);
    }
  };
  
  // Filter grades for selected student
  useEffect(() => {
    try {
      if (selectedStudent && Array.isArray(grades)) {
        // Filter grades for this student
        let studentGradesList = [];
        try {
          studentGradesList = grades.filter(grade => {
            // Defensive null/undefined checks
            if (!grade) return false;
            if (!grade.student) return false;
            
            // Handle both object and string IDs
            try {
              const studentId = typeof grade.student === 'object' 
                ? (grade.student?._id || '') 
                : grade.student;
              return studentId === selectedStudent._id;
            } catch (idError) {
              logError('Error comparing student IDs', idError, { grade });
              return false;
            }
          });
        } catch (filterError) {
          logError('Error filtering student grades', filterError, { selectedStudent: selectedStudent?._id });
          displayErrorMessage(new Error(`Error loading grades for ${selectedStudent?.name || 'student'}: ${filterError.message}`));
          studentGradesList = [];
        }
        
        try {
          // Filter by subject if needed
          let filteredGrades = studentGradesList;
          if (subjectFilter) {
            filteredGrades = studentGradesList.filter(grade => {
              // Skip invalid entries
              if (!grade || !grade.subject) return false;
              
              const subjectId = typeof grade.subject === 'object' 
                ? (grade.subject?._id || '') 
                : grade.subject;
              return subjectId === subjectFilter;
            });
          }
          
          // Make sure dates are valid before sorting
          filteredGrades = filteredGrades.filter(grade => grade && grade.date);
          
          // Sort grades by date (most recent first)
          filteredGrades.sort((a, b) => {
            try {
              return new Date(b.date) - new Date(a.date);
            } catch (e) {
              console.error('Error sorting dates:', e);
              return 0; // Keep original order if date parsing fails
            }
          });
          
          setStudentGrades(filteredGrades);
          
          // Calculate statistics safely
          if (filteredGrades.length > 0) {
            try {
              // Extract valid grade values
              const gradeValues = filteredGrades
                .filter(g => g && typeof g.value === 'number')
                .map(g => g.value);
              
              // Only calculate if we have valid grades
              if (gradeValues.length > 0) {
                const sum = gradeValues.reduce((a, b) => a + b, 0);
                const avg = sum / gradeValues.length;
                const highest = Math.max(...gradeValues);
                const lowest = Math.min(...gradeValues);
                
                // Count passing grades (assuming passing is 50+)
                const passingGrades = gradeValues.filter(g => g >= 50).length;
                const passRate = (passingGrades / gradeValues.length) * 100;
                
                // Group grades by subject
                const subjectGrades = {};
                // Process each grade safely
                filteredGrades.forEach(grade => {
                  if (!grade || !grade.subject) return;
                  
                  // Get subject info
                  const subjectId = typeof grade.subject === 'object' ? grade.subject?._id : grade.subject;
                  const subjectName = typeof grade.subject === 'object' ? (grade.subject?.name || 'Unknown') : 'Unknown';
                  
                  // Initialize subject entry if needed
                  try {
                    if (!subjectGrades[subjectId]) {
                      subjectGrades[subjectId] = {
                        id: subjectId,
                        name: subjectName,
                        grades: [],
                        average: 0
                      };
                    }
                  } catch (err) {
                    logError('Error initializing subject entry', err, { subjectId, subjectName });
                    // Create a default entry if there's an error
                    subjectGrades[subjectId] = {
                      id: subjectId || 'unknown',
                      name: 'Unknown Subject',
                      grades: [],
                      average: 0
                    };
                  }
                  
                  // Add grade to subject and calculate average in a try-catch block
                  try {
                    // Only add valid numeric grades
                    if (typeof grade.value === 'number') {
                      subjectGrades[subjectId].grades.push(grade.value);
                      
                      // Calculate new average
                      const subjectSum = subjectGrades[subjectId].grades.reduce((a, b) => a + b, 0);
                      subjectGrades[subjectId].average = subjectSum / subjectGrades[subjectId].grades.length;
                    }
                  } catch (err) {
                    logError('Error processing grade for subject', err, { subjectId, grade: grade?.value });
                    // Set default average if calculation fails
                    subjectGrades[subjectId].average = 0;
                  }
                });
                
                // Update grade statistics state
                setGradeStats({
                  averageGrade: avg.toFixed(1),
                  highestGrade: highest,
                  lowestGrade: lowest,
                  passRate: passRate.toFixed(1),
                  totalGrades: gradeValues.length,
                  gradesBySubject: subjectGrades
                });
              } else {
                // No valid grades to calculate stats
                resetGradeStats();
              }
            } catch (error) {
              logError('Error calculating grade statistics', error, { studentId: selectedStudent?._id });
              displayErrorMessage(error);
              resetGradeStats();
            }
          } else {
            // No grades available
            resetGradeStats();
          }
        } catch (error) {
          logError('Error processing student grades', error, { studentId: selectedStudent?._id });
          displayErrorMessage(error);
          resetGradeStats();
        }
      }
    } catch (error) {
      logError('Error in student grades effect', error, { studentId: selectedStudent?._id });
      displayErrorMessage(error);
      resetGradeStats();
    }
  }, [selectedStudent, grades, subjectFilter]);

  // Handle student selection
  const handleSelectStudent = (student) => {
    navigate(`/app/admin/progress/${student._id}`);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle subject filter change
  const handleSubjectFilterChange = (e) => {
    setSubjectFilter(e.target.value);
  };

  // Handle back to student list
  const handleBackToList = () => {
    setSelectedStudent(null);
    navigate('/app/admin/progress');
  };

  // Prepare chart data
  const prepareSubjectChart = () => {
    if (!gradeStats || !gradeStats.gradesBySubject) {
      // Return empty chart data if gradeStats is not available
      return {
        labels: [],
        datasets: [{
          label: 'Average Grade by Subject',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }],
      };
    }
    
    // Make sure we have valid data
    const subjectData = gradeStats.gradesBySubject || {};
    const validSubjects = Object.values(subjectData).filter(s => s && s.name);
    const labels = validSubjects.map(s => s.name);
    const averages = validSubjects.map(s => s.average || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Average Grade by Subject',
          data: averages,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare grade distribution chart
  const prepareGradeDistributionChart = () => {
    // Count grades in each grade range
    const ranges = {
      'A (90-100)': 0,
      'B (80-89)': 0,
      'C (70-79)': 0,
      'D (60-69)': 0,
      'E (50-59)': 0,
      'F (0-49)': 0
    };
    
    // Make sure we have valid student grades
    if (!studentGrades || !Array.isArray(studentGrades)) {
      return {
        labels: Object.keys(ranges),
        datasets: [{
          label: 'Grade Distribution',
          data: Object.values(ranges),
          backgroundColor: [
            'rgba(75, 192, 92, 0.6)',  // A - Green
            'rgba(54, 162, 235, 0.6)', // B - Blue
            'rgba(255, 206, 86, 0.6)', // C - Yellow
            'rgba(255, 159, 64, 0.6)', // D - Orange
            'rgba(255, 99, 132, 0.6)', // E - Red
            'rgba(110, 110, 110, 0.6)' // F - Gray
          ],
        }],
      };
    }
    
    // Process valid grades
    studentGrades.forEach(grade => {
      if (!grade || typeof grade.value !== 'number') return;
      
      const value = grade.value;
      if (value >= 90) ranges['A (90-100)']++;
      else if (value >= 80) ranges['B (80-89)']++;
      else if (value >= 70) ranges['C (70-79)']++;
      else if (value >= 60) ranges['D (60-69)']++;
      else if (value >= 50) ranges['E (50-59)']++;
      else ranges['F (0-49)']++;
    });
    
    return {
      labels: Object.keys(ranges),
      datasets: [
        {
          label: 'Grade Distribution',
          data: Object.values(ranges),
          backgroundColor: [
            'rgba(75, 192, 92, 0.6)',  // A - Green
            'rgba(54, 162, 235, 0.6)', // B - Blue
            'rgba(255, 206, 86, 0.6)', // C - Yellow
            'rgba(255, 159, 64, 0.6)', // D - Orange
            'rgba(255, 99, 132, 0.6)', // E - Red
            'rgba(110, 110, 110, 0.6)' // F - Gray
          ],
          borderColor: [
            'rgba(75, 192, 92, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(110, 110, 110, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Check if data is loading or if there are errors
  const isLoading = usersLoading || gradesLoading || subjectsLoading;
  const isError = usersError || gradesError;
  
  // Add a try-catch wrapper for any rendering errors that might occur
  const safeRender = (component) => {
    try {
      return component;
    } catch (error) {
      logError('Error rendering component', error);
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error rendering this component. Please try refreshing the page.
        </Alert>
      );
    }
  };
  
  // Handle error dismissal
  const handleErrorClose = () => {
    setShowError(false);
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading student data..." />;
  }

  // Show error state
  if (isError) {
    return <ErrorState message="Failed to load student data" onRetry={() => {
      dispatch(getUsers());
      dispatch(getAllGrades());
      dispatch(getSubjects());
    }} />;
  }

  // Render student list if no student is selected
  if (!selectedStudent) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Student Progress Tracking
        </Typography>
        
        {/* Search and Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Search Students"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Student List */}
        <Paper sx={{ p: 0 }}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <React.Fragment key={student._id}>
                  <ListItemButton onClick={() => handleSelectStudent(student)}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={student.name} 
                      secondary={student.email || 'No email provided'} 
                    />
                  </ListItemButton>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText 
                  primary="No students found" 
                  secondary={searchTerm ? "Try a different search term" : "No students have been added yet"} 
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>
    );
  }

  // Render student details when a student is selected
  // First, check if we have valid data to prevent white screen
  if (!selectedStudent || !selectedStudent._id) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading student data...
        </Typography>
      </Box>
    );
  }

  // First, check if we have valid data before rendering student details
  if (!selectedStudent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info">
          No student selected. Please select a student from the list.
        </Alert>
      </Box>
    );
  }

  // Additional validation to ensure student has all required fields
  if (!selectedStudent.name) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          Invalid student data. Please select a different student.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToList}
        >
          Return to Student List
        </Button>
      </Box>
    );
  }
  
  // Now we can be confident that the student data is valid for rendering
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Error Alert - Will show error messages outside the error boundary */}
      {showError && (
        <Alert 
          severity="error" 
          onClose={handleErrorClose} 
          sx={{ mb: 2 }}
        >
          {errorMessage}
        </Alert>
      )}
        {/* Header with back button and print button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={handleBackToList} 
            sx={{ mr: 2 }}
          aria-label="back to student list"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {selectedStudent.name}'s Progress
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PrintIcon />}
          onClick={handlePrintDialogOpen}
          sx={{ ml: 2 }}
        >
          Print Report
        </Button>
        
        {/* Print Options Dialog */}
        <Dialog open={printDialogOpen} onClose={handlePrintDialogClose}>
          <DialogTitle>Print Options</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={periodFilter.enabled}
                    onChange={handlePeriodToggle}
                    name="enabled"
                    color="primary"
                  />
                }
                label="Filter by Period"
              />
              
              <Box sx={{ mt: 2, ml: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Start Date:
                </Typography>
                <TextField
                  type="date"
                  name="startDate"
                  value={periodFilter.startDate}
                  onChange={handlePeriodChange}
                  fullWidth
                  disabled={!periodFilter.enabled}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  End Date:
                </Typography>
                <TextField
                  type="date"
                  name="endDate"
                  value={periodFilter.endDate}
                  onChange={handlePeriodChange}
                  fullWidth
                  disabled={!periodFilter.enabled}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePrintDialogClose}>Cancel</Button>
            <Button onClick={handlePrintStudentGrades} variant="contained">
              Print
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Student Info Card */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {selectedStudent.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {selectedStudent.email || 'No email provided'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Subject Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="subject-filter-label">Filter by Subject</InputLabel>
          <Select
            labelId="subject-filter-label"
            id="subject-filter"
            value={subjectFilter}
            onChange={handleSubjectFilterChange}
            label="Filter by Subject"
          >
            <MenuItem value="">
              <em>All Subjects</em>
            </MenuItem>
            {subjects && subjects.map((subject) => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Grade Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Average Grade */}
        <Grid item xs={12} sm={6} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Average Grade
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {gradeStats?.averageGrade || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Highest Grade */}
        <Grid item xs={12} sm={6} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Highest Grade
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {gradeStats?.highestGrade || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Lowest Grade */}
        <Grid item xs={12} sm={6} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Lowest Grade
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {gradeStats?.lowestGrade || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pass Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card raised>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Pass Rate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: (gradeStats?.passRate || 0) >= 70 ? 'success.main' : (gradeStats?.passRate || 0) >= 50 ? 'warning.main' : 'error.main' }}>
                {gradeStats?.passRate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Subject Performance Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Subject
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {gradeStats?.gradesBySubject && Object.keys(gradeStats.gradesBySubject).length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={prepareSubjectChart()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  No subject data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Grade Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Grade Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {studentGrades.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Pie 
                  data={prepareGradeDistributionChart()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  No grade data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Grades Table */}
      <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Grade History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentGrades.length > 0 ? (
                studentGrades.map((grade) => (
                  <TableRow key={grade._id} hover>
                    <TableCell>
                      {grade.subject && typeof grade.subject === 'object' 
                        ? (grade.subject.name || 'Unnamed Subject')
                        : 'Unknown Subject'}
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 'bold',
                          color: grade.value >= 50 ? 'success.main' : 'error.main',
                        }}
                      >
                        {grade.value}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {grade.description
                        ? (grade.description.length > 50
                          ? `${grade.description.substring(0, 50)}...`
                          : grade.description)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(grade.date), 'PP')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={grade.value >= 50 ? 'Passed' : 'Failed'}
                        color={grade.value >= 50 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    {subjectFilter 
                      ? 'No grades found for the selected subject' 
                      : 'No grades found for this student'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

const StudentProgressWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <StudentProgress />
    </ErrorBoundary>
  );
};

// Set up global error handler with an IIFE (Immediately Invoked Function Expression)
(function() {
  try {
    window.addEventListener('error', (event) => {
      console.group('Global Error in StudentProgress');
      console.error('Error:', event.error);
      console.error('Message:', event.message);
      console.error('Filename:', event.filename);
      console.error('Line:', event.lineno);
      console.error('Column:', event.colno);
      console.groupEnd();
    });
  } catch (error) {
    console.error('Failed to add global error handler:', error);
  }
})();

export default StudentProgressWithErrorBoundary;
