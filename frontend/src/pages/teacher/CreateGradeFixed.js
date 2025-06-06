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
 * CreateGradeFixed - Revised version with proper field order and filtering
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
  const [students, setStudents] = useState([]);
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
    console.error(`[CreateGradeFixed] Error in ${context}:`, error);
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
            console.log(`[CreateGradeFixed] Loaded ${response.data.length} directions`);
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
  
  // Load subjects when direction changes
  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedDirection) {
        // Load all subjects if no direction is selected
        try {
          if (user && user.token) {
            setLoading(true);
            const config = {
              headers: {
                Authorization: `Bearer ${user.token}`
              }
            };
            
            const response = await axios.get('/api/subjects', config);
            if (Array.isArray(response.data)) {
              setSubjects(response.data);
              setFilteredSubjects(response.data);
              console.log(`[CreateGradeFixed] Loaded ${response.data.length} subjects (all)`);
            }
          }
        } catch (error) {
          handleAxiosError(error, 'loadAllSubjects');
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // Load subjects for the selected direction
      setLoading(true);
      try {
        if (user && user.token) {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
          
          console.log(`[CreateGradeFixed] Loading subjects for direction: ${selectedDirection}`);
          const response = await axios.get(`/api/subjects/direction/${selectedDirection}`, config);
          
          if (Array.isArray(response.data)) {
            setFilteredSubjects(response.data);
            console.log(`[CreateGradeFixed] Loaded ${response.data.length} subjects for direction ${selectedDirection}`);
            
            // Reset subject selection if it's not in the new list
            const subjectStillValid = response.data.some(s => s._id === formData.subject);
            if (formData.subject && !subjectStillValid) {
              setFormData(prev => ({
                ...prev,
                subject: '',
                student: '' // Also reset student when subject is reset
              }));
            }
          } else {
            console.warn('[CreateGradeFixed] Non-array response from subjects API:', response.data);
            setFilteredSubjects([]);
          }
        }
      } catch (error) {
        handleAxiosError(error, 'loadSubjectsByDirection');
        // Fallback to all subjects
        setFilteredSubjects(subjects);
      } finally {
        setLoading(false);
      }
    };
    
    loadSubjects();
  }, [selectedDirection, user, subjects]);
  
  // Load students when subject changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!formData.subject) {
        setFilteredStudents([]);
        return; // Don't load students if no subject is selected
      }
      
      setLoading(true);
      try {
        if (user && user.token) {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
          
          // Try to get students for this specific subject
          console.log(`[CreateGradeFixed] Loading students for subject: ${formData.subject}`);
          const response = await axios.get(`/api/students/subject/${formData.subject}`, config);
          
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
              
              console.log(`[CreateGradeFixed] Filtered to ${studentsToShow.length} students in direction ${selectedDirection}`);
            }
            
            setFilteredStudents(studentsToShow);
            console.log(`[CreateGradeFixed] Loaded ${studentsToShow.length} students for subject ${formData.subject}`);
            
            // Reset student selection if not in the new list
            const studentStillValid = studentsToShow.some(s => s._id === formData.student);
            if (formData.student && !studentStillValid) {
              setFormData(prev => ({
                ...prev,
                student: ''
              }));
            }
          } else {
            console.warn('[CreateGradeFixed] Non-array response from students API:', response.data);
            setFilteredStudents([]);
          }
        }
      } catch (error) {
        handleAxiosError(error, 'loadStudents');
        setFilteredStudents([]);
        
        // Try to get all students as fallback
        try {
          if (user && user.token) {
            const config = {
              headers: {
                Authorization: `Bearer ${user.token}`
              }
            };
            const fallbackResponse = await axios.get('/api/students', config);
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
              
              setFilteredStudents(allStudents);
              console.log(`[CreateGradeFixed] Fallback loaded ${allStudents.length} students (all)`);
            }
          }
        } catch (fallbackError) {
          console.error('[CreateGradeFixed] Fallback error:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadStudents();
  }, [formData.subject, selectedDirection, user]);
  
  // Handle direction change
  const handleDirectionChange = (e) => {
    const directionId = e.target.value;
    console.log(`[CreateGradeFixed] Direction changed to: ${directionId}`);
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
    console.log(`[CreateGradeFixed] Field changed: ${name} = ${value}`);
    
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
  
  // Handle form submission
  const onSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please check form for errors');
      return;
    }
    
    try {
      const gradeData = {
        student: formData.student,
        subject: formData.subject,
        value: formData.value,
        description: formData.description,
        date: formData.date,
      };
      
      console.log('[CreateGradeFixed] Submitting grade:', gradeData);
      dispatch(createGrade(gradeData));
    } catch (error) {
      console.error('[CreateGradeFixed] Error submitting form:', error);
      setFormErrors({
        form: 'An unexpected error occurred. Please try again.'
      });
    }
  };
  
  // Handle successful grade creation
  useEffect(() => {
    if (isSuccess) {
      resetForm();
      toast.success('Grade created successfully');
      navigate('/app/teacher/grades/manage');
    }
    
    return () => {
      dispatch(reset());
    };
  }, [isSuccess, navigate, dispatch]);
  
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
