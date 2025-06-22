import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';

const CreateGradeSimple = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Form state
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    value: '',
    comments: '',
    date: new Date(),
  });
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Load subjects when component mounts
  useEffect(() => {
    if (user?.token) {
      loadSubjects();
    }
  }, [user]);
  
  // Load students when subject changes
  useEffect(() => {
    if (formData.subject && user?.token) {
      loadStudentsForSubject();
    } else {
      setStudents([]);
    }
  }, [formData.subject, user]);
  
  // Load available subjects
  const loadSubjects = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      const response = await axios.get('/api/subjects', config);
      setSubjects(Array.isArray(response.data) ? response.data : []);
      console.log(`[CreateGrade] Loaded ${response.data?.length || 0} subjects`);
    } catch (error) {
      console.error('[CreateGrade] Error loading subjects:', error);
      toast.error('Failed to load subjects');
      setSubjects([]);
    }
  };
  
  // Load students for selected subject using class-based filtering
  const loadStudentsForSubject = async () => {
    if (!formData.subject) return;
    
    setLoadingStudents(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      let endpoint;
      // Use class-based endpoint for teachers, legacy for admins
      if (user.user?.role === 'teacher') {
        endpoint = `/api/students/teacher/subject/${formData.subject}`;
        console.log('[CreateGrade] Using class-based endpoint for teacher');
      } else {
        endpoint = `/api/students/subject/${formData.subject}`;
        console.log('[CreateGrade] Using legacy endpoint for admin');
      }
      
      const response = await axios.get(endpoint, config);
      const studentData = Array.isArray(response.data) ? response.data : [];
      
      setStudents(studentData);
      console.log(`[CreateGrade] Loaded ${studentData.length} students for subject`);
      
      // Log class information for teachers
      if (user.user?.role === 'teacher' && studentData.length > 0 && studentData[0].classes) {
        console.log('[CreateGrade] Students with class context:', 
          studentData.slice(0, 3).map(s => ({
            name: s.name,
            classes: s.classes?.map(c => c.className)
          }))
        );
      }
      
    } catch (error) {
      console.error('[CreateGrade] Error loading students:', error);
      toast.error('Failed to load students for this subject');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset student selection when subject changes
    if (name === 'subject') {
      setFormData(prev => ({ ...prev, student: '' }));
    }
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.student || !formData.subject || !formData.value) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const gradeValue = parseFloat(formData.value);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      toast.error('Grade value must be between 0 and 100');
      return;
    }
    
    setLoading(true);
    
    try {
      const gradeData = {
        student: formData.student,
        subject: formData.subject,
        value: gradeValue,
        comments: formData.comments,
        date: formData.date,
      };
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      console.log('[CreateGrade] Submitting grade:', {
        ...gradeData,
        studentName: students.find(s => s._id === formData.student)?.name
      });
      
      await axios.post('/api/grades', gradeData, config);
      
      toast.success('Grade added successfully!');
      
      // Reset form
      setFormData({
        student: '',
        subject: '',
        value: '',
        comments: '',
        date: new Date(),
      });
      
      // Optionally navigate back
      // navigate('/teacher/grades');
      
    } catch (error) {
      console.error('[CreateGrade] Error submitting grade:', error);
      
      if (error.response?.status === 403) {
        toast.error('You are not authorized to add grades for this student');
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
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <GradeIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h5">Add Grade</Typography>
      </Box>
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Subject Selection */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              required
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              InputProps={{
                startAdornment: <BookIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            >
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
              required
              disabled={!formData.subject || loadingStudents}
              label="Student"
              name="student"
              value={formData.student}
              onChange={handleChange}
              InputProps={{
                startAdornment: loadingStudents ? 
                  <CircularProgress size={20} sx={{ mr: 1 }} /> :
                  <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText={
                !formData.subject ? 'Select a subject first' :
                loadingStudents ? 'Loading students...' :
                students.length === 0 ? 'No students found for this subject' : ''
              }
            >
              {students.map((student) => (
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
              required
              type="number"
              label="Grade (0-100)"
              name="value"
              value={formData.value}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
            />
          </Grid>
          
          {/* Date */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
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
              label="Comments (Optional)"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
            />
          </Grid>
          
          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/teacher/grades')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Add Grade'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default CreateGradeSimple;
