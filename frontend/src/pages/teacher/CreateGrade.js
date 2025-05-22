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
// Using standard date input fields instead of DatePicker component
// to avoid dependency issues
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { createGrade, reset } from '../../features/grades/gradeSlice';
import { getSubjectsByTeacher } from '../../features/subjects/subjectSlice';
import { getStudentsBySubject, getStudents } from '../../features/students/studentSlice';

const CreateGrade = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.grades);
  const { subjects, isLoading: subjectsLoading } = useSelector((state) => state.subjects);
  const { students, isLoading: studentsLoading } = useSelector((state) => state.students);
  
  const [studentsToSelect, setStudentsToSelect] = useState([]);
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState('');
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    value: '',
    description: '',
    date: new Date(),
  });
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Load subjects taught by this teacher
    dispatch(getSubjectsByTeacher(user._id));
    
    // Fetch directions for the filter
    fetch('/api/directions', {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        setDirections(data);
      })
      .catch(error => {
        console.error('Error fetching directions:', error);
      });
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, user._id, user.token]);
  
  // When a subject is selected, fetch students for that subject
  useEffect(() => {
    if (formData.subject) {
      console.log(`[CreateGrade] Subject selected: ${formData.subject}, fetching students...`);
      
      // Reset student selection
      setFormData(prev => ({ ...prev, student: '' }));
      
      // Try to get students for this subject
      dispatch(getStudentsBySubject(formData.subject))
        .unwrap()
        .then((data) => {
          console.log(`[CreateGrade] Successfully fetched ${data?.length || 0} students for subject`);
          
          // If no students found for subject, try to get all students as fallback
          if (!data || data.length === 0) {
            console.log('[CreateGrade] No students found for subject, trying to get all students');
            dispatch(getStudents())
              .unwrap()
              .then(allStudents => {
                console.log(`[CreateGrade] Loaded ${allStudents?.length || 0} total students`);
              })
              .catch(err => {
                console.error('[CreateGrade] Error loading all students:', err);
              });
          }
        })
        .catch((error) => {
          console.error('[CreateGrade] Error fetching students for subject:', error);
          // If this fails, load all students as a fallback
          dispatch(getStudents());
        });
    } else {
      // If no subject is selected, load all students so the dropdown is never empty
      console.log('[CreateGrade] No subject selected, loading all students as fallback');
      dispatch(getStudents());
    }
  }, [dispatch, formData.subject]);
  
  // Update students dropdown when students are fetched from API or direction changes
  useEffect(() => {
    console.log('[CreateGrade] Students data updated:', {
      studentsCount: students?.length || 0,
      selectedDirection,
      currentSubject: formData.subject
    });
    
    if (!students || !Array.isArray(students)) {
      console.warn('[CreateGrade] Students data is not an array:', students);
      setStudentsToSelect([]);
      return;
    }
    
    // Filter out any invalid student data and enhance with contact info
    let validStudents = students
      .filter(student => {
        const isValid = student && student._id && student.name && typeof student.name === 'string';
        if (!isValid) {
          console.warn('[CreateGrade] Found invalid student data:', student);
        }
        return isValid;
      })
      .map(student => ({
        ...student,
        // Ensure contact fields exist
        mobilePhone: student.mobilePhone || student.savedMobilePhone || '',
        personalEmail: student.personalEmail || student.savedPersonalEmail || '',
        // Ensure direction is properly set
        direction: student.direction || {},
        // Ensure subjects is an array
        subjects: Array.isArray(student.subjects) ? student.subjects : []
      }));
    
    // Apply direction filter if selected
    if (selectedDirection) {
      validStudents = validStudents.filter(student => {
        const directionMatch = student.direction && 
          (student.direction._id === selectedDirection || 
           student.direction === selectedDirection ||
           (typeof student.direction === 'object' && student.direction._id === selectedDirection));
        
        if (!directionMatch) {
          console.log(`[CreateGrade] Student ${student.name} filtered out by direction filter`, {
            studentDirection: student.direction,
            selectedDirection
          });
        }
        
        return directionMatch;
      });
    }
    
    console.log(`[CreateGrade] Found ${validStudents.length} valid students after filtering`);
    
    // If we have valid students, update the list
    if (validStudents.length > 0) {
      console.log('[CreateGrade] First valid student:', {
        id: validStudents[0]._id,
        name: validStudents[0].name,
        direction: validStudents[0].direction,
        subjects: validStudents[0].subjects,
        hasMobilePhone: !!validStudents[0].mobilePhone,
        hasPersonalEmail: !!validStudents[0].personalEmail
      });
      setStudentsToSelect(validStudents);
    } else {
      console.log('[CreateGrade] No valid students found after filtering');
      setStudentsToSelect([]);
    }
  }, [students, selectedDirection, formData.subject]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    // Only show success message and navigate if we actually created a grade
    // Not when component first loads
    if (isSuccess && formData.student !== '') {
      toast.success('Grade added successfully');
      navigate('/app/teacher/grades/manage');
    }
  }, [isError, isSuccess, message, navigate, formData.student]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the error for this field when it's modified
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    // Reset student selection when subject changes
    if (name === 'subject') {
      setFormData({
        ...formData,
        [name]: value,
        student: '' // Reset student
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Handler for direction filter change
  const handleDirectionChange = (e) => {
    setSelectedDirection(e.target.value);
    // Reset student selection when direction filter changes
    setFormData({
      ...formData,
      student: ''
    });
  };
  
  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      date: newDate,
    });
    
    // Clear date error if it exists
    if (formErrors.date) {
      setFormErrors({
        ...formErrors,
        date: '',
      });
    }
  };
  
  const validate = () => {
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
      const value = parseInt(formData.value, 10);
      if (isNaN(value) || value < 0 || value > 100) {
        errors.value = 'Grade must be between 0 and 100';
      }
    }
    
    if (!formData.date) {
      errors.date = 'Please select a date';
    } else if (formData.date > new Date()) {
      errors.date = 'Date cannot be in the future';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Create the base grade data
      const gradeData = {
        student: formData.student,
        subject: formData.subject,
        value: parseInt(formData.value, 10),
        date: format(formData.date, 'yyyy-MM-dd'),
        description: formData.description || '',
      };
      
      console.log('Creating grade with data:', gradeData);
      
      // First reset any previous state
      dispatch(reset());
      
      // Then create the grade
      dispatch(createGrade(gradeData))
        .unwrap()
        .then((result) => {
          console.log('Grade created successfully:', result);
          toast.success('Grade added successfully');
          navigate('/app/teacher/grades/manage');
        })
        .catch((error) => {
          console.error('Error creating grade:', error);
          toast.error(error || 'Failed to create grade');
        });
    }
  };
  
  const handleBack = () => {
    navigate('/app/teacher/grades/manage');
  };
  
  if (subjectsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Grades
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Add New Grade
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Direction Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="direction-filter-label">Filter by Direction</InputLabel>
                <Select
                  labelId="direction-filter-label"
                  id="direction-filter"
                  value={selectedDirection}
                  onChange={handleDirectionChange}
                  label="Filter by Direction"
                >
                  <MenuItem value="">
                    <em>All Directions</em>
                  </MenuItem>
                  {directions.map((direction) => (
                    <MenuItem key={direction._id} value={direction._id}>
                      {direction.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Filter students by their academic direction
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.subject}>
                <InputLabel id="subject-label">Subject *</InputLabel>
                <Select
                  labelId="subject-label"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  label="Subject *"
                  disabled={subjectsLoading}
                >
                  <MenuItem value="">
                    <em>Select a subject</em>
                  </MenuItem>
                  {subjectsLoading ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading subjects...
                      </Box>
                    </MenuItem>
                  ) : subjects && subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No subjects available</em>
                    </MenuItem>
                  )}
                </Select>
                <FormHelperText>
                  {formErrors.subject || 
                   (subjectsLoading ? 'Loading subjects...' : 
                    !subjects || subjects.length === 0 ? 'No subjects assigned to you' :
                    'Select the subject for this grade')}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.student}>
                <InputLabel id="student-label">Student *</InputLabel>
                <Select
                  labelId="student-label"
                  id="student"
                  name="student"
                  value={formData.student}
                  onChange={handleChange}
                  label="Student *"
                  disabled={!formData.subject || studentsLoading || studentsToSelect.length === 0}
                >
                  <MenuItem value="">
                    <em>Select a student</em>
                  </MenuItem>
                  {studentsLoading ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading students...
                      </Box>
                    </MenuItem>
                  ) : !formData.subject ? (
                    <MenuItem disabled>
                      <em>Select a subject first</em>
                    </MenuItem>
                  ) : studentsToSelect.length === 0 ? (
                    <MenuItem disabled>
                      <em>No students available for this subject</em>
                    </MenuItem>
                  ) : (
                    studentsToSelect.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>
                  {formErrors.student || 
                   (studentsLoading ? 'Loading students...' : 
                    !formData.subject ? 'Please select a subject first' :
                    studentsToSelect.length === 0 ? 'No students found for this subject' :
                    'Select the student to grade')}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Value *"
                name="value"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={formData.value}
                onChange={handleChange}
                error={!!formErrors.value}
                helperText={formErrors.value || 'Enter a grade value between 0 and 100'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                value={formData.date instanceof Date ? format(formData.date, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  handleDateChange(newDate);
                }}
                error={!!formErrors.date}
                helperText={formErrors.date || 'Select the date for this grade'}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: format(new Date(), 'yyyy-MM-dd') }}
              />
            </Grid>
            
            {/* Description field - only show if teacher has permission */}
            {(user?.canAddGradeDescriptions !== false) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description / Feedback"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isLoading}
                sx={{ py: 1.5, px: 4 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Save Grade'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateGrade;
