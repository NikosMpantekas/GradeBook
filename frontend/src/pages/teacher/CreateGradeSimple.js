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
  Chip,
  Card,
  CardContent,
  Divider,
  Alert,
  Container,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';
import FilterListIcon from '@mui/icons-material/FilterList';
import DirectionsIcon from '@mui/icons-material/Directions';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const CreateGradeSimple = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Form state
  const [formData, setFormData] = useState({
    schoolBranch: '',
    direction: '',
    subject: '',
    student: '',
    value: '',
    comments: '',
    date: new Date(),
  });
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    schoolBranches: [],
    directions: [],
    subjects: []
  });
  const [students, setStudents] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Additional state for branch name lookup
  const [branchNames, setBranchNames] = useState({});
  
  // Load filter options when component mounts
  useEffect(() => {
    if (user?.token) {
      loadFilterOptions();
    }
  }, [user]);
  
  // Effect to load branch names when filter options change
  useEffect(() => {
    if (filterOptions.schoolBranches && filterOptions.schoolBranches.length > 0 && user?.token) {
      loadBranchNames();
    }
  }, [filterOptions.schoolBranches, user]);
  
  // Load students when filters change
  useEffect(() => {
    if (formData.schoolBranch && formData.direction && formData.subject && user?.token) {
      loadFilteredStudents();
    } else {
      setStudents([]);
      setFormData(prev => ({ ...prev, student: '' }));
    }
  }, [formData.schoolBranch, formData.direction, formData.subject, user]);
  
  // Load available filter options (school branches, directions, subjects) for the teacher/admin
  const loadFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      // Use different endpoints based on user role
      // Admins get access to ALL students, teachers get only their assigned students
      const endpoint = user.role === 'admin' || user.role === 'superadmin' 
        ? `${API_URL}/api/students/notification/filters`  // Admin endpoint - all students
        : `${API_URL}/api/students/teacher/filters`;      // Teacher endpoint - assigned students only
      
      const response = await axios.get(endpoint, config);
      setFilterOptions(response.data);
      console.log(`[CreateGrade] Loaded filter options for ${user.role} using ${endpoint}:`, response.data);
    } catch (error) {
      console.error('[CreateGrade] Error loading filter options:', error);
      toast.error('Failed to load filter options');
      setFilterOptions({ schoolBranches: [], directions: [], subjects: [] });
    } finally {
      setLoadingFilters(false);
    }
  };
  
  // Load school branch names using our new API endpoint
  const loadBranchNames = async () => {
    console.log('[CreateGrade] Loading school branch names');
    try {
      const branchIds = filterOptions.schoolBranches.map(branch => branch.value);
      
      // Skip if there are no valid branch IDs
      if (!branchIds.length) return;
      
      // Filter only valid MongoDB ObjectIds
      const validBranchIds = branchIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
      
      // Skip if no valid IDs after filtering
      if (!validBranchIds.length) {
        console.log('[CreateGrade] No valid branch IDs found');
        return;
      }
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      console.log('[CreateGrade] Fetching branch names for IDs:', validBranchIds);
      
      const endpoint = `${API_URL}/api/branches/batch`;
      const response = await axios.post(endpoint, {
        branchIds: validBranchIds
      }, config);
      
      // Create a mapping of branch ID to name
      const nameMap = {};
      if (response.data.branches) {
        response.data.branches.forEach(branch => {
          nameMap[branch._id] = branch.name;
        });
      }
      
      console.log('[CreateGrade] Loaded branch names:', nameMap);
      setBranchNames(nameMap);
    } catch (error) {
      console.error('[CreateGrade] Error loading branch names:', error);
    }
  };
  
  // Load students based on selected filters using class-based filtering
  const loadFilteredStudents = async () => {
    if (!formData.schoolBranch || !formData.direction || !formData.subject) return;
    
    setLoadingStudents(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      const params = new URLSearchParams({
        schoolBranch: formData.schoolBranch,
        direction: formData.direction,
        subject: formData.subject
      });
      
      // Use different endpoints based on user role
      // Admins get access to ALL students, teachers get only their assigned students
      const endpoint = user.role === 'admin' || user.role === 'superadmin' 
        ? `${API_URL}/api/students/notification/filtered?${params}`  // Admin endpoint - all students
        : `${API_URL}/api/students/teacher/filtered?${params}`;      // Teacher endpoint - assigned students only
      
      const response = await axios.get(endpoint, config);
      
      // Filter to only include students (no teachers) for grade creation
      const studentsOnly = response.data.filter(user => user.role === 'student');
      setStudents(studentsOnly);
      
      console.log(`[CreateGrade] Loaded ${response.data.length} total users, filtered to ${studentsOnly.length} students for ${user.role}:`, studentsOnly);
    } catch (error) {
      console.error('[CreateGrade] Error loading students:', error);
      toast.error('Failed to load students');
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
    
    // Reset dependent fields when parent filter changes
    if (name === 'schoolBranch') {
      setFormData(prev => ({ ...prev, direction: '', subject: '', student: '' }));
    } else if (name === 'direction') {
      setFormData(prev => ({ ...prev, subject: '', student: '' }));
    } else if (name === 'subject') {
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
    
    if (!formData.student || !formData.value) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const config = {
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Get the subject ID for the selected subject name
      // Since we're using subject names in classes, we need to find the subject ID
      const subjectsEndpoint = `${API_URL}/api/subjects`;
      const subjectsResponse = await axios.get(subjectsEndpoint, config);
      const subjects = subjectsResponse.data;
      const selectedSubject = subjects.find(s => s.name === formData.subject);
      
      if (!selectedSubject) {
        toast.error('Subject not found');
        return;
      }
      
      const gradeData = {
        student: formData.student,
        subject: selectedSubject._id, // Use subject ID for grade creation
        value: Number(formData.value),
        description: formData.comments,
        date: formData.date
      };
      
      console.log('[CreateGrade] Submitting grade data:', gradeData);
      
      const endpoint = `${API_URL}/api/grades`;
      await axios.post(endpoint, gradeData, config);
      
      toast.success('Grade added successfully!');
      // Role-aware redirect - admin goes to admin routes, teachers to teacher routes
      const redirectPath = user.role === 'admin' || user.role === 'superadmin' 
        ? '/app/admin/grades/manage'
        : '/app/teacher/grades/manage';
      
      console.log(`[CreateGrade] Redirecting ${user.role} to: ${redirectPath}`);
      navigate(redirectPath);
      
    } catch (error) {
      console.error('[CreateGrade] Error creating grade:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create grade';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Get available directions based on selected school branch
  const getAvailableDirections = () => {
    if (!formData.schoolBranch) return [];
    return filterOptions.directions.filter(direction => 
      filterOptions.schoolBranches.some(branch => branch.value === formData.schoolBranch)
    );
  };
  
  // Get available subjects based on selected direction
  const getAvailableSubjects = () => {
    if (!formData.direction) return [];
    return filterOptions.subjects;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Card>
        <CardContent>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            {user.role === 'admin' ? (
              <AdminPanelSettingsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            ) : (
              <GradeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            )}
            <Typography variant="h4" component="h1" gutterBottom>
              {user.role === 'admin' ? 'Admin Grade Management' : 'Add New Grade'}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {user.role === 'admin' ? 'Manage grades for all students' : 'Use class-based filtering to select students and add grades'}
            </Typography>
          </Box>
          
          {loadingFilters ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading filter options...</Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Filters Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <FilterListIcon sx={{ mr: 1 }} />
                    Class Filters
                  </Typography>
                </Grid>
                
                {/* School Branch Filter */}
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="School Branch"
                    name="schoolBranch"
                    value={formData.schoolBranch}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  >
                    {filterOptions.schoolBranches.map((branch) => (
                      <MenuItem key={branch.value} value={branch.value}>
                        {/* Show the actual branch name if available in our mapping, otherwise fallback to label */}
                        {branchNames[branch.value] || branch.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                {/* Direction Filter */}
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    required
                    disabled={!formData.schoolBranch}
                    label="Direction"
                    name="direction"
                    value={formData.direction}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <DirectionsIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    helperText={!formData.schoolBranch ? 'Select a school branch first' : ''}
                  >
                    {getAvailableDirections().map((direction) => (
                      <MenuItem key={direction.value} value={direction.value}>
                        {direction.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                {/* Subject Filter */}
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    required
                    disabled={!formData.direction}
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <BookIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    helperText={!formData.direction ? 'Select a direction first' : ''}
                  >
                    {getAvailableSubjects().map((subject) => (
                      <MenuItem key={subject.value} value={subject.value}>
                        {subject.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                {/* Active Filters Display */}
                {(formData.schoolBranch || formData.direction || formData.subject) && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Active filters:</Typography>
                      {formData.schoolBranch && (
                        <Chip label={`Branch: ${formData.schoolBranch}`} size="small" color="primary" />
                      )}
                      {formData.direction && (
                        <Chip label={`Direction: ${formData.direction}`} size="small" color="secondary" />
                      )}
                      {formData.subject && (
                        <Chip label={`Subject: ${formData.subject}`} size="small" color="info" />
                      )}
                    </Box>
                  </Grid>
                )}
                
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
                        <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    helperText={
                      !formData.subject ? 'Select all filters first' :
                      loadingStudents ? 'Loading students...' :
                      students.length === 0 ? 'No students found for selected filters' : ''
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
                    InputProps={{
                      startAdornment: <GradeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
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
                <Grid item xs={12} md={6}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const cancelPath = user.role === 'admin' || user.role === 'superadmin' 
                          ? '/app/admin/grades/manage'
                          : '/app/teacher/grades/manage';
                        navigate(cancelPath);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !formData.student || !formData.value}
                      sx={{ minWidth: 120 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Add Grade'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateGradeSimple;
