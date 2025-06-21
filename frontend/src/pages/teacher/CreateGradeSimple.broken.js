// Main component for CreateGradeSimple
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-toastify';

// Import API helpers from appConfig
import { API_URL, buildApiUrl } from '../../config/appConfig';

// Redux actions
import { createGrade, reset } from '../../features/grades/gradeSlice';

// Material UI components
import {
  Box,
  Grid,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Autocomplete,
  Chip,
  Alert,
  Paper
} from '@mui/material';

// Utility functions
import { handleAxiosError, filterSubjectsByDirection, filterStudentsBySubject, extractTeacherData } from './CreateGradeUtils';
// Logging utility
const logInfo = (prefix, message, data) => {
  console.log(`[CreateGradeSimple] ${prefix}: ${message}`, data || '');
};

// UI Components
import {
  FormHeader,
  DirectionSelect,
  SubjectSelect,
  StudentSelect,
  GradeValueField,
  DateField,
  DescriptionField,
  FormActions,
  RoleInfo
} from './CreateGradeComponents';

// Debug logging
console.log('[CreateGradeSimple] Imported API_URL:', API_URL);

/**
 * CreateGradeSimple - Revised version with proper field order and filtering
 * This component has been split into smaller files for better maintainability
 */
const CreateGradeSimple = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // References to track component mount state and prevent duplicate API calls
  const isMounted = useRef(true);
  const apiCallsInProgress = useRef({});
  const cancelTokens = useRef({});
  
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
  
  // Store whether current user is admin to bypass teacher filtering
  const [isAdmin, setIsAdmin] = useState(false);
  
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
    
    if (isSuccess) {
      dispatch(reset());
    }
  };
  
  // Effect to check if user is admin and initiate data loading
  useEffect(() => {
    if (!user || !user.token) return;

    // Check if the user is an admin to set the proper mode
    if (user.user && user.user.role === 'admin') {
      console.log('[CreateGradeSimple] Admin user detected - loading all data');
      setIsAdmin(true);
    }
    
    // Only load initial data once when component mounts and user is available
    loadInitialData();

    // Cancel any pending requests and cleanup on unmount
    return () => {
      console.log('[CreateGradeSimple] Component unmounting - cleaning up requests');
      isMounted.current = false;
      // Cancel any in-flight requests
      Object.values(cancelTokens.current).forEach(cancelToken => {
        if (cancelToken && typeof cancelToken.cancel === 'function') {
          cancelToken.cancel('Component unmounted');
        }
      });
    };
  }, [user?.token]); // Only run when user token changes
  
  // Load teacher classes and associated data
  const loadTeacherData = async () => {
    if (!user?.token || !user?.user?._id) return;
    
    try {
      setIsLoadingTeacherData(true); 
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // For admins, skip teacher-based filtering
      if (user.user && user.user.role === 'admin') {
        logInfo('Teacher', 'Admin user detected - bypassing teacher filtering');
        setIsAdmin(true); 
        setTeacherClasses([]);
        setTeacherSubjects([]);
        setTeacherDirections([]);
        setTeacherStudents([]);
        setIsLoadingTeacherData(false);
        return;
      }
      
      // For teachers, load their specific classes
      logInfo('Teacher', `Loading classes for teacher: ${user.user?._id}`);
      
      const response = await axios.get(buildApiUrl('/api/classes'), config);
      
      if (!Array.isArray(response.data)) {
        console.error('[CreateGradeSimple] Invalid response format for teacher classes');
        return;
      }
      
      setTeacherClasses(response.data);
      logInfo('Teacher', `Loaded ${response.data.length} teacher classes`);
      
      // Extract teacher-specific data
      const extractedData = extractTeacherData(response.data);
      setTeacherSubjects(extractedData.subjects);
      setTeacherDirections(extractedData.directions);
      setTeacherStudents(extractedData.students);
      
      logInfo('Teacher', `Extracted ${extractedData.subjects.length} subjects, ${extractedData.directions.length} directions, ${extractedData.students.length} students`);
    } catch (error) {
      handleAxiosError(error, 'loadTeacherData');
      toast.error('Failed to load teacher class data. Some filtering options may be limited.');
    } finally {
      setIsLoadingTeacherData(false);
    }
  };
  
  // Load initial data (directions, subjects, students)
  const loadInitialData = async () => {
    if (!user || !user.token) {
      logInfo('Init', 'No user token available');
      return;
    }
    
    // Skip if component unmounted during async operations
    if (!isMounted.current) return;
    
    // Prevent duplicate API calls
    if (apiCallsInProgress.current.initialData) {
      logInfo('Init', 'Initial data loading already in progress, skipping');
      return;
    }
    
    // Mark that we're loading data
    apiCallsInProgress.current.initialData = true;
    setLoading(true);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      logInfo('Init', 'Loading data from classes instead of separate APIs');
      
      // Create cancelation token for this request
      cancelTokens.current.classes = axios.CancelToken.source();
      apiCallCancelTokenRef.current = cancelTokens.current.classes;
      
      // Get all classes data - this is now our primary data source
      const classesUrl = buildApiUrl('/api/classes');
      logInfo('Init', `Requesting classes from: ${classesUrl}`);
      
      const classesRes = await axios.get(classesUrl, {
        ...config,
        cancelToken: cancelTokens.current.classes.token
      });
      
      logInfo('Init', `Classes response status: ${classesRes.status}`);
      
      if (!Array.isArray(classesRes.data)) {
        logInfo('Init', 'Invalid classes data format', classesRes.data);
        toast.error('Failed to load class data. Please try again.');
        return;
      }
      
      logInfo('Init', `Loaded ${classesRes.data.length} classes`);
      
      if (classesRes.data.length > 0) {
        logInfo('Init', 'Sample class data:', JSON.stringify(classesRes.data[0]));
      }
      
      // Extract directions, subjects, and students from classes data
      const extractedData = extractTeacherData(classesRes.data);
      
      // Set directions from extracted data
      logInfo('Init', `Setting directions state with ${extractedData.directions.length} items`);
      setDirections(extractedData.directions);
      
      // Set subjects from extracted data
      logInfo('Init', `Setting subjects state with ${extractedData.subjects.length} items`);
      setSubjects(extractedData.subjects);
      
      // Apply initial filtering based on role
      if (user.user?.role === 'admin') {
        logInfo('Init', 'Admin user detected - using all subjects');
        setFilteredSubjects(extractedData.subjects);
      } else if (teacherSubjects.length > 0) {
        logInfo('Init', `Using teacher subjects: ${teacherSubjects.length} items`);
        setFilteredSubjects(teacherSubjects);
      } else {
        logInfo('Init', `Using extracted subjects: ${extractedData.subjects.length} items`);
        setFilteredSubjects(extractedData.subjects);
      }
      
      // Set students with extracted data
      if (extractedData.students.length > 0) {
        logInfo('Init', `Found ${extractedData.students.length} students in classes`);
      }
    } catch (error) {
      // Don't treat cancelled requests as errors
      if (axios.isCancel(error)) {
        logInfo('Init', `Request cancelled: ${error.message}`);
      } else {
        handleAxiosError(error, 'loadInitialData');
        toast.error('Failed to load initial data');
      }
    } finally {
      // Mark that we're done loading data
      apiCallsInProgress.current.initialData = false;
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
      
  // Filter subjects based on direction selection
  useEffect(() => {
    if (!selectedDirection) {
      // If no direction selected, show all subjects (filtered by teacher if available)
      if (teacherSubjects.length > 0 && !isAdmin) {
        logInfo('Direction', 'Using teacher subjects for filtering (no direction selected)');
        setFilteredSubjects(teacherSubjects);
      } else {
        logInfo('Direction', 'Using all subjects for filtering (no direction selected)');
        setFilteredSubjects(subjects);
      }
      return; // Early return when no direction is selected
    }
    
    // Direction is selected, filter subjects for that direction locally
    const loadDirectionSubjects = () => {
      logInfo('Direction', `Filtering subjects locally for direction: ${selectedDirection}`);
      setLoading(true);
      
      try {
        // Filter subjects by direction using the utility function
        // This now uses our local data instead of making an API call
        const directionSubjects = filterSubjectsByDirection(subjects, selectedDirection);
        logInfo('Direction', `Found ${directionSubjects.length} subjects for direction ${selectedDirection}`);
        
        // Apply teacher filtering if relevant
        if (teacherSubjects.length > 0 && !isAdmin) {
          logInfo('Direction', 'Applying teacher filter to subjects');
          const teacherSubjectIds = new Set(teacherSubjects.map(s => s._id));
          const filteredTeacherSubjects = directionSubjects.filter(s => teacherSubjectIds.has(s._id));
          setFilteredSubjects(filteredTeacherSubjects);
          logInfo('Direction', `After teacher filtering, found ${filteredTeacherSubjects.length} subjects`);
        } else {
          setFilteredSubjects(directionSubjects);
        }
        
        // Reset subject and student selection
        if (formData.subject !== '') {
          logInfo('Direction', 'Resetting subject selection due to direction change');
          setFormData(prev => ({ ...prev, subject: '', student: '' }));
        }
      } catch (error) {
        console.error('[CreateGradeSimple] Error filtering subjects by direction:', error);
        toast.error('Failed to load subjects for this direction');
        setFilteredSubjects([]);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    loadDirectionSubjects();
  }, [selectedDirection, subjects, teacherSubjects, isAdmin, formData.subject]);

// Load students when subject changes
useEffect(() => {
  // Reset student selection when subject changes
  if (formData.subject !== '' && formData.student !== '') {
    setFormData(prev => ({ ...prev, student: '' }));
  }
  
  const loadStudents = () => {
    if (!formData.subject) {
      logInfo('Students', 'No subject selected, clearing student list');
      setFilteredStudents([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Filter students locally using the utility function
      logInfo('Students', `Filtering students locally for subject: ${formData.subject}`);
      
      // Filter students by selected subject using our data from classes
      const filtered = filterStudentsBySubject(teacherStudents, formData.subject);
      logInfo('Students', `Found ${filtered.length} students for subject ${formData.subject}`);
            
      // Apply teacher filter if this is a teacher (non-admin) user
      if (teacherStudents.length > 0 && !isAdmin) {
        logInfo('Students', 'Applying teacher filter to students');
        const teacherStudentIds = new Set(teacherStudents.map(s => s._id));
        const teacherFiltered = filtered.filter(s => teacherStudentIds.has(s._id));
        setFilteredStudents(teacherFiltered);
        logInfo('Students', `After teacher filtering, found ${teacherFiltered.length} students`);
      } else {
        setFilteredStudents(filtered);
      }
      
      if (filtered.length === 0) {
        logInfo('Students', 'No students found for this subject');
        toast.info('No students found for this subject');
      }
    } catch (error) {
      console.error('[CreateGradeSimple] Error filtering students by subject:', error);
      toast.error('Failed to load students for this subject');
      setFilteredStudents([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  loadStudents();
}, [formData.subject, formData.student, teacherStudents, isAdmin, user]);

// Handle form submission success
useEffect(() => {
  if (isSuccess) {
    toast.success('Grade created successfully!');
    resetForm();
  }
  
  return () => {
    if (isSuccess) {
      dispatch(reset());
    }
  };
}, [isSuccess, dispatch]);

// Handle form submission error
useEffect(() => {
  if (isError) {
    toast.error(message);
  }
}, [isError, message]);

// Handle form input changes
const handleChange = useCallback((e) => {
  const { name, value } = e.target;
  
  // Special handling for direction changes
  if (name === 'direction') {
    setSelectedDirection(value);
  }
  
  setFormData((prevState) => ({
    ...prevState,
    [name]: value,
  }));
  
  // Clear any previous errors for this field
  if (formErrors[name]) {
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  }
}, [formErrors]);

// Validate form data
const validateForm = () => {
  const errors = {};
  
  if (!formData.student) {
    errors.student = 'Please select a student';
  }
  
  if (!formData.subject) {
    errors.subject = 'Please select a subject';
  }
  
  if (!formData.value) {
    errors.value = 'Please enter a grade value';
  } else {
    const gradeValue = parseInt(formData.value, 10);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      errors.value = 'Grade must be a number between 0-100';
    }
  }
  
  if (!formData.date) {
    errors.date = 'Please select a date';
  }
  
  return errors;
};

// Handle form submission
const onSubmit = async (e) => {
  e.preventDefault();
  
  // Validate form data
  const validationErrors = validateForm();
  if (Object.keys(validationErrors).length > 0) {
    setFormErrors(validationErrors);
    toast.error('Please correct the errors in the form');
    return;
  }

  // Log the form submission for debugging
  console.log('[CreateGradeSimple] Submitting grade with data:', {
    student: formData.student,
    subject: formData.subject,
    value: formData.value,
    date: formData.date,
    description: formData.description?.substring(0, 20) + '...' // Log only first 20 chars of description
  });

  // Create object for API submission
  const gradeData = {
    student: formData.student,
    subject: formData.subject,
    value: formData.value,
    date: formData.date,
    description: formData.description
  };

  // Dispatch create grade action
  dispatch(createGrade(gradeData));
};

// Effect to run initial data load only once at mount
useEffect(() => {
  logInfo('Effect', 'Running initial data load effect');
  loadInitialData();
  
  // Clean up resources when component unmounts
  return () => {
    isMounted.current = false;
    if (apiCallCancelTokenRef.current) {
      logInfo('Effect', 'Cancelling pending requests on unmount');
      apiCallCancelTokenRef.current.cancel('Component unmounted');
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Intentionally empty dependency array for initial load

return (
  <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
      <form onSubmit={onSubmit}>
        <FormHeader 
          isAdmin={isAdmin}
          teacherClasses={teacherClasses}
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DirectionSelect
              formData={formData}
              handleChange={handleChange}
              directions={directions}
              teacherDirections={teacherDirections}
              loading={loading || isLoadingTeacherData}
              formErrors={formErrors}
            />
            
            <SubjectSelect
              formData={formData}
              handleChange={handleChange}
              filteredSubjects={filteredSubjects}
              teacherSubjects={teacherSubjects}
              loading={loading || isLoadingTeacherData}
              formErrors={formErrors}
            />
            
            <StudentSelect
              formData={formData}
              handleChange={handleChange}
              filteredStudents={filteredStudents}
              teacherStudents={teacherStudents}
              loading={loading || isLoadingTeacherData}
              formErrors={formErrors}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <GradeValueField
              formData={formData}
              handleChange={handleChange}
              loading={loading || isLoadingTeacherData}
              formErrors={formErrors}
            />
            
            <DateField
              formData={formData}
              handleChange={handleChange}
              loading={loading || isLoadingTeacherData}
              formErrors={formErrors}
            />
            
            <DescriptionField
              formData={formData}
              handleChange={handleChange}
              loading={loading || isLoadingTeacherData}
              formErrors={formErrors}
              isAdmin={isAdmin}
            />
            
            <FormActions
              isLoading={isLoading}
              loading={loading}
              handleReset={resetForm}
              isSuccess={isSuccess}
            />
            
            <RoleInfo
              isAdmin={isAdmin}
              teacherClasses={teacherClasses}
            />
          </Grid>
        </Grid>
      </form>
    </Paper>
  </Box>
);
}; // Closing brace for CreateGradeSimple component function

export default CreateGradeSimple;
