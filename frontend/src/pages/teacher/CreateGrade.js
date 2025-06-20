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
  Chip,
} from '@mui/material';
// Using standard date input fields instead of DatePicker component
// to avoid dependency issues
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Class as ClassIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { createGrade, reset } from '../../features/grades/gradeSlice';
import { getSubjectsByTeacher } from '../../features/subjects/subjectSlice';
import { 
  getStudentsBySubject, 
  getStudents, 
} from '../../features/students/studentSlice';
import { 
  getDirections, 
  reset as resetDirections,
} from '../../features/directions/directionSlice';
import { getClassesByTeacher } from '../../features/classes/classSlice';

const CreateGrade = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.grades);
  const { subjects, isLoading: subjectsLoading } = useSelector((state) => state.subjects);
  const { students, isLoading: studentsLoading } = useSelector((state) => state.students);
  const { classes, isLoading: classesLoading } = useSelector((state) => state.classes);
  
  const [studentsToSelect, setStudentsToSelect] = useState([]);
  const [subjectsToSelect, setSubjectsToSelect] = useState([]);
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState('');
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    value: '',
    description: '',
    date: new Date(),
  });
  const [formErrors, setFormErrors] = useState({});
  
  // CRITICAL FIX: Added safer validation logic to prevent runtime errors
  // Handle directions data safely
  const handleDirectionsData = () => {
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
      console.error('[CreateGrade] Error handling directions:', error);
      // Safety fallback
      setDirections([]);
    }
  };
  
  // Get directions from Redux store for consistent data handling
  const { directions: reduxDirections, isLoading: directionsLoading } = useSelector((state) => state.direction);
  
  // Initial data loading
  useEffect(() => {
    try {
      console.log('[CreateGrade] Component mounted - initializing data');
      
      // Step 1: First, make sure our state is ready
      console.log('[CreateGrade] Preparing data structures...');
      
      // Step 2: Load teacher subjects
      if (user && user._id) {
        console.log('[CreateGrade] Loading subjects for teacher:', user._id);
        dispatch(getSubjectsByTeacher(user._id));
        
        // Step 3: Load teacher classes
        console.log('[CreateGrade] Loading classes for teacher:', user._id);
        dispatch(getClassesByTeacher(user._id))
          .unwrap()
          .then(data => {
            console.log(`[CreateGrade] Loaded ${Array.isArray(data) ? data.length : 0} teacher classes`);
            setTeacherClasses(data || []);
          })
          .catch(error => {
            console.error('[CreateGrade] Error fetching teacher classes:', error);
            setTeacherClasses([]);
          });
      }
      
      // Step 4: Load directions
      console.log('[CreateGrade] Loading directions...');
      dispatch(getDirections())
        .unwrap()
        .then(data => {
          console.log(`[CreateGrade] Loaded ${Array.isArray(data) ? data.length : 0} directions`);
        })
        .catch(error => {
          console.error('[CreateGrade] Error fetching directions:', error);
        });
    } catch (err) {
      console.error('[CreateGrade] Critical initialization error:', err);
      toast.error('There was a problem initializing the form. Please try again.');
    }
    
    return () => {
      // Reset grade data when component unmounts
      dispatch(reset());
    };
  }, [dispatch, user]);
  
  // Update local directions state from Redux store
  useEffect(() => {
    try {
      // Check if directions data is valid
      if (Array.isArray(reduxDirections)) {
        console.log(`[CreateGrade] Setting ${reduxDirections.length} directions from Redux store`);
        setDirections(reduxDirections);
      } else {
        console.warn('[CreateGrade] Redux directions is not an array:', reduxDirections);
        setDirections([]);
      }
    } catch (error) {
      console.error('[CreateGrade] Error setting directions from Redux store:', error);
      // Safety fallback
      setDirections([]);
    }
  }, [reduxDirections, dispatch]);
  
  // Handle class selection change
  const handleClassChange = (e) => {
    const classId = e.target.value;
    console.log(`[CreateGrade] Class selected: ${classId}`);
    setSelectedClass(classId);
    
    // Reset subject and student when class changes
    setFormData(prev => ({
      ...prev,
      subject: '',
      student: ''
    }));
    
    // Filter subjects for the selected class
    if (classId) {
      filterSubjectsForClass(classId);
    } else {
      setSubjectsToSelect([]);
    }
  };

  // Filter subjects based on selected class
  const filterSubjectsForClass = (classId) => {
    if (!classId || !subjects || !Array.isArray(subjects)) {
      console.log('[CreateGrade] No valid class or subjects to filter');
      setSubjectsToSelect([]);
      return;
    }
    
    const selectedClassObj = teacherClasses.find(cls => cls._id === classId);
    if (!selectedClassObj) {
      console.log('[CreateGrade] Selected class not found in teacher classes');
      setSubjectsToSelect([]);
      return;
    }
    
    // Use the subject from the class
    const classSubject = selectedClassObj.subject;
    console.log(`[CreateGrade] Class subject: ${classSubject}`);
    
    const filteredSubjects = subjects.filter(subject => 
      subject.name.toLowerCase() === classSubject.toLowerCase());
    
    console.log(`[CreateGrade] Filtered ${filteredSubjects.length} subjects for class ${selectedClassObj.name}`);
    setSubjectsToSelect(filteredSubjects);
  };
  
  // When subjects load or change, update filtered subjects based on selected class
  useEffect(() => {
    if (selectedClass && teacherClasses.length > 0) {
      filterSubjectsForClass(selectedClass);
    } else if (subjects && Array.isArray(subjects)) {
      // If no class is selected, show all subjects
      setSubjectsToSelect(subjects);
    }
  }, [subjects, selectedClass, teacherClasses]);

  // When a subject is selected, fetch students for that subject
  useEffect(() => {
    try {
      // Check if subject is selected
      if (!formData.subject) {
        // Clear students list when no subject selected
        setStudentsToSelect([]);
        return;
      }
      
      console.log(`[CreateGrade] Subject selected: ${formData.subject}, fetching students...`);
      
      // Reset student selection for safety
      setFormData(prev => ({ ...prev, student: '' }));
      
      // Try to get students for this subject
      dispatch(getStudentsBySubject(formData.subject))
        .unwrap()
        .then((allSubjectStudents) => {
          // Log successful fetch
          console.log(`[CreateGrade] Successfully fetched ${allSubjectStudents?.length || 0} students for subject`);
          
          // If class is selected, filter students to only those in the class
          if (selectedClass && teacherClasses.length > 0) {
            const selectedClassObj = teacherClasses.find(cls => cls._id === selectedClass);
            
            if (selectedClassObj && selectedClassObj.students && Array.isArray(selectedClassObj.students)) {
              // Extract student IDs from class (handling both string IDs and object references)
              const classStudentIds = selectedClassObj.students.map(student => 
                typeof student === 'string' ? student : student._id
              );
              
              // Filter to only students who are both in the class and taking the subject
              const filteredStudents = Array.isArray(allSubjectStudents) ? 
                allSubjectStudents.filter(student => classStudentIds.includes(student._id)) : [];
              
              console.log(`[CreateGrade] Filtered from ${allSubjectStudents?.length || 0} to ${filteredStudents.length} students based on class ${selectedClassObj.name}`);
              setStudentsToSelect(filteredStudents);
            } else {
              console.log('[CreateGrade] No students found in selected class');
              setStudentsToSelect([]);
            }
          } else {
            // If no class selected, use all subject students
            setStudentsToSelect(allSubjectStudents || []);
          }
        })
        .catch(err => {
          console.error('[CreateGrade] Error loading students for subject:', err);
          setStudentsToSelect([]);

          toast.error('Failed to load students. Please try again.');
        });
    } catch (err) {
      console.error('[CreateGrade] Critical error in subject selection effect:', err);
      toast.error('There was a problem loading students. Please try again.');
    }
  }, [dispatch, formData.subject, selectedClass, teacherClasses]);
  
  // Ensure student data is valid on component mount
  useEffect(() => {
    try {
      console.log('[CreateGrade] Checking student data structures');
            
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
        // Only include description if user has permission
        description: user?.canAddGradeDescriptions !== false ? (formData.description || '') : '',
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
            {/* Class Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="class-select-label">
                  <ClassIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Select Class
                </InputLabel>
                <Select
                  labelId="class-select-label"
                  id="class-select"
                  value={selectedClass}
                  onChange={handleClassChange}
                  label="Select Class"
                >
                  <MenuItem value="">
                    <em>All Classes</em>
                  </MenuItem>
                  {teacherClasses && teacherClasses.length > 0 ? (
                    teacherClasses.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name}
                        {cls.subject && (
                          <Chip 
                            size="small" 
                            label={cls.subject} 
                            color="primary" 
                            variant="outlined" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No classes available</em>
                    </MenuItem>
                  )}
                </Select>
                {selectedClass && (
                  <FormHelperText>
                    Students and subjects will be filtered by this class
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

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
                  disabled={subjectsLoading || (selectedClass && subjectsToSelect.length === 0)}
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
                  ) : 
                  // Use filtered subjects if class is selected, otherwise show all subjects
                  Array.isArray(selectedClass ? subjectsToSelect : subjects) && 
                  (selectedClass ? subjectsToSelect : subjects).length > 0 ? (
                    (selectedClass ? subjectsToSelect : subjects).map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.name}
                        {selectedClass && (
                          <Chip 
                            size="small" 
                            label="Class Subject" 
                            color="success" 
                            variant="outlined" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>{selectedClass ? "No subjects available for selected class" : "No subjects available"}</em>
                    </MenuItem>
                  )}
                </Select>
                <FormHelperText>
                  {formErrors.subject || 
                   (subjectsLoading ? 'Loading subjects...' : 
                    selectedClass && (!Array.isArray(subjectsToSelect) || subjectsToSelect.length === 0) ? 'No subjects for selected class' :
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
                      <em>
                        {selectedClass 
                          ? "No students available in this class for the selected subject" 
                          : "No students available for this subject"}
                      </em>
                    </MenuItem>
                  ) : (
                    studentsToSelect.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name}
                        {selectedClass && (
                          <Chip 
                            size="small" 
                            label="Class Student" 
                            color="info" 
                            variant="outlined" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>
                  {formErrors.student || 
                   (studentsLoading ? 'Loading students...' : 
                    !formData.subject ? 'Please select a subject first' :
                    studentsToSelect.length === 0 ? 
                      (selectedClass 
                        ? `No students found in class ${teacherClasses.find(c => c._id === selectedClass)?.name || ''} for this subject` 
                        : 'No students found for this subject') :
                    selectedClass ? `Showing only students from the selected class` : 'Select the student to grade')}
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
