import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
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
  
  // Debug schools data
  useEffect(() => {
    if (schools) {
      console.log(`Schools data received: ${schools.length} schools`);
      console.log('Schools:', JSON.stringify(schools, null, 2));
    }
  }, [schools]);

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

  // Add debug logging for classes state
  useEffect(() => {
    if (classes && classes.length > 0) {
      console.log(`Received ${classes.length} classes from the backend`);
      console.log('First class data structure:', JSON.stringify(classes[0], null, 2));
    }
  }, [classes]);
  
  // Filter classes when search term changes
  useEffect(() => {
    if (Array.isArray(classes)) {
      setFilteredClasses(
        classes.filter((classItem) => {
          if (searchTerm === '') return true; // Show all classes when no search term
          
          // Account for both backend (subject/direction) and frontend (subjectName/directionName) field names
          const subject = classItem.subject || classItem.subjectName || '';
          const direction = classItem.direction || classItem.directionName || '';
          
          const subjectMatch = subject.toLowerCase().includes(searchTerm.toLowerCase());
          const directionMatch = direction.toLowerCase().includes(searchTerm.toLowerCase());
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
    console.log('Editing class:', classItem);
    setFormMode('edit');
    
    // Create complete schedule template with all days of the week
    const fullWeekTemplate = [
      { day: 'Monday', startTime: '', endTime: '', active: false },
      { day: 'Tuesday', startTime: '', endTime: '', active: false },
      { day: 'Wednesday', startTime: '', endTime: '', active: false },
      { day: 'Thursday', startTime: '', endTime: '', active: false },
      { day: 'Friday', startTime: '', endTime: '', active: false },
      { day: 'Saturday', startTime: '', endTime: '', active: false },
      { day: 'Sunday', startTime: '', endTime: '', active: false },
    ];
    
    // Process the existing schedule data (if any)
    let processedSchedule = fullWeekTemplate;
    if (classItem.schedule && Array.isArray(classItem.schedule) && classItem.schedule.length > 0) {
      // Map each existing schedule entry to its corresponding day in the template
      processedSchedule = fullWeekTemplate.map(template => {
        const existingEntry = classItem.schedule.find(s => s.day === template.day);
        if (existingEntry) {
          return {
            ...template,
            startTime: existingEntry.startTime || '',
            endTime: existingEntry.endTime || '',
            active: true // If there's data for this day, mark it as active
          };
        }
        return template;
      });
    }
    
    // Get students and teachers data
    // If we have full objects, extract IDs; if we have just IDs, keep them as is
    let studentIds = [];
    if (classItem.students) {
      studentIds = classItem.students.map(student => 
        typeof student === 'object' && student._id ? student._id : student
      );
    }
    
    let teacherIds = [];
    if (classItem.teachers) {
      teacherIds = classItem.teachers.map(teacher => 
        typeof teacher === 'object' && teacher._id ? teacher._id : teacher
      );
    }
    
    console.log('Processed student IDs:', studentIds);
    console.log('Processed teacher IDs:', teacherIds);
    
    // Map backend field names to frontend field names if needed
    setClassData({
      id: classItem._id,
      subjectName: classItem.subject || classItem.subjectName || '',
      directionName: classItem.direction || classItem.directionName || '',
      schoolId: classItem.schoolBranch || classItem.schoolId || '',
      students: studentIds,
      teachers: teacherIds,
      schedule: processedSchedule,
    });
    
    console.log('Setting form data:', {
      id: classItem._id,
      subjectName: classItem.subject || classItem.subjectName || '',
      directionName: classItem.direction || classItem.directionName || '',
      schoolId: classItem.schoolBranch || classItem.schoolId || '',
      students: studentIds.length,
      teachers: teacherIds.length,
      schedule: processedSchedule
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
    const newActiveState = !updatedSchedule[index].active;
    
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      active: newActiveState,
      // Keep times if activating, reset if deactivating
      startTime: newActiveState ? updatedSchedule[index].startTime : '',
      endTime: newActiveState ? updatedSchedule[index].endTime : '',
    };
    
    console.log(`Toggling day ${updatedSchedule[index].day} to ${newActiveState ? 'active' : 'inactive'}`);
    
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

    // Only include active days but make sure they have complete data
    const filteredSchedule = classData.schedule
      .filter(item => item.active)
      .map(item => ({
        day: item.day,
        startTime: item.startTime || '08:00', // Default time if not set
        endTime: item.endTime || '09:00'     // Default time if not set
      }));
      
    // Make sure we always have at least one schedule entry
    if (filteredSchedule.length === 0) {
      filteredSchedule.push({
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00'
      });
    }

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
                  <TableCell>{classItem.subject || classItem.subjectName}</TableCell>
                  <TableCell>{classItem.direction || classItem.directionName}</TableCell>
                  <TableCell>
                    {schools?.find((s) => s._id === classItem.schoolBranch || s._id === classItem.schoolId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {classItem.students?.length || 0} students
                  </TableCell>
                  <TableCell>
                    {classItem.teachers?.length || 0} teachers
                  </TableCell>
                  <TableCell>
                    {classItem.schedule && classItem.schedule.length > 0 ? (
                      <Tooltip title="View Schedule">
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
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No schedule</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Class">
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
                    </Tooltip>
                    <Tooltip title="Delete Class">
                      <IconButton
                        onClick={() => handleDelete(classItem._id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
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
                    >
                      {/* Show all available schools (don't filter by type) */}
                      {schools && schools.length > 0 ? (
                        schools.map((school) => (
                          <MenuItem key={school._id} value={school._id}>
                            {school.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No schools available</MenuItem>
                      )}
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
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={filteredStudents || []}
                      getOptionLabel={(option) => {
                        // Ensure we have valid first and last names
                        const firstName = option.firstName || '';
                        const lastName = option.lastName || '';
                        return `${firstName} ${lastName}`.trim() || option.email || 'Unknown student';
                      }}
                      value={(filteredStudents || []).filter(user => 
                        classData.students && 
                        Array.isArray(classData.students) && 
                        classData.students.includes(user._id)
                      )}
                      onChange={(event, newValue) => {
                        setClassData({
                          ...classData,
                          students: newValue.map(student => student._id)
                        });
                      }}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option => 
                          option.firstName?.toLowerCase().includes(inputValue.toLowerCase()) || 
                          option.lastName?.toLowerCase().includes(inputValue.toLowerCase()) || 
                          option.email?.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label="Students"
                          placeholder="Search and select students"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            )
                          }}
                          fullWidth
                          margin="normal"
                        />
                      )}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox
                            style={{ marginRight: 8 }}
                            checked={selected}
                          />
                          <Typography variant="body2">
                            {option.firstName} {option.lastName} • {option.email || ''}
                          </Typography>
                        </li>
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={`${option.firstName || ""} ${option.lastName || ""}`.trim() || option.email || "User"}
                            size="small"
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                    />
                    {classData.students.length > 0 && (
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Button 
                          size="small" 
                          onClick={() => setClassData({...classData, students: []})}
                          startIcon={<ClearIcon fontSize="small" />}
                        >
                          Clear All
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />
                    
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2 }} gutterBottom>
                      Select Teachers
                    </Typography>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={filteredTeachers || []}
                      getOptionLabel={(option) => {
                        // Ensure we have valid first and last names
                        const firstName = option.firstName || '';
                        const lastName = option.lastName || '';
                        return `${firstName} ${lastName}`.trim() || option.email || 'Unknown teacher';
                      }}
                      value={(filteredTeachers || []).filter(user => 
                        classData.teachers && 
                        Array.isArray(classData.teachers) && 
                        classData.teachers.includes(user._id)
                      )}
                      onChange={(event, newValue) => {
                        setClassData({
                          ...classData,
                          teachers: newValue.map(teacher => teacher._id)
                        });
                      }}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option => 
                          option.firstName?.toLowerCase().includes(inputValue.toLowerCase()) || 
                          option.lastName?.toLowerCase().includes(inputValue.toLowerCase()) || 
                          option.email?.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label="Teachers"
                          placeholder="Search and select teachers"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            )
                          }}
                          fullWidth
                          margin="normal"
                        />
                      )}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox
                            style={{ marginRight: 8 }}
                            checked={selected}
                          />
                          <Typography variant="body2">
                            {option.firstName} {option.lastName} • {option.email || ''}
                          </Typography>
                        </li>
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={`${option.firstName || ""} ${option.lastName || ""}`.trim() || option.email || "User"}
                            size="small"
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                    />
                    {classData.teachers.length > 0 && (
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Button 
                          size="small" 
                          onClick={() => setClassData({...classData, teachers: []})}
                          startIcon={<ClearIcon fontSize="small" />}
                        >
                          Clear All
                        </Button>
                      </Box>
                    )}
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
