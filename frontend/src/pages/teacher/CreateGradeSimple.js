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
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
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
      // Use imported API_URL
      console.log('[CreateGradeSimple] Loading classes for teacher:', user.user?._id);
      console.log('[CreateGradeSimple] Using API_URL:', API_URL);
      const response = await axios.get(`${API_URL}/api/classes`, config);
      
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
      handleAxiosError(error, 'loadTeacherClasses');
      toast.error('Failed to load teacher class data. Some filtering options may be limited.');
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
      
      console.log('[CreateGradeSimple] Using buildApiUrl helper for API requests');
      
      // Use separate try/catch blocks for each API call to identify which one fails
      let directionsRes = { data: [] };
      let subjectsRes = { data: [] };
      
      // Get directions with detailed error handling
      try {
        // Force URL without slash to be consistent
        const directionsUrl = buildApiUrl('/api/directions');
        console.log('[CreateGradeSimple] Requesting directions from:', directionsUrl);
        
        // Use direct API_URL with manual normalization as fallback if buildApiUrl fails
        try {
          directionsRes = await axios.get(directionsUrl, config);
        } catch (directUrlError) {
          console.warn('[CreateGradeSimple] First attempt failed, trying alternate URL format');
          const fallbackUrl = `${API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL}/api/directions`;
          console.log('[CreateGradeSimple] Trying fallback URL:', fallbackUrl);
          directionsRes = await axios.get(fallbackUrl, config);
        }
        
        console.log('[CreateGradeSimple] Directions response status:', directionsRes.status);
        console.log('[CreateGradeSimple] Directions response headers:', JSON.stringify(directionsRes.headers));
        console.log('[CreateGradeSimple] Directions data type:', typeof directionsRes.data, 
                   'Is array:', Array.isArray(directionsRes.data), 
                   'Length:', directionsRes.data?.length || 0);
                   
        // More detailed inspection of response data
        if (directionsRes.data) {
          console.log('[CreateGradeSimple] Raw directions data sample:', 
            JSON.stringify(directionsRes.data?.slice(0, 1) || 'No data'));
            
          // Check if data is properly structured
          if (Array.isArray(directionsRes.data) && directionsRes.data.length > 0) {
            console.log('[CreateGradeSimple] First direction object keys:', 
              Object.keys(directionsRes.data[0]).join(', '));
          }
        } else {
          console.error('[CreateGradeSimple] Directions response data is null or undefined');
        }
      } catch (dirError) {
        console.error('[CreateGradeSimple] Failed to fetch directions:', dirError);
        console.error('Error name:', dirError.name);
        console.error('Error message:', dirError.message);
        console.error('Error stack:', dirError.stack);
        if (dirError.response) {
          console.error('Response status:', dirError.response.status);
          console.error('Response headers:', JSON.stringify(dirError.response.headers));
          console.error('Response data:', JSON.stringify(dirError.response.data));
        } else if (dirError.request) {
          console.error('Request was made but no response received:', dirError.request);
        }
        toast.error(`Failed to load directions: ${dirError.message}. Check console for details.`);
      }
      
      // Get subjects with detailed error handling
      try {
        // Force URL without slash to be consistent
        const subjectsUrl = buildApiUrl('/api/subjects');
        console.log('[CreateGradeSimple] Requesting subjects from:', subjectsUrl);
        
        // Use direct API_URL with manual normalization as fallback if buildApiUrl fails
        try {
          subjectsRes = await axios.get(subjectsUrl, config);
        } catch (subUrlError) {
          console.warn('[CreateGradeSimple] First attempt for subjects failed, trying alternate URL format');
          const fallbackUrl = `${API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL}/api/subjects`;
          console.log('[CreateGradeSimple] Trying fallback URL for subjects:', fallbackUrl);
          subjectsRes = await axios.get(fallbackUrl, config);
        }
        
        console.log('[CreateGradeSimple] Subjects response status:', subjectsRes.status);
        console.log('[CreateGradeSimple] Subjects response headers:', JSON.stringify(subjectsRes.headers));
        console.log('[CreateGradeSimple] Subjects data type:', typeof subjectsRes.data, 
                   'Is array:', Array.isArray(subjectsRes.data), 
                   'Length:', subjectsRes.data?.length || 0);
                   
        // More detailed inspection of response data
        if (subjectsRes.data) {
          console.log('[CreateGradeSimple] Raw subjects data sample:', 
            JSON.stringify(subjectsRes.data?.slice(0, 1) || 'No data'));
            
          // Check if data is properly structured
          if (Array.isArray(subjectsRes.data) && subjectsRes.data.length > 0) {
            console.log('[CreateGradeSimple] First subject object keys:', 
              Object.keys(subjectsRes.data[0]).join(', '));
          }
        } else {
          console.error('[CreateGradeSimple] Subjects response data is null or undefined');
        }
      } catch (subError) {
        console.error('[CreateGradeSimple] Failed to fetch subjects:', subError);
        console.error('Error name:', subError.name);
        console.error('Error message:', subError.message);
        console.error('Error stack:', subError.stack);
        if (subError.response) {
          console.error('Response status:', subError.response.status);
          console.error('Response headers:', JSON.stringify(subError.response.headers));
          console.error('Response data:', JSON.stringify(subError.response.data));
        } else if (subError.request) {
          console.error('Request was made but no response received:', subError.request);
        }
        toast.error(`Failed to load subjects: ${subError.message}. Check console for details.`);
      }
      
      // Set directions, with defensive checks
      if (Array.isArray(directionsRes.data)) {
        console.log('[CreateGradeSimple] Setting directions state with', directionsRes.data.length, 'items');
        setDirections(directionsRes.data);
      } else {
        console.error('[CreateGradeSimple] Directions data is not an array:', directionsRes.data);
        setDirections([]);
      }
      
      // Set subjects, with defensive checks
      if (Array.isArray(subjectsRes.data)) {
        console.log('[CreateGradeSimple] Setting subjects state with', subjectsRes.data.length, 'items');
        setSubjects(subjectsRes.data);
      } else {
        console.error('[CreateGradeSimple] Subjects data is not an array:', subjectsRes.data);
        setSubjects([]);
      }
      
      // Apply initial filtering based on teacher data
      if (teacherSubjects.length > 0 && !isAdmin) {
        console.log('[CreateGradeSimple] Using teacher subjects for filtering:', teacherSubjects.length, 'items');
        setFilteredSubjects(teacherSubjects);
      } else if (Array.isArray(subjectsRes.data)) {
        console.log('[CreateGradeSimple] Using API subjects for filtering:', subjectsRes.data.length, 'items');
        setFilteredSubjects(subjectsRes.data || []);
      } else {
        console.warn('[CreateGradeSimple] No subjects available for filtering');
        setFilteredSubjects([]);
      }
    } catch (error) {
      handleAxiosError(error, 'loadInitialData');
      toast.error('Failed to load initial data. Please refresh the page.');
    } finally {
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
      if (teacherSubjects.length > 0 && !isAdmin) {
        console.log('[CreateGradeSimple] Using teacher subjects for filtering (no direction selected)');
        setFilteredSubjects(teacherSubjects);
      } else {
        console.log('[CreateGradeSimple] Using all subjects for filtering (no direction selected)');
        setFilteredSubjects(subjects);
      }
      return; // Early return when no direction is selected
    }
    
    // Direction is selected, load subjects for that direction
    const loadDirectionSubjects = async () => {
      if (!selectedDirection || !user?.token) return;
    
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Normalize API URL - ensure no trailing slash
      let baseUrl = API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      const timestamp = new Date().getTime();
      const requestUrl = `${baseUrl}/api/subjects/direction/${selectedDirection}?_t=${timestamp}`;
      console.log('[CreateGradeSimple] Loading subjects for direction:', selectedDirection);
      console.log('[CreateGradeSimple] Sending request to:', requestUrl);
      
      try {
        const response = await axios.get(requestUrl, config);
        console.log('[CreateGradeSimple] Direction subjects response status:', response.status);
        console.log('[CreateGradeSimple] Direction subjects data type:', typeof response.data, 
                   'Is array:', Array.isArray(response.data), 
                   'Length:', response.data?.length || 0);
      
        // Debug raw response data
        console.log('[CreateGradeSimple] Raw direction subjects data sample:', 
          JSON.stringify(response.data?.slice(0, 1) || 'No data'));
      
        if (isMounted.current && Array.isArray(response.data)) {
          // If teacher subjects available, filter API results
          if (teacherSubjects.length > 0 && !isAdmin) {
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
        } else {
          console.error('[CreateGradeSimple] Direction subjects data is not an array or component unmounted');
          setFilteredSubjects([]);
        }
      } catch (dirSubError) {
        console.error('[CreateGradeSimple] Failed to load subjects for direction:', dirSubError.message);
        if (dirSubError.response) {
          console.error('Response status:', dirSubError.response.status);
          console.error('Response data:', dirSubError.response.data);
        }
        toast.error(`Failed to load subjects: ${dirSubError.message}`);
      }
    } catch (error) {
      handleAxiosError(error, 'loadDirectionSubjects');
      // Client-side fallback
      const filtered = filterSubjectsByDirection(subjects, selectedDirection);
      
      // Apply teacher filter if available
      if (teacherSubjects.length > 0 && !isAdmin) {
        const teacherSubjectIds = new Set(teacherSubjects.map(s => s._id));
        const teacherFiltered = filtered.filter(s => teacherSubjectIds.has(s._id));
        setFilteredSubjects(teacherFiltered);
      } else {
        setFilteredSubjects(filtered);
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
      
      // Normalize API URL - ensure no trailing slash
      let baseUrl = API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      // Get students for selected subject using normalized API_URL
      const timestamp = new Date().getTime();
      console.log(`[CreateGradeSimple] Loading students for subject: ${formData.subject}`);
      console.log('[CreateGradeSimple] Using normalized API_URL:', baseUrl);
      
      try {
        const requestUrl = `${baseUrl}/api/students/subject/${formData.subject}?_t=${timestamp}`;
        console.log('[CreateGradeSimple] Sending request to:', requestUrl);
        const response = await axios.get(requestUrl, config);
        
        console.log('[CreateGradeSimple] Students response status:', response.status);
        console.log('[CreateGradeSimple] Students data type:', typeof response.data, 
                   'Is array:', Array.isArray(response.data), 
                   'Length:', response.data?.length || 0);
        
        // Debug raw response data
        console.log('[CreateGradeSimple] Raw students data sample:', 
          JSON.stringify(response.data?.slice(0, 1) || 'No data'));
      
        if (isMounted.current && Array.isArray(response.data)) {
          // If teacher students available, filter API results
          if (teacherStudents.length > 0 && !isAdmin) {
            const teacherStudentIds = new Set(teacherStudents.map(s => s._id));
            const filteredResults = response.data.filter(student => teacherStudentIds.has(student._id));
            setFilteredStudents(filteredResults);
            console.log(`[CreateGradeSimple] Filtered ${filteredResults.length} teacher students from API results`);
          } else {
            setFilteredStudents(response.data);
            console.log(`[CreateGradeSimple] Loaded ${response.data.length} students for subject ${formData.subject}`);
          }
        } else {
          console.error('[CreateGradeSimple] Students data is not an array or component unmounted');
          setFilteredStudents([]);
        }
      } catch (studentError) {
        console.error('[CreateGradeSimple] Failed to load students:', studentError.message);
        if (studentError.response) {
          console.error('Response status:', studentError.response.status);
          console.error('Response data:', studentError.response.data);
        }
        toast.error(`Failed to load students: ${studentError.message}`);
        setFilteredStudents([]);
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
  console.log('[CreateGradeSimple] Running initial data load effect');
  loadInitialData();
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
