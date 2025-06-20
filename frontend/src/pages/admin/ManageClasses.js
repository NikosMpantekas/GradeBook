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
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { getClasses, deleteClass, createClass, updateClass } from '../../features/classes/classSlice';
import { getSchools } from '../../features/schools/schoolSlice';
import { getUsers } from '../../features/users/userSlice';

const ManageClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { classes: reduxClasses, isLoading, isError, message } = useSelector(
    (state) => state.classes
  );
  const { schools } = useSelector((state) => state.schools);
  const { users } = useSelector((state) => state.users);
  
  // State for dialog operations
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [localLoading, setLocalLoading] = useState(true);
  const [forceRefreshTrigger, setForceRefreshTrigger] = useState(0);
  
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

  // Filter classes when searchTerm or classes changes
  useEffect(() => {
    // If no classes yet from Redux, don't try to filter
    if (!reduxClasses) {
      setFilteredClasses([]);
      return;
    }
    
    // If no search term, use all classes
    if (!searchTerm.trim()) {
      setFilteredClasses(reduxClasses);
      return;
    }

    console.log(`Filtering ${reduxClasses.length} classes with term: ${searchTerm}`);
    
    const filtered = reduxClasses.filter((cls) => {
      // Search in all text fields
      return (
        cls.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.direction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.teachers?.some(
          (t) =>
            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        cls.students?.some(
          (s) =>
            s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    });

    setFilteredClasses(filtered);
    console.log(`Found ${filtered.length} classes matching search term`);
  }, [searchTerm, reduxClasses, forceRefreshTrigger]);

  // Load all required data
  const loadData = async () => {
    try {
      setLocalLoading(true);
      await dispatch(getClasses()).unwrap();
      await dispatch(getSchools()).unwrap();
      await dispatch(getUsers()).unwrap();
      console.log('Initial data load complete');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load required data');
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // This will run when component unmounts
    return () => {
      console.log('ManageClasses component unmounting');
    };
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  // Force refresh function that can be called when we need to ensure the UI updates
  const forceRefreshClasses = useCallback(async () => {
    try {
      console.log('Force refreshing classes list');
      setLocalLoading(true);
      await dispatch(getClasses()).unwrap();
      setForceRefreshTrigger(prev => prev + 1); // Increment trigger to force re-render
      console.log('Classes refreshed successfully');
    } catch (error) {
      console.error('Error refreshing classes:', error);
      toast.error('Failed to refresh classes data');
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

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
    
    // Map existing schedule to the template
    let processedSchedule = [...fullWeekTemplate];
    if (classItem.schedule && Array.isArray(classItem.schedule)) {
      // Process each day in the existing schedule
      classItem.schedule.forEach(item => {
        // Find the day in our template
        const dayIndex = processedSchedule.findIndex(d => d.day === item.day);
        if (dayIndex >= 0) {
          // Update the template with the existing schedule data
          processedSchedule[dayIndex] = {
            ...processedSchedule[dayIndex],
            startTime: item.startTime || '',
            endTime: item.endTime || '',
            active: true // If it's in the schedule, it's active
          };
        }
      });
    }
    
    // Get the IDs of teachers and students
    const teacherIds = (classItem.teachers || []).map(teacher => 
      typeof teacher === 'string' ? teacher : teacher._id
    );
    
    const studentIds = (classItem.students || []).map(student => 
      typeof student === 'string' ? student : student._id
    );
    
    // Store the class ID for update operation
    const classId = classItem._id;
    
    setClassData({
      _id: classId, // Store the ID in the state
      subjectName: classItem.subject || classItem.subjectName || '',
      directionName: classItem.direction || classItem.directionName || '',
      schoolId: classItem.schoolBranch || classItem.schoolId || '',
      students: studentIds,
      teachers: teacherIds,
      schedule: processedSchedule,
    });
    
    console.log('Setting form data:', {
      _id: classId,
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

    if (!classData.subjectName || !classData.directionName || !classData.schoolId) {
      toast.error('Subject name, direction name, and school are required');
      setIsSubmitting(false);
      return;
    }

    // Validate schedule times
    for (const day in classData.schedule) {
      for (const slot of classData.schedule[day]) {
        if (slot.startTime && !slot.endTime) {
          toast.error(`End time is required when start time is provided for ${day}`);
          setIsSubmitting(false);
          return;
        }
        if (!slot.startTime && slot.endTime) {
          toast.error(
            `Start time is required when end time is provided for ${day}`
          );
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      // Create a flat schedule array with only non-empty slots
      const filteredSchedule = [];
      for (const day in classData.schedule) {
        for (const slot of classData.schedule[day]) {
          if (slot.startTime && slot.endTime) {
            filteredSchedule.push({
              day,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          }
        }
      }

      const submissionData = {
        ...classData,
        schedule: filteredSchedule,
      };

      if (formMode === 'add') {
        // Create a new class
        console.log('Creating new class with data:', submissionData);
        const addResult = await dispatch(createClass(submissionData)).unwrap();
        console.log('Class creation result:', addResult);
        toast.success('Class created successfully');
        
        // Close dialog first then refresh data to avoid UI jank
        handleFormClose();
        await forceRefreshClasses();
      } else {
        // For update mode, verify we have a class ID
        if (!classData._id) {
          console.error('Cannot update class: Missing class ID')
          toast.error('Cannot update class: Missing ID')
          setIsSubmitting(false);
          return;
        }
        
        // CRITICAL FIX: Ensure the ID is properly set with priority
        const classIdToUse = classData._id;
        const enhancedData = {
          ...submissionData,
          _id: classIdToUse,  // Primary ID format
          id: classIdToUse    // Alternative ID format for robustness
        };
        
        console.log('Updating class with ID:', classIdToUse);
        console.log('Full update payload:', enhancedData);
        
        // Update the class - FIXED: removed nested try-catch to ensure setIsSubmitting(false) always runs
        try {
          // CRITICAL FIX: Use Promise.all with catch to prevent hanging on errors
          const updateResult = await dispatch(updateClass(enhancedData)).unwrap();
          console.log('Class update API success:', updateResult);
          
          // Close dialog immediately to prevent UI hanging
          handleFormClose();
          toast.success('Class updated successfully');
          
          // Then force refresh the data
          await forceRefreshClasses().catch(err => {
            console.error('Error refreshing after successful update:', err);
            // Still consider the update successful even if refresh fails
          });
          
          console.log('Update and refresh workflow complete');
        } catch (updateError) {
          // Handle errors and make sure dialog closes
          handleFormClose();
          console.error('Class update operation failed:', updateError);
          toast.error(`Update failed: ${updateError?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'An error occurred');
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
  
  // Show loading state if data is being loaded
  if (localLoading || isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}
      >
        <CircularProgress />
        <Typography variant="subtitle1" sx={{ ml: 2 }}>
          Loading class data...
        </Typography>
      </Box>
    );
  }
  
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
      >
        Add Class
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
