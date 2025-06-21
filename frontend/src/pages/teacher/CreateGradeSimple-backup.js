// Main component for CreateGradeSimple
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-toastify';

// Import API helpers from appConfig
import { buildApiUrl } from '../../config/appConfig';

// Logging utility
const logInfo = (prefix, message, data) => {
  console.log(`[CreateGradeSimple] ${prefix}: ${message}`, data || '');
};

// Redux actions
import { createGrade, reset } from '../../features/grades/gradeSlice';

// Material UI components
import { Box, Grid, Paper } from '@mui/material';

// Utility functions
import { handleAxiosError, filterSubjectsByDirection, filterStudentsBySubject, extractTeacherData } from './CreateGradeUtils';

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
  
  // Effect to check if user is admin
  useEffect(() => {
    if (!user || !user.token) return;

    // Check if the user is an admin to set the proper mode
    if (user.user && user.user.role === 'admin') {
      console.log('[CreateGradeSimple] Admin user detected - loading all data');
      setIsAdmin(true);
    }

    // Return cleanup function
    return () => {
      isMounted.current = false;
      
      // Cancel any pending API requests
      Object.values(cancelTokens.current).forEach(source => {
        if (source) {
          logInfo('Cleanup', 'Cancelling pending request');
          source.cancel('Component unmounted');
        }
      });
    };
  }, [user]);
  
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
        console.log('[CreateGradeSimple] Admin user detected - bypassing teacher filtering');
        setIsAdmin(true); 
        setTeacherClasses([]);
        setTeacherSubjects([]);
        setTeacherDirections([]);
        setTeacherStudents([]);
        setIsLoadingTeacherData(false);
        return;
      }
      
      // For teachers, load their specific classes
      // Prevent duplicate API calls
      if (apiCallsInProgress.current.classes) {
        logInfo('Teacher', 'Classes API call already in progress, skipping');
        return;
      }
      
      apiCallsInProgress.current.classes = true;
      
      try {
        // Create cancelation token
        cancelTokens.current.classes = axios.CancelToken.source();
        
        logInfo('Teacher', `Loading classes for teacher: ${user.user?._id}`);
        const classesUrl = buildApiUrl('/api/classes');
        const response = await axios.get(classesUrl, {
          ...config,
          cancelToken: cancelTokens.current.classes.token
        });
      
      if (!Array.isArray(response.data)) {
        console.error('[CreateGradeSimple] Invalid response format for teacher classes');
        return;
      }
      
      setTeacherClasses(response.data);
      console.log(`[CreateGradeSimple] Loaded ${response.data.length} teacher classes`);
      
      // Extract teacher-specific data
      const extractedData = extractTeacherData(response.data);
      setTeacherSubjects(extractedData.subjects);
      setTeacherDirections(extractedData.directions);
      setTeacherStudents(extractedData.students);
      
      console.log(`[CreateGradeSimple] Extracted ${extractedData.subjects.length} subjects, ${extractedData.directions.length} directions, ${extractedData.students.length} students`);
      
    } catch (error) {
      if (axios.isCancel(error)) {
        logInfo('Teacher', `Request cancelled: ${error.message}`);
      } else {
        console.error('[CreateGradeSimple] Error loading teacher data:', error);
        toast.error('Failed to load teacher data. Please try again.');
      }
    } finally {
      setIsLoadingTeacherData(false);
    }
  };
  
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
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Prevent duplicate API calls
      if (apiCallsInProgress.current.initialData) {
        logInfo('Init', 'Initial data API call already in progress, skipping');
        return;
      }
      
      apiCallsInProgress.current.initialData = true;
      
      try {
        // Create cancelation tokens
        cancelTokens.current.directions = axios.CancelToken.source();
        cancelTokens.current.subjects = axios.CancelToken.source();
        
        // Fetch directions and subjects in parallel
        logInfo('Init', 'Fetching directions and subjects in parallel');
        const [directionsRes, subjectsRes] = await Promise.all([
          axios.get(buildApiUrl('/api/directions'), {
            ...config,
            cancelToken: cancelTokens.current.directions.token
          }),
          axios.get(buildApiUrl('/api/subjects'), {
            ...config,
            cancelToken: cancelTokens.current.subjects.token
          })
        ]);
      logInfo('Init', `Received directions (${directionsRes.data?.length || 0}) and subjects (${subjectsRes.data?.length || 0})`);
      
      // Set directions, prioritizing teacher directions if available
      if (Array.isArray(directionsRes.data)) {
        setDirections(directionsRes.data);
      }
      
      // Set subjects, prioritizing teacher subjects if available
      if (Array.isArray(subjectsRes.data)) {
        setSubjects(subjectsRes.data);
      }
      
      // Apply initial filtering based on teacher data
      if (teacherSubjects.length > 0) {
        setFilteredSubjects(teacherSubjects);
      } else {
        setFilteredSubjects(subjectsRes.data || []);
      }
      
    } catch (error) {
      if (axios.isCancel(error)) {
        logInfo('Init', `Request cancelled: ${error.message}`);
      } else {
        console.error('[CreateGradeSimple] Error loading initial data:', error);
        toast.error('Failed to load initial data. Please try again.');
      }
    } finally {
      apiCallsInProgress.current.initialData = false;
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  // Load data based on user role when component mounts
  useEffect(() => {
    if (!user || !user.token) return;
    
    const loadData = async () => {
      await loadTeacherData();
      await loadInitialData();
    };
    
    loadData();
  }, [user]);
  
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
    
    // If direction is selected, load subjects for that direction
    const loadDirectionSubjects = async (selectedDirection) => {
    if (!user || !user.token || !selectedDirection) {
      setFilteredSubjects([]);
      return;
    }
    
    // Prevent duplicate API calls
    if (apiCallsInProgress.current.directionSubjects) {
      logInfo('Direction', `Subject loading for direction ${selectedDirection} already in progress, skipping`);
      return;
    }
    
    // Mark that we're loading data
    apiCallsInProgress.current.directionSubjects = true;
    setLoading(true);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Cancel previous request if exists
      if (cancelTokens.current.directionSubjects) {
        logInfo('Direction', 'Cancelling previous subjects request');
        cancelTokens.current.directionSubjects.cancel('New request made');
      }
      
      // Create cancelation token for this request
      cancelTokens.current.directionSubjects = axios.CancelToken.source();
      
      const timestamp = new Date().getTime();
      const url = buildApiUrl(`/api/subjects/direction/${selectedDirection}?_t=${timestamp}`);
      logInfo('Direction', `Fetching subjects for direction: ${selectedDirection} from ${url}`);
      
      const response = await axios.get(url, {
        ...config,
        cancelToken: cancelTokens.current.directionSubjects.token
      });
        
        if (isMounted.current && Array.isArray(response.data)) {
          // If teacher subjects available, filter API results
          if (teacherSubjects.length > 0) {
            const teacherSubjectIds = new Set(teacherSubjects.map(s => s._id));
            const filteredResults = response.data.filter(subject => teacherSubjectIds.has(subject._id));
            setFilteredSubjects(filteredResults);
            logInfo('Direction', `Filtered ${filteredResults.length} teacher subjects from API results`);
          } else {
            setFilteredSubjects(response.data);
            logInfo('Direction', `Loaded ${response.data.length} subjects for direction ${selectedDirection}`);
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
          const filtered = filterSubjectsByDirection(subjects, selectedDirection);
          
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
    
    loadDirectionSubjects();
  }, [selectedDirection, subjects, teacherSubjects, formData.subject, user]);
  
  // Load students when subject changes
  useEffect(() => {
    // Reset student selection when subject changes
    if (formData.subject !== '' && formData.student !== '') {
      setFormData(prev => ({ ...prev, student: '' }));
    }
    
    const loadStudents = async () => {
      if (!user || !user.token || !formData.subject) {
        setFilteredStudents([]);
        return;
      }
      
      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        // Get students for selected subject
        const timestamp = new Date().getTime();
        const url = buildApiUrl(`/api/students/subject/${formData.subject}?_t=${timestamp}`);
        logInfo('Students', `Fetching students for subject: ${formData.subject} from ${url}`);
        const response = await axios.get(url, config);
        
        if (isMounted.current && Array.isArray(response.data)) {
          // If teacher students available, filter API results
          if (teacherStudents.length > 0 && !isAdmin) {
            const teacherStudentIds = new Set(teacherStudents.map(s => s._id));
            const filteredResults = response.data.filter(student => teacherStudentIds.has(student._id));
            setFilteredStudents(filteredResults);
            logInfo('Students', `Filtered ${filteredResults.length} teacher students from API results`);
          } else {
            setFilteredStudents(response.data);
            logInfo('Students', `Loaded ${response.data.length} students for subject ${formData.subject}`);
          }
        }
      } catch (error) {
        if (isMounted.current) {
          handleAxiosError(error, 'loadStudents');
          // Client-side fallback
          const filtered = filterStudentsBySubject(subjects, formData.subject);
          
          // Apply teacher filter if available
          if (teacherStudents.length > 0 && !isAdmin) {
            const teacherStudentIds = new Set(teacherStudents.map(s => s._id));
            const teacherFiltered = filtered.filter(s => teacherStudentIds.has(s._id));
            setFilteredStudents(teacherFiltered);
          } else {
            setFilteredStudents(filtered);
          }
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    loadStudents();
  }, [formData.subject, isAdmin, teacherStudents, subjects, user]);
  
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
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit grade
    logInfo('Submit', 'Submitting grade:', {
      student: formData.student,
      subject: formData.subject,
      value: formData.value,
      date: formData.date,
      description: formData.description?.length > 20 ? formData.description.substring(0, 20) + '...' : formData.description
    });
    dispatch(createGrade(formData));
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
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
};

export default CreateGradeSimple;
