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
import { 
  getStudentsBySubject, 
  getStudents, 
  ensureValidData,
  safeValidateStudentData 
} from '../../features/students/studentSlice';
import { getDirections, reset as resetDirections } from '../../features/directions/directionSlice';

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
  
  // CRITICAL FIX: Added safer validation logic to prevent runtime errors
  // Safely handle direction validation
  const validateDirections = () => {
    try {
      // Safety check - validate direction data structure
      if (reduxDirections && !Array.isArray(reduxDirections)) {
        console.error('[CreateGrade] Redux directions is not an array:', reduxDirections);
        setDirections([]);
      } else if (Array.isArray(reduxDirections)) {
        console.log(`[CreateGrade] Setting ${reduxDirections.length} directions from Redux store`);
        setDirections(reduxDirections);
      }
    } catch (error) {
      console.error('[CreateGrade] Error validating directions:', error);
      // Safety fallback
      setDirections([]);
    }
  };
  
  // Get directions from Redux store for consistent data handling
  const { directions: reduxDirections, isLoading: directionsLoading } = useSelector((state) => state.direction);
  
  // Initial data loading effect
  useEffect(() => {
    try {
      // Load subjects taught by this teacher
      if (user && user._id) {
        console.log('[CreateGrade] Loading subjects for teacher:', user._id);
        dispatch(getSubjectsByTeacher(user._id));
      }
      
      // Load directions safely
      console.log('[CreateGrade] Dispatching getDirections action');
      dispatch(getDirections())
        .unwrap()
        .then(data => {
          console.log(`[CreateGrade] Loaded ${Array.isArray(data) ? data.length : 0} directions through Redux`);
        })
        .catch(error => {
          console.error('[CreateGrade] Error fetching directions:', error);
          toast.error('Failed to load directions. Please try again.');
        });
      
      // Cleanup function
      return () => {
        // Reset only grades state to avoid interfering with other components
        dispatch(reset());
      };
    } catch (error) {
      console.error('[CreateGrade] Error in initial data loading effect:', error);
      toast.error('Error initializing page. Please refresh and try again.');
    }
  }, [dispatch, user?._id, user?.token]);
  
  // Update local directions state from Redux store
  useEffect(() => {
    if (Array.isArray(reduxDirections)) {
      console.log(`Setting directions from Redux store: ${reduxDirections.length} items`);
      setDirections(reduxDirections);
    } else {
      console.warn('Redux directions is not an array:', reduxDirections);
      setDirections([]);
    }
  }, [reduxDirections]);
  
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
  
  // CRITICAL FIX: Add safe validation on component mount to ensure student data is an array
  useEffect(() => {
    try {
      console.log('[CreateGrade] Safely validating student data structures');
      
      // Call our new helper function that prevents the TypeError
      safeValidateStudentData(dispatch);
      
      // Also explicitly call the validation action
      dispatch(ensureValidData());
      
      // Log validation results
      if (students) {
        if (!Array.isArray(students)) {
          console.error('[CreateGrade] Students data is not an array - fixing structure');
          // Force an empty array if structure is invalid
          // This is a direct fix since Redux may not update fast enough
          setStudentsToSelect([]);
        } else {
          console.log(`[CreateGrade] Students array contains ${students.length} items`);
        }
      } else {
        console.log('[CreateGrade] No students data loaded yet');
        setStudentsToSelect([]);
      }
    } catch (error) {
      console.error('[CreateGrade] Error during student data validation:', error);
      // Recover from any error
      setStudentsToSelect([]);
    }
  }, [dispatch, students]);

  // Update students dropdown when students are fetched from API or direction changes
  useEffect(() => {
    // CRITICAL FIX: Add comprehensive validation before accessing students data
    // This prevents the TypeError: l.map is not a function error
    
    // First, log current state for debugging
    console.log('[CreateGrade] Students data updated:', {
      studentsAvailable: !!students,
      isArray: Array.isArray(students),
      studentsCount: Array.isArray(students) ? students.length : 'NOT AN ARRAY',
      selectedDirection,
      currentSubject: formData.subject,
      dataType: typeof students
    });
    
    // Safety check: if students is not a valid array, reset the dropdown and exit early
    if (!students || !Array.isArray(students)) {
      console.warn('[CreateGrade] Students data is not an array:', students);
      setStudentsToSelect([]);
      return;
    }
    
    // Filter out any invalid student data and enhance with contact info
    let validStudents = students
      .filter(student => {
        try {
          // Basic validation
          if (!student || !student._id || !student.name || typeof student.name !== 'string') {
            console.warn('[CreateGrade] Found invalid student data:', student);
            return false;
          }
          
          console.log(`[CreateGrade] Processing student: ${student.name} (${student._id})`, {
            direction: student.direction,
            subjectCount: student.subjects?.length || 0,
            rawStudent: student // Log raw student data for debugging
          });
          
          return true;
          
        } catch (error) {
          console.error('[CreateGrade] Error processing student:', error, student);
          return false;
        }
      })
      .map(student => {
        try {
          // Normalize direction (handle both populated and unpopulated)
          let direction = { _id: '', name: 'No Direction' };
          if (student.direction) {
            if (typeof student.direction === 'object') {
              direction = {
                _id: student.direction._id?.toString() || '',
                name: student.direction.name || 'Unknown Direction'
              };
            } else {
              direction = {
                _id: student.direction.toString(),
                name: 'Unknown Direction'
              };
            }
          }
          
          // Normalize subjects array (handle both populated and unpopulated)
          let subjects = [];
          if (Array.isArray(student.subjects)) {
            subjects = student.subjects
              .filter(subj => subj !== null && subj !== undefined)
              .map(subj => ({
                _id: (subj?._id || subj)?.toString() || '',
                name: subj?.name || `Subject ${subj?._id || subj || 'Unknown'}`
              }));
          }
          
          // Build normalized student object
          const normalizedStudent = {
            _id: student._id,
            name: student.name,
            email: student.email || '',
            mobilePhone: student.mobilePhone || student.savedMobilePhone || '',
            personalEmail: student.personalEmail || student.savedPersonalEmail || '',
            direction,
            subjects
          };
          
          console.log(`[CreateGrade] Normalized student ${normalizedStudent.name}:`, {
            id: normalizedStudent._id,
            direction: normalizedStudent.direction,
            subjectCount: normalizedStudent.subjects.length,
            subjects: normalizedStudent.subjects
          });
          
          return normalizedStudent;
          
        } catch (error) {
          console.error('[CreateGrade] Error normalizing student:', error, student);
          // Return a minimal valid student object to prevent crashes
          return {
            _id: student._id || 'unknown',
            name: student.name || 'Unknown Student',
            email: '',
            mobilePhone: '',
            personalEmail: '',
            direction: { _id: '', name: 'Unknown Direction' },
            subjects: []
          };
        }
      });
    
    // CRITICAL FIX: For debugging, log ALL students before any filtering
    console.log(`[CreateGrade] Before filtering: ${validStudents.length} normalized students`);
    
    let filteredStudents = [...validStudents]; // Make a copy to avoid modifying validStudents directly
    
    // Apply direction filter if selected
    if (selectedDirection) {
      console.log(`[CreateGrade] Applying direction filter: ${selectedDirection}`);
      
      filteredStudents = filteredStudents.filter(student => {
        // Convert all IDs to strings for reliable comparison
        const studentDirId = student.direction?._id?.toString() || '';
        const selectedDirId = selectedDirection?.toString() || '';
        
        const directionMatch = studentDirId && selectedDirId && (studentDirId === selectedDirId);
        
        if (directionMatch) {
          console.log(`[CreateGrade] Student ${student.name} MATCHES direction filter ${selectedDirId}`);
        } else {
          console.log(`[CreateGrade] Student ${student.name} filtered out by direction filter`, {
            studentDirection: student.direction,
            studentDirId,
            selectedDirId
          });
        }
        
        return directionMatch;
      });
    }
    
    // Filter by subject if selected
    if (formData.subject) {
      console.log(`[CreateGrade] Filtering students by subject: ${formData.subject}`);
      
      // Convert subject ID to string for reliable comparison
      const formSubjectId = formData.subject?.toString() || '';
      
      filteredStudents = filteredStudents.filter(student => {
        // CRITICAL FIX: Always check if the student has the current subject
        // Log student subjects for debugging
        console.log(`[CreateGrade] Student ${student.name} has ${student.subjects?.length || 0} subjects:`, 
          student.subjects?.map(s => s?._id?.toString() || s));
        
        // Check if student has the selected subject
        const hasSubject = student.subjects?.some(subj => {
          const subjectId = subj?._id?.toString() || '';
          const match = subjectId && formSubjectId && (subjectId === formSubjectId);
          
          if (match) {
            console.log(`[CreateGrade] Student ${student.name} has matching subject ${subjectId}`);
          }
          
          return match;
        });
        
        if (hasSubject) {
          console.log(`[CreateGrade] Student ${student.name} MATCHES subject filter ${formSubjectId}`);
          return true;
        } else {
          console.log(`[CreateGrade] Student ${student.name} does NOT match subject filter ${formSubjectId}`);
          return false;
        }
      });
    }
    
    // CRITICAL FIX: ALWAYS update studentsToSelect after filtering
    // This was the key issue - we weren't updating the dropdown data
    console.log(`[CreateGrade] Setting ${filteredStudents.length} students to dropdown`);
    setStudentsToSelect(filteredStudents);
    
    // Log details of students for debugging
    if (filteredStudents.length > 0) {
      const firstStudent = filteredStudents[0];
      console.log('[CreateGrade] First filtered student:', {
        id: firstStudent._id,
        name: firstStudent.name,
        direction: firstStudent.direction,
        subjects: firstStudent.subjects,
        subjectCount: firstStudent.subjects.length
      });
    } else {
      console.log('[CreateGrade] No students found after filtering');
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
                  {Array.isArray(directions) && directions.length > 0 ? (
                    directions.map((direction) => (
                      <MenuItem key={direction._id} value={direction._id}>
                        {direction.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No directions available</em>
                    </MenuItem>
                  )}
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
                  ) : Array.isArray(subjects) && subjects.length > 0 ? (
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
                    !Array.isArray(subjects) || subjects.length === 0 ? 'No subjects assigned to you' :
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
