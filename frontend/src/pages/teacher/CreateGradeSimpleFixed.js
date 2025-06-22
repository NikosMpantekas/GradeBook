// Main component for CreateGradeSimple
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-toastify';

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
      console.log('[CreateGradeSimple] Loading classes for teacher:', user.user?._id);
      const response = await axios.get('/api/classes', config);
      
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
      
      // Fetch directions and subjects in parallel
      const [directionsRes, subjectsRes] = await Promise.all([
        axios.get('/api/directions', config),
        axios.get('/api/subjects', config)
      ]);
      
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
      if (teacherSubjects.length > 0) {
        setFilteredSubjects(teacherSubjects);
      } else {
        setFilteredSubjects(subjects);
      }
      return;
    }
    
    // If direction is selected, load subjects for that direction
    const loadDirectionSubjects = async () => {
      if (!user || !user.token || !selectedDirection) return;
      
      setLoading(true);
      try {
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
        
        console.log(`[CreateGradeSimple] Loading students for subject: ${formData.subject}, user role: ${user.user?.role}`);
        
        let response;
        const timestamp = new Date().getTime();
        
        // Use new class-based endpoint for teachers, fallback to old endpoint for admins
        if (user.user?.role === 'teacher') {
          // NEW CLASS-BASED LOGIC: Get students from teacher's classes for specific subject
          response = await axios.get(`/api/students/teacher/subject/${formData.subject}?_t=${timestamp}`, config);
          console.log(`[CreateGradeSimple] Using new class-based endpoint for teacher`);
        } else {
          // LEGACY LOGIC: Admins still use the old subject-based endpoint
          response = await axios.get(`/api/students/subject/${formData.subject}?_t=${timestamp}`, config);
          console.log(`[CreateGradeSimple] Using legacy subject-based endpoint for admin`);
        }
        
        if (isMounted.current && Array.isArray(response.data)) {
          setFilteredStudents(response.data);
          console.log(`[CreateGradeSimple] Loaded ${response.data.length} students for subject ${formData.subject}`);
          
          // Log class information for debugging (only available in new endpoint)
          if (user.user?.role === 'teacher' && response.data.length > 0 && response.data[0].classes) {
            console.log(`[CreateGradeSimple] Students with class context:`, 
              response.data.map(s => ({
                name: s.name,
                classes: s.classes?.map(c => `${c.className} (${c.subject})`)
              }))
            );
          }
        }
      } catch (error) {
        if (isMounted.current) {
          handleAxiosError(error, 'loadStudents');
          
          // Client-side fallback - only for backward compatibility
          console.warn('[CreateGradeSimple] API failed, falling back to client-side filtering');
          
          if (teacherStudents.length > 0 && !isAdmin) {
            const teacherStudentIds = new Set(teacherStudents.map(s => s._id));
            const filtered = subjects.filter(s => s._id === formData.subject)[0]?.students || [];
            const teacherFiltered = filtered.filter(s => teacherStudentIds.has(s._id));
            setFilteredStudents(teacherFiltered);
            console.log(`[CreateGradeSimple] Fallback: filtered to ${teacherFiltered.length} teacher students`);
          } else {
            const filtered = filterStudentsBySubject(subjects, formData.subject);
            setFilteredStudents(filtered);
            console.log(`[CreateGradeSimple] Fallback: loaded ${filtered.length} students from local data`);
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
