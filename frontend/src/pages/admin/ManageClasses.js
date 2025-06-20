import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Alert,
  Grid,
  Autocomplete,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormGroup,
  OutlinedInput,
  InputAdornment,
  Skeleton,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { getClasses, deleteClass, createClass, updateClass } from '../../features/classes/classSlice';
import { getSchools } from '../../features/schools/schoolSlice';
import { getUsers } from '../../features/users/userSlice';

const ManageClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { classes, isLoading, isError, message } = useSelector((state) => state.classes);
  const { schools } = useSelector((state) => state.schools);
  const { users } = useSelector((state) => state.users);
  
  // State for dialog operations
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  
  // State for form tabs
  const [tabValue, setTabValue] = useState(0);
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  // Force the branch school for new classes
  const branchSchoolId = '6834cef6ae7eb00ba4d0820d'; // Φροντιστήριο Βαθύ
  
  const [classData, setClassData] = useState({
    subjectName: '',
    directionName: '',
    schoolId: branchSchoolId, // Pre-select branch school
    students: [],
    teachers: [],
    schedule: [
      { day: 'Monday', startTime: '', endTime: '', active: false },
      { day: 'Tuesday', startTime: '', endTime: '', active: false },
      { day: 'Wednesday', startTime: '', endTime: '', active: false },
      { day: 'Thursday', startTime: '', endTime: '', active: false },
      { day: 'Friday', startTime: '', endTime: '', active: false },
      { day: 'Saturday', startTime: '', endTime: '', active: false },
      { day: 'Sunday', startTime: '', endTime: '', active: false },
    ],
  });
  
  // States for filtering teachers and students
  const [teacherFilter, setTeacherFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  
  // Filtered lists
  const filteredTeachers = useMemo(() => {
    return users
      .filter(user => user.role === 'teacher')
      .filter(teacher => 
        teacher.firstName?.toLowerCase().includes(teacherFilter.toLowerCase()) || 
        teacher.lastName?.toLowerCase().includes(teacherFilter.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(teacherFilter.toLowerCase())
      );
  }, [users, teacherFilter]);
  
  const filteredStudents = useMemo(() => {
    return users
      .filter(user => user.role === 'student')
      .filter(student => 
        student.firstName?.toLowerCase().includes(studentFilter.toLowerCase()) || 
        student.lastName?.toLowerCase().includes(studentFilter.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentFilter.toLowerCase())
      );
  }, [users, studentFilter]);

  // Load classes, schools, and users when component mounts
  useEffect(() => {
    console.log('ManageClasses: Loading classes, schools, and users');
    dispatch(getClasses());
    dispatch(getSchools());
    dispatch(getUsers());
  }, [dispatch]);

  // Debug schools data whenever it changes
  useEffect(() => {
    console.log('ManageClasses: Schools data changed');
    console.log('Schools data available:', schools);
    if (schools && Array.isArray(schools)) {
      console.log('Number of schools:', schools.length);
      schools.forEach(school => {
        console.log(`School: ${school.name} (ID: ${school._id})`);
      });
      
      // Test our filtering logic explicitly
      const branchSchools = schools.filter(school => {
        // Just test our main branch
        return school._id === '6834cef6ae7eb00ba4d0820d'; // Φροντιστήριο Βαθύ
      });
      console.log('Found branch schools:', branchSchools.length);
      branchSchools.forEach(school => {
        console.log(`Branch school: ${school.name} (ID: ${school._id})`);
      });
    } else {
      console.log('No schools data or invalid format');
    }
  }, [schools]);

  // Filter classes when search term changes
  useEffect(() => {
    if (Array.isArray(classes)) {
      setFilteredClasses(
        classes.filter((classItem) => {
          const subjectMatch = classItem.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());
          const directionMatch = classItem.directionName?.toLowerCase().includes(searchTerm.toLowerCase());
          return subjectMatch || directionMatch;
        })
      );
    }
  }, [classes, searchTerm]);

  // Show toast on errors
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
    }
  }, [isError, message]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setDeleteId(null);
  };

  const handleAdd = () => {
    setFormMode('add');
    
    // Reset the filters too
    setTeacherFilter('');
    setStudentFilter('');
    
    setClassData({
      subjectName: '',
      directionName: '',
      schoolId: branchSchoolId, // Always use the branch school ID
      students: [],
      teachers: [],
      schedule: [
        { day: 'Monday', startTime: '', endTime: '', active: false },
        { day: 'Tuesday', startTime: '', endTime: '', active: false },
        { day: 'Wednesday', startTime: '', endTime: '', active: false },
        { day: 'Thursday', startTime: '', endTime: '', active: false },
        { day: 'Friday', startTime: '', endTime: '', active: false },
        { day: 'Saturday', startTime: '', endTime: '', active: false },
        { day: 'Sunday', startTime: '', endTime: '', active: false },
      ],
    });
    setFormOpen(true);
  };

  const handleEdit = (classItem) => {
    setFormMode('edit');
    // Create default schedule if none exists
    const defaultSchedule = [
      { day: 'Monday', startTime: '', endTime: '' },
      { day: 'Tuesday', startTime: '', endTime: '' },
      { day: 'Wednesday', startTime: '', endTime: '' },
      { day: 'Thursday', startTime: '', endTime: '' },
      { day: 'Friday', startTime: '', endTime: '' },
    ];

    setClassData({
      id: classItem._id,
      subjectName: classItem.subjectName || '',
      directionName: classItem.directionName || '',
      schoolId: classItem.schoolId || '',
      students: classItem.students || [],
      teachers: classItem.teachers || [],
      schedule: classItem.schedule || defaultSchedule,
    });
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setClassData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...classData.schedule];
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      [field]: value,
    };
    
    // If setting times on an inactive day, auto-activate it
    if ((field === 'startTime' || field === 'endTime') && value && !updatedSchedule[index].active) {
      updatedSchedule[index].active = true;
    }
    
    setClassData((prevData) => ({
      ...prevData,
      schedule: updatedSchedule,
    }));
  };
  
  // Toggle teacher selection with checkbox
  const handleTeacherToggle = (teacherId) => {
    setClassData(prevData => {
      const isSelected = prevData.teachers.includes(teacherId);
      const updatedTeachers = isSelected 
        ? prevData.teachers.filter(id => id !== teacherId)
        : [...prevData.teachers, teacherId];
        
      return {
        ...prevData,
        teachers: updatedTeachers
      };
    });
  };
  
  // Toggle student selection with checkbox
  const handleStudentToggle = (studentId) => {
    setClassData(prevData => {
      const isSelected = prevData.students.includes(studentId);
      const updatedStudents = isSelected 
        ? prevData.students.filter(id => id !== studentId)
        : [...prevData.students, studentId];
        
      return {
        ...prevData,
        students: updatedStudents
      };
    });
  };
  
  // Toggle day activation in schedule
  const handleDayToggle = (index) => {
    const updatedSchedule = [...classData.schedule];
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      active: !updatedSchedule[index].active,
      // Reset times if deactivating
      startTime: !updatedSchedule[index].active ? updatedSchedule[index].startTime : '',
      endTime: !updatedSchedule[index].active ? updatedSchedule[index].endTime : '',
    };
    
    setClassData(prevData => ({
      ...prevData,
      schedule: updatedSchedule
    }));
  };
  
  // Handle student selection
  const handleStudentChange = (selectedStudents) => {
    setClassData((prev) => ({
      ...prev,
      students: selectedStudents.map(student => student._id),
    }));
  };
  
  // Handle teacher selection
  const handleTeacherChange = (selectedTeachers) => {
    setClassData((prev) => ({
      ...prev,
      teachers: selectedTeachers.map(teacher => teacher._id),
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate the form
    if (!classData.subjectName || !classData.directionName || !classData.schoolId) {
      toast.error('Subject name, direction name, and school are required');
      setIsSubmitting(false);
      return;
    }

    // Filter out schedule entries with empty times
    const filteredSchedule = classData.schedule.filter(
      item => item.startTime && item.endTime
    );

    // Prepare the data for submission
    const submissionData = {
      ...classData,
      schedule: filteredSchedule,
    };

    try {
      if (formMode === 'add') {
        await dispatch(createClass(submissionData)).unwrap();
        toast.success('Class created successfully');
      } else {
        await dispatch(updateClass(submissionData)).unwrap();
        toast.success('Class updated successfully');
      }
      setFormOpen(false);
      dispatch(getClasses()); // Refresh the list
    } catch (error) {
      toast.error(`Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await dispatch(deleteClass(deleteId)).unwrap();
      toast.success('Class deleted successfully');
      handleClose();
    } catch (error) {
      toast.error(`Error deleting class: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Classes
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create, edit, and manage class groups for your school.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Search and add controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Search Classes"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: '300px' }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={isLoading}
        >
          Add New Class
        </Button>
      </Box>
      
      {/* Classes table */}
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell>School</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Teachers</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading classes...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredClasses && filteredClasses.length > 0 ? (
              filteredClasses.map((classItem) => (
                <TableRow key={classItem._id}>
                  <TableCell>{classItem.subjectName}</TableCell>
                  <TableCell>{classItem.directionName}</TableCell>
                  <TableCell>
                    {schools?.find((s) => s._id === classItem.schoolId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {classItem.students?.length || 0} students
                  </TableCell>
                  <TableCell>
                    {classItem.teachers?.length || 0} teachers
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        handleEdit(classItem);
                        setTabValue(2); // Go directly to schedule tab
                      }}
                    >
                      <ScheduleIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        handleEdit(classItem);
                        setTabValue(0); // Go to basic info tab
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(classItem._id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No classes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Delete confirmation dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this class? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add/Edit form dialog */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>{formMode === 'add' ? 'Add New Class' : 'Edit Class'}</DialogTitle>
          <DialogContent>
            <Box sx={{ width: '100%', mt: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                aria-label="class form tabs"
                variant="fullWidth"
              >
                <Tab label="Basic Info" />
                <Tab label="Students & Teachers" />
                <Tab label="Schedule" />
              </Tabs>
              
              {/* Basic Info Tab */}
              {tabValue === 0 && (
                <Box sx={{ p: 2 }}>
                  <TextField
                    name="subjectName"
                    label="Subject Name"
                    value={classData.subjectName}
                    onChange={handleFormChange}
                    fullWidth
                    required
                    margin="normal"
                  />
                  <TextField
                    name="directionName"
                    label="Direction Name"
                    value={classData.directionName}
                    onChange={handleFormChange}
                    fullWidth
                    required
                    margin="normal"
                  />
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>School</InputLabel>
                    <Select
                      name="schoolId"
                      value={classData.schoolId}
                      onChange={handleFormChange}
                      label="School"
                      disabled={true} /* Always disabled - Only one school available */
                    >
                      {/* FULLY HARDCODED - Guaranteed to work */}
                      <MenuItem key="6834cef6ae7eb00ba4d0820d" value="6834cef6ae7eb00ba4d0820d">
                        Φροντιστήριο Βαθύ (Branch)
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
              
              {/* Students & Teachers Tab */}
              {tabValue === 1 && (
                <Box sx={{ p: 2 }}>
                  <Box mb={4}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }} gutterBottom>
                      Select Students
                    </Typography>
                    <Box mb={2}>
                      <TextField
                        fullWidth
                        label="Search Students"
                        variant="outlined"
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                        placeholder="Search by name or email"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        size="small"
                        margin="normal"
                      />
                    </Box>
                    <FormGroup>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Selected: {classData.students.length} student(s)
                        </Typography>
                        {classData.students.length > 0 && (
                          <Button 
                            size="small" 
                            onClick={() => setClassData({...classData, students: []})}
                            startIcon={<ClearIcon fontSize="small" />}
                          >
                            Clear All
                          </Button>
                        )}
                      </Box>
                      <Box sx={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto', 
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        p: 1
                      }}>
                        {filteredStudents.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 2 }}>
                            No students match your search
                          </Typography>
                        ) : (
                          filteredStudents.map((student) => (
                            <FormControlLabel
                              key={student._id}
                              control={
                                <Checkbox
                                  checked={classData.students.includes(student._id)}
                                  onChange={() => handleStudentToggle(student._id)}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {student.firstName} {student.lastName} • {student.email}
                                </Typography>
                              }
                            />
                          ))
                        )}
                      </Box>
                    </FormGroup>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                    
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2 }} gutterBottom>
                      Select Teachers
                    </Typography>
                    <Box mb={2}>
                      <TextField
                        fullWidth
                        label="Search Teachers"
                        variant="outlined"
                        value={teacherFilter}
                        onChange={(e) => setTeacherFilter(e.target.value)}
                        placeholder="Search by name or email"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        size="small"
                        margin="normal"
                      />
                    </Box>
                    <FormGroup>
                      <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                        Selected: {classData.teachers.length} teacher(s)
                      </Typography>
                      <Box sx={{ 
                        maxHeight: '200px', 
                        overflowY: 'auto', 
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        p: 1
                      }}>
                        {filteredTeachers.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 2 }}>
                            No teachers match your search
                          </Typography>
                        ) : (
                          filteredTeachers.map((teacher) => (
                            <FormControlLabel
                              key={teacher._id}
                              control={
                                <Checkbox
                                  checked={classData.teachers.includes(teacher._id)}
                                  onChange={() => handleTeacherToggle(teacher._id)}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {teacher.firstName} {teacher.lastName} • {teacher.email}
                                </Typography>
                              }
                            />
                          ))
                        )}
                      </Box>
                    </FormGroup>
                  </Box>
                </Box>
              )}
              
              {/* Schedule Tab */}
              {tabValue === 2 && (
                <Box sx={{ p: 2 }}>
                  <Divider>
                    <Typography variant="h6">Schedule</Typography>
                  </Divider>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Select the days when this class takes place and set the time range.
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {classData.schedule.map((daySchedule, index) => (
                      <Grid item xs={12} key={daySchedule.day}>
                        <Paper sx={{ p: 2, backgroundColor: daySchedule.active ? 'rgba(25, 118, 210, 0.08)' : 'transparent' }}>
                          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center">
                            <Box display="flex" alignItems="center" width={{ xs: '100%', sm: 'auto' }} mb={{ xs: 1, sm: 0 }}>
                              <Checkbox
                                checked={daySchedule.active}
                                onChange={() => handleDayToggle(index)}
                                color="primary"
                              />
                              <Typography
                                sx={{ width: '100px', fontWeight: daySchedule.active ? 'bold' : 'normal' }}
                                variant="subtitle1"
                              >
                                {daySchedule.day}
                              </Typography>
                            </Box>
                            {daySchedule.active && (
                              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} flex={1} gap={2}>
                                <TextField
                                  fullWidth
                                  label="Start Time"
                                  type="time"
                                  value={daySchedule.startTime || ''}
                                  onChange={(e) =>
                                    handleScheduleChange(
                                      index,
                                      'startTime',
                                      e.target.value
                                    )
                                  }
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                />
                                <TextField
                                  fullWidth
                                  label="End Time"
                                  type="time"
                                  value={daySchedule.endTime || ''}
                                  onChange={(e) =>
                                    handleScheduleChange(
                                      index,
                                      'endTime',
                                      e.target.value
                                    )
                                  }
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFormClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : formMode === 'add' ? (
                'Create'
              ) : (
                'Update'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ManageClasses;
