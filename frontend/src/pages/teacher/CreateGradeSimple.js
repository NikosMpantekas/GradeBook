import React, { useState, useEffect, useCallback } from 'react';  
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import axios from 'axios';

// Redux actions
import { createGrade, reset } from '../../features/grades/gradeSlice';

// Utils
import { formatDate } from '../../utils/dateUtils';

// Material UI components
import { 
  Box, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';

// Material UI icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ClassIcon from '@mui/icons-material/Class';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import GradeIcon from '@mui/icons-material/Grade';
import SubjectIcon from '@mui/icons-material/Subject';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import SaveIcon from '@mui/icons-material/Save';

/**
 * CreateGradeSimple - Revised version with proper field order and filtering
 * Fields appear in this order: Direction, Subject, Student, Grade, Date
 * Each selection filters the next field's options
 */
const CreateGradeSimple = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get user from auth state
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.grades);
  
  // Local state for form data and UI
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    value: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // Teacher-specific state
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [teacherDirections, setTeacherDirections] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [isLoadingTeacherData, setIsLoadingTeacherData] = useState(false);
  
  // Reset form after submission
  const resetForm = () => {
    setFormData({
      student: '',
      subject: '',
      value: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setSelectedDirection('');
    setFilteredSubjects([]);
    setFilteredStudents([]);
    setFormErrors({});
  };
  
  // Navigate back to grades list
  const handleBack = () => {
    navigate('/app/teacher/grades/manage');
  };
  
  // Log Axios errors consistently
  const handleAxiosError = (error, context) => {
    console.error(`[CreateGradeSimple] Error in ${context}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
  };
  
  // Load classes where the current teacher is assigned
  const loadTeacherClasses = useCallback(async () => {
    if (!user?.token) return;
    
    setIsLoadingTeacherData(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      console.log('[CreateGradeSimple] Loading classes for teacher:', user._id);
      const response = await axios.get('/api/classes', config);
      
      if (Array.isArray(response.data)) {
        setTeacherClasses(response.data);
        console.log(`[CreateGradeSimple] Loaded ${response.data.length} teacher classes`);
        
        // Extract unique subjects from teacher classes
        const subjectIds = new Set();
        const subjectsFromClasses = [];
        
        // Extract unique directions from teacher classes
        const directionIds = new Set();
        const directionsFromClasses = [];
        
        // Extract unique students from teacher classes
        const studentIds = new Set();
        const studentsFromClasses = [];
        
        // Process each class to extract related data
        response.data.forEach(cls => {
          // Extract subject info if available
          if (cls.subject) {
            const subjectId = typeof cls.subject === 'object' ? cls.subject._id : cls.subject;
            if (subjectId && !subjectIds.has(subjectId)) {
              subjectIds.add(subjectId);
              if (typeof cls.subject === 'object') {
                subjectsFromClasses.push(cls.subject);
              }
            }
          }
          
          // Extract direction info if available
          if (cls.direction) {
            const directionId = typeof cls.direction === 'object' ? cls.direction._id : cls.direction;
            if (directionId && !directionIds.has(directionId)) {
              directionIds.add(directionId);
              if (typeof cls.direction === 'object') {
                directionsFromClasses.push(cls.direction);
              }
            }
          }
          
          // Extract student info if available
          if (cls.students && Array.isArray(cls.students)) {
            cls.students.forEach(student => {
              const studentId = typeof student === 'object' ? student._id : student;
              if (studentId && !studentIds.has(studentId)) {
                studentIds.add(studentId);
                if (typeof student === 'object') {
                  studentsFromClasses.push(student);
                }
              }
            });
          }
        });
        
        // If we have subject IDs but not full objects, fetch their details
        if (subjectIds.size > 0 && subjectsFromClasses.length < subjectIds.size) {
          try {
            const subjectsResponse = await axios.get('/api/subjects', config);
            if (Array.isArray(subjectsResponse.data)) {
              const filteredSubjects = subjectsResponse.data.filter(subject => 
                subjectIds.has(subject._id)
              );
              setTeacherSubjects(filteredSubjects);
            }
          } catch (error) {
            handleAxiosError(error, 'loadTeacherSubjects');
            // Use what we have
            setTeacherSubjects(subjectsFromClasses);
          }
        } else {
          setTeacherSubjects(subjectsFromClasses);
        }
        
        // If we have direction IDs but not full objects, fetch their details
        if (directionIds.size > 0 && directionsFromClasses.length < directionIds.size) {
          try {
            const directionsResponse = await axios.get('/api/directions', config);
            if (Array.isArray(directionsResponse.data)) {
              const filteredDirections = directionsResponse.data.filter(direction => 
                directionIds.has(direction._id)
              );
              setTeacherDirections(filteredDirections);
            }
          } catch (error) {
            handleAxiosError(error, 'loadTeacherDirections');
            // Use what we have
            setTeacherDirections(directionsFromClasses);
          }
        } else {
          setTeacherDirections(directionsFromClasses);
        }
        
        // If we have student IDs but not full objects, fetch their details
        if (studentIds.size > 0 && studentsFromClasses.length < studentIds.size) {
          try {
            const studentsResponse = await axios.get('/api/students', config);
            if (Array.isArray(studentsResponse.data)) {
              const filteredStudents = studentsResponse.data.filter(student => 
                studentIds.has(student._id)
              );
              setTeacherStudents(filteredStudents);
            }
          } catch (error) {
            handleAxiosError(error, 'loadTeacherStudents');
            // Use what we have
            setTeacherStudents(studentsFromClasses);
          }
        } else {
          setTeacherStudents(studentsFromClasses);
        }
        
        console.log(`[CreateGradeSimple] Teacher data extracted: ${teacherSubjects.length} subjects, ${teacherDirections.length} directions, ${teacherStudents.length} students`);
      }
    } catch (error) {
      handleAxiosError(error, 'loadTeacherClasses');
      toast.error('Failed to load teacher class data. Some filtering options may be limited.');
    } finally {
      setIsLoadingTeacherData(false);
    }
  }, [user]);

  
  // Create a consolidated data loading function
  const loadInitialData = async () => {
    if (!user || !user.token) {
      console.error('[CreateGradeSimple] No user token available');
      return;
    }
    
    // Skip if component unmounted during async operations
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      // Configure headers with auth token
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Load directions with timestamp to avoid cache issues
      const timestamp = new Date().getTime();
      const [directionsRes, subjectsRes] = await Promise.all([
        axios.get(`/api/directions?_t=${timestamp}`, config),
        axios.get(`/api/subjects?_t=${timestamp}`, config)
      ]);
      
      // Skip if component unmounted during API calls
      if (!isMounted.current) return;
      
      // Set directions, prioritizing teacher directions if available
      if (Array.isArray(directionsRes.data)) {
        setDirections(directionsRes.data);
      }
      
      // Set subjects, prioritizing teacher subjects if available
      if (Array.isArray(subjectsRes.data)) {
        setSubjects(subjectsRes.data);
        
        // Apply initial filtering to subjects based on teacher data
        if (teacherSubjects.length > 0) {
          setFilteredSubjects(teacherSubjects);
        } else {
          setFilteredSubjects(subjectsRes.data);
        }
      }
      
    } catch (error) {
      // Skip if component unmounted during error handling
      if (!isMounted.current) return;
      
      handleAxiosError(error, 'loadInitialData');
      console.error('[CreateGradeSimple] Error loading dropdown data:', error);
      toast.error('Failed to load form data. Please refresh and try again.');
    } finally {
      // Skip if component unmounted before cleanup
      if (!isMounted.current) return;
      setLoading(false);
    }
  };

  // Reference to track if component is mounted
  const isMounted = React.useRef(true);

  // Load all directions and teacher classes on component mount
  useEffect(() => {
    if (user && user.token) {
      // Only load teacher classes data initially, then use loadInitialData for the rest
      loadTeacherClasses()
        .then(() => {
          console.log('[CreateGradeSimple] Teacher classes loaded, now loading initial data');
          loadInitialData();
        })
        .catch(error => {
          console.error('[CreateGradeSimple] Error loading teacher data:', error);
          // Still try to load basic data if teacher data fails
          loadInitialData();
        });
    }
  }, [user, loadTeacherClasses]);
  
  // Cleanup function to prevent memory leaks and state updates on unmounted component
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load subjects filtered by selected direction
  const loadDirectionSubjects = async () => {
    if (!user?.token || !isMounted.current) return;
    
    setLoading(true);
    try {
      // Check if we can filter from teacher-specific subjects first
      if (teacherSubjects.length > 0) {
        // Filter subjects that match the selected direction
        const filteredTeacherSubjects = teacherSubjects.filter(subject => {
          return subject.directions && 
                 Array.isArray(subject.directions) && 
                 subject.directions.some(dir => {
                   const dirId = typeof dir === 'object' ? dir._id : dir;
                   return dirId === selectedDirection;
                 });
        });
        
        if (filteredTeacherSubjects.length > 0) {
          console.log(`[CreateGradeSimple] Found ${filteredTeacherSubjects.length} teacher-specific subjects for direction ${selectedDirection}`);
          setFilteredSubjects(filteredTeacherSubjects);
          
          // Reset subject if not valid anymore
          const subjectStillValid = filteredTeacherSubjects.some(s => s._id === formData.subject);
          if (formData.subject && !subjectStillValid) {
            setFormData(prev => ({
              ...prev,
              subject: '',
              student: ''
            }));
          }
          
          setLoading(false);
          return;
        }
      }
      
      // If no teacher-specific subjects found, make API call
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/subjects/direction/${selectedDirection}?_t=${timestamp}`, config);
      
      if (isMounted.current && Array.isArray(response.data)) {
        // If teacher subjects available, filter API results
        if (teacherSubjects.length > 0) {
          const teacherSubjectIds = new Set(teacherSubjects.map(s => s._id));
          const filteredResults = response.data.filter(subject => teacherSubjectIds.has(subject._id));
          setFilteredSubjects(filteredResults);
          console.log(`[CreateGradeSimple] Filtered ${filteredResults.length} teacher subjects from API results`);
        } else {
          setFilteredSubjects(response.data);
          console.log(`[CreateGradeSimple] Loaded ${response.data.length} subjects for direction ${selectedDirection}`);
        }
        
        // Reset subject if needed
        const subjectStillValid = response.data.some(s => s._id === formData.subject);
        if (formData.subject && !subjectStillValid) {
          setFormData(prev => ({
            ...prev,
            subject: '',
            student: ''
          }));
        }
      }
    } catch (error) {
      if (isMounted.current) {
        handleAxiosError(error, 'loadDirectionSubjects');
        // Client-side fallback
        const filtered = subjects.filter(subject => {
          return subject.directions && 
                 Array.isArray(subject.directions) && 
                 subject.directions.some(dir => {
                   const dirId = typeof dir === 'object' ? dir._id : dir;
                   return dirId === selectedDirection;
                 });
        });
        
        // Apply teacher filter if available
        if (teacherSubjects.length > 0) {
          const teacherSubjectIds = new Set(teacherSubjects.map(s => s._id));
          const teacherFiltered = filtered.filter(s => teacherSubjectIds.has(s._id));
          setFilteredSubjects(teacherFiltered);
        } else {
          setFilteredSubjects(filtered);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  // Filter subjects based on direction selection
  useEffect(() => {
    if (!selectedDirection) {
      // If no direction selected, show all subjects (filtered by teacher if available)
      if (teacherSubjects.length > 0) {
        setFilteredSubjects(teacherSubjects);
      } else {
        setFilteredSubjects(subjects);
      }
      return;
    }
    
    console.log(`[CreateGradeSimple] Filtering subjects for direction: ${selectedDirection}`);
    loadDirectionSubjects();
    
  // This effect should only run when selectedDirection changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDirection, subjects, teacherSubjects]);
  
  // Load students when subject changes
  useEffect(() => {
    // Track if this effect is still relevant
    let isEffectActive = true;
    
    const loadStudents = async () => {
      if (!formData.subject) {
        setFilteredStudents([]);
        return; // Don't load students if no subject is selected
      }
      
      if (!user?.token) return;
      
      setLoading(true);
      try {
        // First check if we can filter from teacher-specific students
        if (teacherStudents.length > 0 && isEffectActive) {
          console.log(`[CreateGradeSimple] Filtering teacher-specific students for subject ${formData.subject}`);
          
          // Filter students that have this subject
          let teacherFilteredStudents = teacherStudents.filter(student => {
            return student.subjects && 
                  Array.isArray(student.subjects) && 
                  student.subjects.some(sub => {
                    const subId = typeof sub === 'object' ? sub?._id : sub;
                    return subId === formData.subject;
                  });
          });
          
          // Further filter by direction if selected
          if (selectedDirection) {
            teacherFilteredStudents = teacherFilteredStudents.filter(student => {
              const studentDirId = typeof student.direction === 'object' 
                ? student.direction?._id 
                : student.direction;
              return studentDirId && studentDirId.toString() === selectedDirection;
            });
          }
          
          if (teacherFilteredStudents.length > 0 && isEffectActive) {
            console.log(`[CreateGradeSimple] Found ${teacherFilteredStudents.length} students from teacher's classes`);
            setFilteredStudents(teacherFilteredStudents);
            
            // Check if current student selection is still valid
            const studentStillValid = teacherFilteredStudents.some(s => s._id === formData.student);
            if (formData.student && !studentStillValid) {
              setFormData(prev => ({
                ...prev,
                student: ''
              }));
            }
            
            setLoading(false);
            return; // Exit early as we've found students from teacher data
          }
        }
        
        // If no teacher-specific students found or available, continue with API call
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        console.log(`[CreateGradeSimple] Loading students for subject ${formData.subject}`);
        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/students/subject/${formData.subject}?_t=${timestamp}`, config);
        
        // Check if this effect is still relevant before updating state
        if (!isEffectActive) return;
        
        if (Array.isArray(response.data)) {
          let studentsToShow = response.data;
          
          // Filter by direction if selected
          if (selectedDirection) {
            studentsToShow = studentsToShow.filter(student => {
              const studentDirId = typeof student.direction === 'object' 
                ? student.direction?._id 
                : student.direction;
              return studentDirId && studentDirId.toString() === selectedDirection;
            });
          }
          
          // Filter by teacher's students if available
          if (teacherStudents.length > 0) {
            const teacherStudentIds = new Set(teacherStudents.map(s => s._id));
            const previousCount = studentsToShow.length;
            studentsToShow = studentsToShow.filter(student => teacherStudentIds.has(student._id));
            console.log(`[CreateGradeSimple] Filtered API students from ${previousCount} to ${studentsToShow.length} teacher's students`);
          }
          
          if (isEffectActive) {
            setFilteredStudents(studentsToShow);
            console.log(`[CreateGradeSimple] Loaded ${studentsToShow.length} students for subject ${formData.subject}`);
            
            // Check if current student selection is still valid
            const studentStillValid = studentsToShow.some(s => s._id === formData.student);
            if (formData.student && !studentStillValid) {
              setFormData(prev => ({
                ...prev,
                student: ''
              }));
            }
          }
        }
      } catch (error) {
        if (!isEffectActive) return;
        
        handleAxiosError(error, 'loadStudents');
        
        // Fallback: Try to load all students
        try {
          console.log('[CreateGradeSimple] Falling back to loading all students');
          
          // If we have teacher students, just use those
          if (teacherStudents.length > 0) {
            console.log('[CreateGradeSimple] Using teacher students as fallback');
            let studentsToShow = [...teacherStudents];
            
            // Filter by subject
            if (formData.subject) {
              studentsToShow = studentsToShow.filter(student => {
                return student.subjects && 
                      Array.isArray(student.subjects) && 
                      student.subjects.some(sub => {
                        const subId = typeof sub === 'object' ? sub?._id : sub;
                        return subId === formData.subject;
                      });
              });
            }
            
            // Filter by direction
            if (selectedDirection) {
              studentsToShow = studentsToShow.filter(student => {
                const studentDirId = typeof student.direction === 'object' 
                  ? student.direction?._id 
                  : student.direction;
                return studentDirId && studentDirId.toString() === selectedDirection;
              });
            }
            
            if (isEffectActive) {
              setFilteredStudents(studentsToShow);
              console.log(`[CreateGradeSimple] Fallback: filtered ${studentsToShow.length} teacher students`);
              
              const studentStillValid = studentsToShow.some(s => s._id === formData.student);
              if (formData.student && !studentStillValid) {
                setFormData(prev => ({
                  ...prev,
                  student: ''
                }));
              }
            }
          } else {
            // Full fallback - load all students and filter
            const allStudentsResponse = await axios.get('/api/students', {
              headers: {
                Authorization: `Bearer ${user.token}`
              }
            });
            
            if (isEffectActive && Array.isArray(allStudentsResponse.data)) {
              // First filter by subject (if any)
              let studentsToShow = allStudentsResponse.data;
              
              if (formData.subject) {
                studentsToShow = allStudentsResponse.data.filter(student => {
                  return student.subjects && 
                        Array.isArray(student.subjects) && 
                        student.subjects.some(sub => {
                          const subId = typeof sub === 'object' ? sub?._id : sub;
                          return subId === formData.subject;
                        });
                });
              }
              
              // Then filter by direction (if any)
              if (selectedDirection) {
                studentsToShow = studentsToShow.filter(student => {
                  const studentDirId = typeof student.direction === 'object' 
                    ? student.direction?._id 
                    : student.direction;
                  return studentDirId && studentDirId.toString() === selectedDirection;
                });
              }
              
              setFilteredStudents(studentsToShow);
              console.log(`[CreateGradeSimple] Fallback: loaded ${studentsToShow.length} students client-side`);
              
              const studentStillValid = studentsToShow.some(s => s._id === formData.student);
              if (formData.student && !studentStillValid) {
                setFormData(prev => ({
                  ...prev,
                  student: ''
                }));
              }
            }
          }
        } catch (fallbackError) {
          if (isEffectActive) {
            handleAxiosError(fallbackError, 'loadAllStudentsFallback');
            toast.error('Failed to load students');
          }
        }
      } finally {
        if (isEffectActive) {
          setLoading(false);
        }
      }
    };
    
    // Only load students when the subject actually changes
    loadStudents();
    
    // Cleanup function
    return () => {
      isEffectActive = false;
    };
    
    // Only depend on subject, direction, and teacher students to prevent unnecessary API calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subject, selectedDirection, user, teacherStudents]);
  
  // Handle direction change
  const handleDirectionChange = (e) => {
    const directionId = e.target.value;
    console.log(`[CreateGradeSimple] Direction changed to: ${directionId}`);
    setSelectedDirection(directionId);
    
    // When direction changes, we need to update the subject list and potentially reset selections
    if (directionId === '') {
      // If no direction selected, show all subjects
      setFilteredSubjects(subjects);
    }
    
    // The useEffect for subjects will handle the API call to get subjects for this direction
  };
  
  // Handle form input changes
  const onChange = (e) => {
    const { name, value } = e.target;
    console.log(`[CreateGradeSimple] Field changed: ${name} = ${value}`);
    
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
    // If subject changes, this will trigger the useEffect to load students
    
    // Clear validation errors when field is changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined
      });
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.student) {
      errors.student = 'Student is required';
    }
    
    if (!formData.subject) {
      errors.subject = 'Subject is required';
    }
    
    if (!formData.value) {
      errors.value = 'Grade value is required';
    } else if (isNaN(formData.value) || formData.value < 0 || formData.value > 100) {
      errors.value = 'Grade must be a number between 0 and 100';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Track submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please check form for errors');
      return;
    }
    
    // Prevent double submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Construct the grade data with permission handling
      const gradeData = {
        student: formData.student,
        subject: formData.subject,
        value: parseInt(formData.value, 10),
        // FIXED: Safely check user permissions with proper null checks
        // Only include description if user has permission or if permission is undefined (default to allowed)
        description: (user && user.canAddGradeDescriptions === false) ? '' : (formData.description || ''),
        date: formData.date,
      };
      
      // Log whether description was included based on permissions
      console.log(`[CreateGradeSimple] User permission check: canAddGradeDescriptions=${user?.canAddGradeDescriptions}`);
      if (user && user.canAddGradeDescriptions === false) {
        console.log('[CreateGradeSimple] Description field ignored due to user permissions');
      }
      
      console.log('[CreateGradeSimple] Submitting grade:', gradeData);
      await dispatch(createGrade(gradeData)).unwrap();
      
      // If we get here, the grade was created successfully
      resetForm();
      toast.success('Grade created successfully');
      
      // Short delay before navigation to ensure toast is shown
      setTimeout(() => {
        navigate('/app/teacher/grades/manage');
      }, 1000);
    } catch (error) {
      console.error('[CreateGradeSimple] Error submitting form:', error);
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage);
      setFormErrors({
        form: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle error and success states
  useEffect(() => {
    // Show error messages from Redux state
    if (isError && message) {
      toast.error(message);
    }
    
    // Cleanup function
    return () => {
      dispatch(reset());
    };
  }, [isError, isSuccess, message, dispatch]);
  
  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', pb: 10 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2, py: 1, px: 2 }}
        variant="outlined"
        color="primary"
        size="large"
      >
        Back to Grades
      </Button>
      
      <Paper elevation={5} sx={{ 
        p: { xs: 2, sm: 4 }, 
        mb: 3, 
        maxWidth: '1200px', 
        mx: 'auto',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main', 
            borderBottom: '2px solid', 
            borderColor: 'primary.light',
            pb: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <GradeIcon sx={{ mr: 2, fontSize: 30 }} />
          Create New Grade
        </Typography>
        
        {teacherClasses.length > 0 && (
          <Alert 
            severity="info" 
            icon={<ClassIcon />}
            sx={{ 
              mt: 2, 
              mb: 3, 
              '& .MuiAlert-message': { 
                display: 'flex', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              } 
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body1" fontWeight="500">
                Teacher Mode: 
              </Typography>
              <Typography>  
                Showing students from your {teacherClasses.length} assigned {teacherClasses.length === 1 ? 'class' : 'classes'}
              </Typography>
              <Chip 
                size="small" 
                color="primary" 
                variant="outlined"
                label={`${teacherStudents.length} students available`} 
              />
            </Box>
          </Alert>
        )}
        
        <Divider sx={{ mb: 4 }} />
        
        {isError && <Alert severity="error" sx={{ mb: 4 }}>{message}</Alert>}
        
        <form onSubmit={onSubmit}>
          <Grid container spacing={4}>
            {/* FIELD ORDER: Direction, Subject, Student, Grade Value, Date */}
            
            {/* 1. Direction Selection (First) */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: { xs: 0, md: 2 } }}>
                <InputLabel id="direction-filter-label">Direction</InputLabel>
                <Select
                  labelId="direction-filter-label"
                  name="direction-filter"
                  value={selectedDirection}
                  label="Direction"
                  onChange={handleDirectionChange}
                  disabled={isLoading || loading || directions.length === 0}
                  sx={{ 
                    '& .MuiSelect-select': { py: 1.8 },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.light',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2
                    }
                  }}
                  startAdornment={<SchoolIcon color="primary" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="" sx={{ fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <span>All Directions</span>
                      <ArrowDropDownIcon />
                    </Box>
                  </MenuItem>
                  <Divider />
                  {directions.length > 0 ? (
                    directions.map((direction) => {
                      const isTeacherDirection = teacherDirections.some(d => d._id === direction._id);
                      return (
                        <MenuItem 
                          key={direction._id} 
                          value={direction._id}
                          sx={{
                            backgroundColor: isTeacherDirection ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            '&:hover': {
                              backgroundColor: isTeacherDirection ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                            },
                            borderLeft: isTeacherDirection ? '4px solid #1976d2' : 'none',
                            pl: isTeacherDirection ? 1 : 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Typography variant="body1">{direction.name}</Typography>
                            {isTeacherDirection && (
                              <Chip 
                                size="small" 
                                label="Your Class" 
                                color="primary" 
                                icon={<CheckCircleIcon />}
                                sx={{ ml: 1, height: 24, fontWeight: 500 }} 
                              />
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })
                  ) : (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                        <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> No directions found
                      </Box>
                    </MenuItem>
                  )}
                </Select>
                <FormHelperText>
                  {teacherDirections.length > 0 ? 'Directions from your classes are highlighted' : 'Select a direction to filter subjects and students'}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {/* 2. Subject Selection (Second) */}
            <Grid item xs={12} md={6}>
              <FormControl required fullWidth error={Boolean(formErrors.subject)}>
                <InputLabel id="subject-label">Subject *</InputLabel>
                <Select
                  labelId="subject-label"
                  name="subject"
                  value={formData.subject || ''}
                  label="Subject *"
                  onChange={onChange}
                  disabled={isLoading || filteredSubjects.length === 0}
                  sx={{ 
                    '& .MuiSelect-select': { py: 1.8 },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.subject ? 'error.main' : 'primary.light',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.subject ? 'error.main' : 'primary.main',
                      borderWidth: 2
                    }
                  }}
                  startAdornment={<SubjectIcon color="primary" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="" sx={{ fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <span>Select a subject</span>
                      <ArrowDropDownIcon />
                    </Box>
                  </MenuItem>
                  <Divider />
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => {
                      const isTeacherSubject = teacherSubjects.some(s => s._id === subject._id);
                      return (
                        <MenuItem 
                          key={subject._id} 
                          value={subject._id}
                          sx={{
                            backgroundColor: isTeacherSubject ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            '&:hover': {
                              backgroundColor: isTeacherSubject ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                            },
                            borderLeft: isTeacherSubject ? '4px solid #1976d2' : 'none',
                            pl: isTeacherSubject ? 1 : 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Typography variant="body1">{subject.name}</Typography>
                            {isTeacherSubject && (
                              <Chip 
                                size="small" 
                                label="Your Class" 
                                color="primary" 
                                icon={<CheckCircleIcon />}
                                sx={{ ml: 1, height: 24, fontWeight: 500 }} 
                              />
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })
                  ) : (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                        <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> No subjects found
                      </Box>
                    </MenuItem>
                  )}
                </Select>
                {formErrors.subject && (
                  <FormHelperText error>{formErrors.subject}</FormHelperText>
                )}
                {!formErrors.subject && (
                  <FormHelperText>
                    {selectedDirection ? 'Subjects filtered by direction' : 'All available subjects'}
                    {teacherSubjects.length > 0 && ' - Highlighted items are your classes'}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* 3. Student Selection (Third) */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.student} sx={{ mb: { xs: 0, md: 2 } }}>
                <InputLabel id="student-label">Student *</InputLabel>
                <Select
                  labelId="student-label"
                  name="student"
                  value={formData.student || ''}
                  label="Student *"
                  onChange={onChange}
                  disabled={isLoading || filteredStudents.length === 0 || !formData.subject}
                  sx={{ 
                    '& .MuiSelect-select': { py: 1.8 },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.student ? 'error.main' : 'primary.light',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formErrors.student ? 'error.main' : 'primary.main',
                      borderWidth: 2
                    }
                  }}
                  startAdornment={<PersonIcon color="primary" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="" sx={{ fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <span>Select a student</span>
                      <ArrowDropDownIcon />
                    </Box>
                  </MenuItem>
                  <Divider />
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const isTeacherStudent = teacherStudents.some(s => s._id === student._id);
                      return (
                        <MenuItem 
                          key={student._id} 
                          value={student._id}
                          sx={{
                            backgroundColor: isTeacherStudent ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            '&:hover': {
                              backgroundColor: isTeacherStudent ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                            },
                            borderLeft: isTeacherStudent ? '4px solid #1976d2' : 'none',
                            pl: isTeacherStudent ? 1 : 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Typography variant="body1">{student.lastname} {student.firstname}</Typography>
                            {isTeacherStudent && (
                              <Chip 
                                size="small" 
                                label="Your Class" 
                                color="primary" 
                                icon={<CheckCircleIcon />}
                                sx={{ ml: 1, height: 24, fontWeight: 500 }} 
                              />
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })
                  ) : (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                        <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> 
                        {!formData.subject ? 'Select a subject first' : 'No students available'}
                      </Box>
                    </MenuItem>
                  )}
                </Select>
                {formErrors.student ? (
                  <FormHelperText error>{formErrors.student}</FormHelperText>
                ) : (
                  <FormHelperText>
                    {loading && formData.subject ? 'Loading students...' : 
                     !formData.subject ? 'Select a subject first' : 
                     filteredStudents.length === 0 ? 'No students found for selected criteria' : 
                     teacherStudents.length > 0 ? 'Students from your classes are highlighted' : 'Select the student to grade'}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* 4. Grade Value (Fourth) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Value (0-100) *"
                type="number"
                name="value"
                value={formData.value}
                onChange={onChange}
                InputProps={{ 
                  inputProps: { min: 0, max: 100, step: 1 },
                  sx: { py: 1.5 },
                  startAdornment: <GradeIcon color="primary" sx={{ mr: 1 }} />
                }}
                error={!!formErrors.value}
                helperText={formErrors.value || 'Enter a value between 0 and 100'}
                disabled={isLoading}
                sx={{ mb: { xs: 0, md: 2 } }}
              />
            </Grid>
            
            {/* 5. Date (Fifth) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                name="date"
                value={formData.date}
                onChange={onChange}
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.date}
                helperText={formErrors.date || 'Date when the grade was assigned'}
                disabled={isLoading}
                sx={{ mb: { xs: 0, md: 2 } }}
                InputProps={{
                  startAdornment: <CalendarIcon color="primary" sx={{ mr: 1 }} />,
                  sx: { py: 1.5 }
                }}
              />
            </Grid>
            
            {/* Description (Optional) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={onChange}
                multiline
                rows={4}
                helperText="Optional: Add additional notes about this grade"
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mt: 3, gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={isLoading || loading}
                  startIcon={<InfoIcon />}
                  sx={{ 
                    px: 3, 
                    py: 1.5, 
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2
                    }
                  }}
                >
                  Reset Form
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                  disabled={isLoading || loading}
                  sx={{ 
                    px: 5, 
                    py: 1.5, 
                    borderRadius: 2,
                    boxShadow: 3,
                    fontWeight: 'bold',
                    '&:hover': {
                      boxShadow: 6,
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  {isLoading ? 'Saving Grade...' : 'Save Grade'}
                </Button>
              </Box>
              
              {teacherClasses.length > 0 && (
                <Alert 
                  severity="info" 
                  variant="outlined"
                  sx={{ mt: 3 }}
                >
                  <Typography variant="subtitle2">
                    Teacher Mode: You can only grade students from your assigned classes.
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateGradeSimple;
