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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { createGrade, reset } from '../../features/grades/gradeSlice';
import { getSubjectsByTeacher } from '../../features/subjects/subjectSlice';

const CreateGrade = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.grades);
  const { subjects, isLoading: subjectsLoading } = useSelector((state) => state.subjects);
  
  const [studentsToSelect, setStudentsToSelect] = useState([]);
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
    
    // Dummy students data - in a real app, you would fetch this from the API
    // based on the selected subject or other criteria
    setStudentsToSelect([
      { _id: '1', name: 'John Doe' },
      { _id: '2', name: 'Jane Smith' },
      { _id: '3', name: 'Michael Johnson' },
      { _id: '4', name: 'Emily Williams' },
      { _id: '5', name: 'Robert Brown' },
    ]);
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, user._id]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (isSuccess) {
      toast.success('Grade added successfully');
      navigate('/teacher/grades/manage');
    }
  }, [isError, isSuccess, message, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the error for this field when it's modified
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    setFormData({
      ...formData,
      [name]: value,
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
      const gradeData = {
        student: formData.student,
        subject: formData.subject,
        value: parseInt(formData.value, 10),
        description: formData.description,
        date: format(formData.date, 'yyyy-MM-dd'),
      };
      
      dispatch(createGrade(gradeData));
    }
  };
  
  const handleBack = () => {
    navigate('/teacher/grades/manage');
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
                >
                  <MenuItem value="">
                    <em>Select a student</em>
                  </MenuItem>
                  {studentsToSelect.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.student && (
                  <FormHelperText>{formErrors.student}</FormHelperText>
                )}
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
                >
                  <MenuItem value="">
                    <em>Select a subject</em>
                  </MenuItem>
                  {subjects && subjects.map((subject) => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.subject && (
                  <FormHelperText>{formErrors.subject}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Value *"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                error={!!formErrors.value}
                helperText={formErrors.value || 'Enter a value between 0 and 100'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date *"
                  value={formData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!formErrors.date}
                      helperText={formErrors.date}
                    />
                  )}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
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
