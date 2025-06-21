import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Alert,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { createGrade, reset } from '../../features/grades/gradeSlice';
import axios from 'axios';

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
  // eslint-disable-next-line no-unused-vars
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
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
  
  // Load all directions on component mount
  useEffect(() => {
    const loadDirections = async () => {
      setLoading(true);
      try {
        if (user && user.token) {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
          
          // Get all directions
          const response = await axios.get('/api/directions', config);
          if (Array.isArray(response.data)) {
            setDirections(response.data);
            console.log(`[CreateGradeSimple] Loaded ${response.data.length} directions`);
          }
        }
      } catch (error) {
        handleAxiosError(error, 'loadDirections');
      } finally {
        setLoading(false);
      }
    };
    
    loadDirections();
  }, [user]);
  
  // Reference to track if component is mounted
  const isMounted = React.useRef(true);
  
  // Only load all data once when the component mounts
  useEffect(() => {
    // Create a consolidated data loading function
    const loadInitialData = async () => {
      if (!user || !user.token) {
        console.error('[CreateGradeSimple] No user token available');
        return;
      }
      
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      try {
        // 1. Load all directions
        console.log('[CreateGradeSimple] Loading all directions');
        const directionsResponse = await axios.get('/api/directions', config);
        if (isMounted.current && Array.isArray(directionsResponse.data)) {
          setDirections(directionsResponse.data);
          console.log(`[CreateGradeSimple] Loaded ${directionsResponse.data.length} directions`);
        }
        
        // 2. Load all subjects
        console.log('[CreateGradeSimple] Loading all subjects');
        const subjectsResponse = await axios.get('/api/subjects', config);
        if (isMounted.current && Array.isArray(subjectsResponse.data)) {
          setSubjects(subjectsResponse.data);
          setFilteredSubjects(subjectsResponse.data); // Initially show all subjects
          console.log(`[CreateGradeSimple] Loaded ${subjectsResponse.data.length} subjects`);
        }
      } catch (error) {
        if (isMounted.current) {
          handleAxiosError(error, 'loadInitialData');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    loadInitialData();
    
    // Cleanup function to prevent memory leaks and state updates on unmounted component
    return () => {
      isMounted.current = false;
    };
  }, [user]);
  
  // Filter subjects when direction changes (no API call)
  useEffect(() => {
    if (!selectedDirection) {
      // If no direction is selected, show all subjects
      setFilteredSubjects(subjects);
      return;
    }
    
    console.log(`[CreateGradeSimple] Filtering subjects for direction: ${selectedDirection}`);
    
    // If we have a selected direction, make a dedicated API call for it
    const loadDirectionSubjects = async () => {
      if (!user?.token || !isMounted.current) return;
      
      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        // Add a cache buster to prevent unnecessary cached responses
        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/subjects/direction/${selectedDirection}?_t=${timestamp}`, config);
        
        if (isMounted.current && Array.isArray(response.data)) {
          setFilteredSubjects(response.data);
          console.log(`[CreateGradeSimple] Loaded ${response.data.length} subjects for direction ${selectedDirection}`);
          
          // Reset subject selection if it's not in the new list
          const subjectStillValid = response.data.some(s => s._id === formData.subject);
          if (formData.subject && !subjectStillValid) {
            setFormData(prev => ({
              ...prev,
              subject: '',
              student: '' // Also reset student when subject is reset
            }));
          }
        }
      } catch (error) {
        if (isMounted.current) {
          handleAxiosError(error, 'loadDirectionSubjects');
          // Filter existing subjects client-side as fallback
          const filtered = subjects.filter(subject => {
            // Check if the subject has this direction
            return subject.directions && 
                  Array.isArray(subject.directions) && 
                  subject.directions.some(dir => {
                    const dirId = typeof dir === 'object' ? dir?._id : dir;
                    return dirId === selectedDirection;
                  });
          });
          setFilteredSubjects(filtered);
          console.log(`[CreateGradeSimple] Fallback: filtered ${filtered.length} subjects client-side`);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    loadDirectionSubjects();
    
    // This effect should only run when selectedDirection changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDirection]);
  
  // Load students when subject changes (only when subject actually changes)
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
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        // Try to get students for this specific subject
        console.log(`[CreateGradeSimple] Loading students for subject: ${formData.subject}`);
        // Add cache buster to prevent unnecessary API calls
        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/students/subject/${formData.subject}?_t=${timestamp}`, config);
        
        // Check if this effect is still relevant before updating state
        if (!isEffectActive) return;
        
        if (Array.isArray(response.data)) {
          // Further filter by direction if one is selected
          let studentsToShow = response.data;
          
          if (selectedDirection) {
            studentsToShow = response.data.filter(student => {
              // Handle both populated and unpopulated direction
              const studentDirId = typeof student.direction === 'object' 
                ? student.direction?._id 
                : student.direction;
              
              return studentDirId && studentDirId.toString() === selectedDirection;
            });
            
            console.log(`[CreateGradeSimple] Filtered to ${studentsToShow.length} students in direction ${selectedDirection}`);
          }
          
          if (isEffectActive) {
            setFilteredStudents(studentsToShow);
            console.log(`[CreateGradeSimple] Loaded ${studentsToShow.length} students for subject ${formData.subject}`);
            
            // Reset student selection if it's not in the new list
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
        if (isEffectActive) {
          handleAxiosError(error, 'loadStudents');
          // Try to get all students as fallback
          try {
            const config = {
              headers: {
                Authorization: `Bearer ${user.token}`
              }
            };
            const fallbackResponse = await axios.get('/api/students', config);
            
            // Check again if this effect is still relevant
            if (!isEffectActive) return;
            
            if (Array.isArray(fallbackResponse.data)) {
              // Filter by direction if one is selected
              let allStudents = fallbackResponse.data;
              
              if (selectedDirection) {
                allStudents = allStudents.filter(student => {
                  const studentDirId = typeof student.direction === 'object' 
                    ? student.direction?._id 
                    : student.direction;
                  
                  return studentDirId && studentDirId.toString() === selectedDirection;
                });
              }
              
              if (isEffectActive) {
                setFilteredStudents(allStudents);
                console.log(`[CreateGradeSimple] Fallback loaded ${allStudents.length} students (all)`);
              }
            }
          } catch (fallbackError) {
            if (isEffectActive) {
              console.error('[CreateGradeSimple] Fallback error:', fallbackError);
              setFilteredStudents([]);
            }
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
    
    // Only depend on subject and direction to prevent unnecessary API calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subject, selectedDirection]);
  
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
        sx={{ mb: 2 }}
        variant="outlined"
      >
        Back to Grades
      </Button>
      
      <Paper elevation={3} sx={{ p: 4, mb: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Create New Grade
        </Typography>
        
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
                  sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                  startAdornment={selectedDirection && <SchoolIcon color="primary" sx={{ ml: 1, mr: 1 }} />}
                >
                  <MenuItem value="">All Directions</MenuItem>
                  {directions.length > 0 ? (
                    directions.map((direction) => (
                      <MenuItem key={direction._id} value={direction._id}>
                        {direction.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No directions available</MenuItem>
                  )}
                </Select>
                <FormHelperText>
                  Select a direction to filter subjects and students
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {/* 2. Subject Selection (Second) */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.subject} sx={{ mb: { xs: 0, md: 2 } }}>
                <InputLabel id="subject-label">Subject *</InputLabel>
                <Select
                  labelId="subject-label"
                  name="subject"
                  value={formData.subject}
                  label="Subject *"
                  onChange={onChange}
                  disabled={isLoading || loading}
                  sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                  startAdornment={formData.subject && <BookIcon color="primary" sx={{ ml: 1, mr: 1 }} />}
                >
                  <MenuItem value="">Select a subject</MenuItem>
                  {loading && filteredSubjects.length === 0 ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Loading subjects...
                      </Box>
                    </MenuItem>
                  ) : filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No subjects available</MenuItem>
                  )}
                </Select>
                {formErrors.subject ? (
                  <FormHelperText error>{formErrors.subject}</FormHelperText>
                ) : (
                  <FormHelperText>
                    {loading ? 'Loading subjects...' : 
                     filteredSubjects.length === 0 ? 
                      (selectedDirection ? 'No subjects found for this direction' : 'No subjects found') : 
                      'Select the subject for this grade'}
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
                  value={formData.student}
                  label="Student *"
                  onChange={onChange}
                  disabled={isLoading || loading || !formData.subject}
                  sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                  startAdornment={formData.student && <PersonIcon color="primary" sx={{ ml: 1, mr: 1 }} />}
                >
                  <MenuItem value="">Select a student</MenuItem>
                  {loading && formData.subject ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Loading students...
                      </Box>
                    </MenuItem>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No students available</MenuItem>
                  )}
                </Select>
                {formErrors.student ? (
                  <FormHelperText error>{formErrors.student}</FormHelperText>
                ) : (
                  <FormHelperText>
                    {loading && formData.subject ? 'Loading students...' : 
                     !formData.subject ? 'Select a subject first' : 
                     filteredStudents.length === 0 ? 'No students found for selected criteria' : 
                     'Select the student to grade'}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={isLoading || loading}
                  sx={{ px: 3, py: 1.2 }}
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
                  sx={{ px: 4, py: 1.2, borderRadius: 2 }}
                >
                  {isLoading ? 'Saving...' : 'Save Grade'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateGradeSimple;
