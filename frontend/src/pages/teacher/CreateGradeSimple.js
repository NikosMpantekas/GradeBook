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
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { createGrade, reset } from '../../features/grades/gradeSlice';
import { getSubjectsByTeacher } from '../../features/subjects/subjectSlice';
import { getStudentsBySubject, getStudents } from '../../features/students/studentSlice';
import axios from 'axios';

/**
 * SIMPLIFIED VERSION: CreateGradeSimple
 * This is a simplified version of the CreateGrade component that avoids complex Redux patterns
 * that were causing the TypeError in production.
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
  
  // Handle errors from axios and apply fallbacks
  const handleAxiosError = (error, context) => {
    console.error(`[CreateGradeSimple] Error in ${context}:`, error);
    const errorMessage = error.response?.data?.message || 'Network error. Please try again.';
    toast.error(errorMessage);
    return []; // Fallback empty array
  };
  
  // Load initial data (subjects and directions)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load teacher's subjects directly with axios
        if (user && user._id && user.token) {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
          
          // Get subjects taught by this teacher
          const subjectsResponse = await axios.get(
            `/api/subjects/teacher/${user._id}`, 
            config
          );
          
          if (Array.isArray(subjectsResponse.data)) {
            setSubjects(subjectsResponse.data);
            console.log(`[CreateGradeSimple] Loaded ${subjectsResponse.data.length} subjects`);
          }
          
          // Get all directions
          const directionsResponse = await axios.get('/api/directions', config);
          if (Array.isArray(directionsResponse.data)) {
            setDirections(directionsResponse.data);
            console.log(`[CreateGradeSimple] Loaded ${directionsResponse.data.length} directions`);
          }
        }
      } catch (error) {
        handleAxiosError(error, 'loadInitialData');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Reset grade state when component unmounts
    return () => {
      dispatch(reset());
    };
  }, [user, dispatch]);
  
  // Load students when subject changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!formData.subject) {
        setStudents([]);
        return;
      }
      
      try {
        setLoading(true);
        
        // Reset student selection when subject changes
        setFormData(prev => ({ ...prev, student: '' }));
        
        if (user && user.token) {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
          
          // Try to get students by subject
          const response = await axios.get(
            `/api/students/subject/${formData.subject}`,
            config
          );
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            setStudents(response.data);
            console.log(`[CreateGradeSimple] Loaded ${response.data.length} students for subject`);
          } else {
            // If no students found for subject, get all students
            const allStudentsResponse = await axios.get('/api/students', config);
            if (Array.isArray(allStudentsResponse.data)) {
              setStudents(allStudentsResponse.data);
              console.log(`[CreateGradeSimple] Loaded ${allStudentsResponse.data.length} students (all)`);
            }
          }
        }
      } catch (error) {
        handleAxiosError(error, 'loadStudents');
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
              setStudents(fallbackResponse.data);
            }
          }
        } catch (fallbackError) {
          console.error('[CreateGradeSimple] Fallback error:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadStudents();
  }, [formData.subject, user]);
  
  // Filter students by direction
  const filteredStudents = selectedDirection
    ? students.filter(student => {
        // Handle both populated and unpopulated direction
        const studentDirId = typeof student.direction === 'object' 
          ? student.direction?._id 
          : student.direction;
        
        return studentDirId && studentDirId.toString() === selectedDirection;
      })
    : students;
  
  // Handle form input changes
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    
    // Clear validation errors when field is changed
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: undefined
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
    } else if (isNaN(formData.value) || formData.value < 0 || formData.value > 20) {
      errors.value = 'Grade must be a number between 0 and 20';
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
      
      // Dispatch action to create grade
      dispatch(createGrade(gradeData));
    } catch (error) {
      console.error('[CreateGradeSimple] Error submitting grade:', error);
      toast.error('Error creating grade. Please try again.');
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      student: '',
      subject: '',
      value: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setFormErrors({});
  };
  
  // Navigate back
  const goBack = () => {
    navigate('/app/teacher/grades/manage');
  };
  
  // Handle successful grade creation
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (isSuccess) {
      toast.success('Grade added successfully');
      navigate('/app/teacher/grades/manage');
    }
  }, [isError, isSuccess, message, navigate]);
  
  // Handle direction selection
  const handleDirectionChange = (e) => {
    setSelectedDirection(e.target.value);
  };
  
  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Create New Grade
          </Typography>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={goBack}
            variant="outlined"
          >
            Back to Grades
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Form */}
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Subject selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.subject}>
                <InputLabel id="subject-label">Subject</InputLabel>
                <Select
                  labelId="subject-label"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={onChange}
                  label="Subject"
                >
                  <MenuItem value="">Select a subject</MenuItem>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
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
                    {loading ? 'Loading subjects...' : subjects.length === 0 ? 'No subjects found' : 'Select the subject for this grade'}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

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
                sx={{ mb: { xs: 0, md: 2 }, '& .MuiInputBase-input': { py: 1.5 } }}
              />
            </Grid>

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
                >
                  <MenuItem value="">Select a student</MenuItem>
                  {loading ? (
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
                    <MenuItem disabled>No students available for this subject</MenuItem>
                  )}
                </Select>
                {formErrors.student ? (
                  <FormHelperText error>{formErrors.student}</FormHelperText>
                ) : (
                  <FormHelperText>
                    {loading ? 'Loading students...' : !formData.subject ? 'Select a subject first' : filteredStudents.length === 0 ? 'No students found for this subject' : 'Select the student to grade'}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Value *"
                type="number"
                name="value"
                value={formData.value}
                onChange={onChange}
                InputProps={{
                  inputProps: { min: 0, max: 20, step: 0.5 },
                  sx: { py: 1.5 },
                }}
                error={!!formErrors.value}
                helperText={formErrors.value || 'Enter a value between 0 and 20'}
                disabled={isLoading}
                sx={{ mb: { xs: 0, md: 2 } }}
              />
            </Grid>

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
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { padding: 1.5 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={isLoading || loading}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={isLoading || loading}
                >
                  {isLoading ? 'Saving...' : 'Save Grade'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateGradeSimple;
