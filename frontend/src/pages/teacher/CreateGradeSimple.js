// CreateGradeSimple.js - Class-based implementation
// This file was recreated from CreateGradeSimpleFixed.js to fix build errors
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Box, Button, Typography, TextField, MenuItem, Paper, Grid, CircularProgress, Autocomplete } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { getTeacherSubjects, getTeacherDirections, getTeacherClasses } from '../../features/teacher/teacherSlice';
import { handleAxiosError, filterStudentsBySubject, filterTeacherStudents } from './CreateGradeUtils';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ClassIcon from '@mui/icons-material/Class';
import StudentErrorBoundary from '../../components/common/ErrorBoundary';
import logger from '../../services/loggerService';
import elGR from 'date-fns/locale/el';
import enUS from 'date-fns/locale/en-US';

const CreateGradeSimple = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get user from Redux store
  const { user } = useSelector((state) => state.auth);
  const { subjects, directions, teacherClasses, isLoading: isTeacherDataLoading } = useSelector((state) => state.teacher);
  
  // Determine if user is admin (for different UI paths)
  const isAdmin = user?.user?.role === 'admin' || user?.user?.role === 'superadmin';
  
  // State for form data
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    direction: '',
    schoolBranch: '',
    value: '',
    comments: '',
    date: new Date(),
  });
  
  // Component-level state
  const [loading, setLoading] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [studentSelectionError, setStudentSelectionError] = useState(false);
  const isMounted = useRef(true);
  
  // Effect to ensure component state is cleaned up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Load form data dependencies when component mounts
  useEffect(() => {
    if (user && user.token) {
      // Load teacher subjects, directions, and classes
      loadTeacherData();
      
      // Reset the form when component mounts
      resetForm();
    }
  }, [user]);
  
  // Load teacher-specific data (subjects, directions, classes)
  const loadTeacherData = async () => {
    try {
      // Dispatch actions to load teacher data
      await dispatch(getTeacherSubjects()).unwrap();
      await dispatch(getTeacherDirections()).unwrap();
      await dispatch(getTeacherClasses()).unwrap();
      
      // Log loaded data
      console.log('[CreateGradeSimple] Loaded teacher data');
    } catch (error) {
      console.error('[CreateGradeSimple] Error loading teacher data:', error);
      toast.error('Failed to load teacher data. Please try again.');
    }
  };
  
  // Reset the form to default values
  const resetForm = () => {
    setFormData({
      student: '',
      subject: '',
      direction: '',
      schoolBranch: '',
      value: '',
      comments: '',
      date: new Date(),
    });
    setFilteredStudents([]);
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
    // If subject changed, load students for that subject
    if (name === 'subject' && value) {
      loadStudents();
    }
    
    // Reset student selection error
    if (name === 'student' && value) {
      setStudentSelectionError(false);
    }
  };
  
  // Handle date change from date picker
  const handleDateChange = (date) => {
    setFormData((prevState) => ({
      ...prevState,
      date,
    }));
  };
  
  // Load students based on selected subject
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
  
  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.student) {
      setStudentSelectionError(true);
      toast.error('Please select a student');
      return;
    }
    
    // Check for missing required fields
    const requiredFields = ['subject', 'value'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Check if grade value is within range
    if (formData.value < 0 || formData.value > 100) {
      toast.error('Grade value must be between 0 and 100');
      return;
    }
    
    setLoading(true);
    
    try {
      const gradeData = {
        student: formData.student,
        subject: formData.subject,
        value: formData.value,
        comments: formData.comments,
        date: formData.date || new Date(),
      };
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      // Log the grade data being sent
      console.log('[CreateGradeSimple] Submitting grade data:', {
        ...gradeData,
        studentName: filteredStudents.find(s => s._id === formData.student)?.name || 'Unknown Student'
      });
      
      // Submit grade data to API
      const response = await axios.post('/api/grades', gradeData, config);
      
      // Handle successful response
      if (response.data) {
        toast.success('Grade added successfully');
        resetForm();
      } else {
        toast.warning('Grade created but no data returned');
      }
      
    } catch (error) {
      handleAxiosError(error, 'submit grade');
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        toast.error('You are not authorized to add grades for this student with this subject');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid grade data');
      } else {
        toast.error('Failed to add grade. Please try again.');
      }
      
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <StudentErrorBoundary componentName="CreateGradeSimple">
      <Paper
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          mb: 4,
          maxWidth: '800px',
          mx: 'auto',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Add Grade
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Subject Selection */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Select Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <BookIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              >
                {/* Map available subjects to menu items */}
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            {/* Student Selection */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                disabled={!formData.subject || loading}
                label="Select Student"
                name="student"
                value={formData.student}
                onChange={handleChange}
                required
                error={studentSelectionError}
                helperText={studentSelectionError ? 'Please select a student' : ''}
                InputProps={{
                  startAdornment: <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              >
                {/* Map filtered students to menu items */}
                {filteredStudents.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name}
                    {student.classes && student.classes.length > 0 && (
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        ({student.classes[0].className})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            {/* Grade Value */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Grade Value (0-100)"
                name="value"
                value={formData.value}
                onChange={handleChange}
                required
                InputProps={{
                  inputProps: { min: 0, max: 100 },
                }}
              />
            </Grid>
            
            {/* Date Picker */}
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={elGR}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Comments */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
              />
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ minWidth: '120px' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Add Grade'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </StudentErrorBoundary>
  );
};

export default CreateGradeSimple;
