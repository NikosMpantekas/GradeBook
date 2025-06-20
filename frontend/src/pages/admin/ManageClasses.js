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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
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
  const [classData, setClassData] = useState({
    subjectName: '',
    directionName: '',
    schoolId: '',
    students: [],
    teachers: [],
    schedule: [
      { day: 'Monday', startTime: '', endTime: '' },
      { day: 'Tuesday', startTime: '', endTime: '' },
      { day: 'Wednesday', startTime: '', endTime: '' },
      { day: 'Thursday', startTime: '', endTime: '' },
      { day: 'Friday', startTime: '', endTime: '' },
    ],
  });

  // Load classes, schools, and users when component mounts
  useEffect(() => {
    console.log('Loading classes, schools, and users');
    dispatch(getClasses());
    dispatch(getSchools());
    dispatch(getUsers());
  }, [dispatch]);

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
    setClassData({
      subjectName: '',
      directionName: '',
      schoolId: user.role === 'admin' ? user.schoolId : '',
      students: [],
      teachers: [],
      schedule: [
        { day: 'Monday', startTime: '', endTime: '' },
        { day: 'Tuesday', startTime: '', endTime: '' },
        { day: 'Wednesday', startTime: '', endTime: '' },
        { day: 'Thursday', startTime: '', endTime: '' },
        { day: 'Friday', startTime: '', endTime: '' },
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
    setClassData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle schedule changes
  const handleScheduleChange = (index, field, value) => {
    setClassData((prev) => {
      const updatedSchedule = [...prev.schedule];
      updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
      return { ...prev, schedule: updatedSchedule };
    });
  };
  
  // Handle student selection
  const handleStudentChange = (selectedStudents) => {
    setClassData((prev) => ({
      ...prev,
      students: selectedStudents,
    }));
  };
  
  // Handle teacher selection
  const handleTeacherChange = (selectedTeachers) => {
    setClassData((prev) => ({
      ...prev,
      teachers: selectedTeachers,
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
                      disabled={user.role === 'admin'} // Admin can only add to their school
                    >
                      {schools?.filter(school => {
                        // EXACT filtering based on known school data
                        try {
                          // Log which school we're checking
                          console.log(`Class Form checking school: ${school.name || 'unnamed'}, ID: ${school._id || 'no ID'}`);
                          
                          // Filter based on exact school IDs and data structure
                          
                          // 1. Skip null/undefined schools
                          if (!school) {
                            return false;
                          }
                          
                          // 2. Main School "Παρώθηση" - Filter out by exact ID
                          if (school._id === '6830531d4930876187757ec4') {
                            console.log(`Class Form: Excluding main cluster Παρώθηση by ID`);
                            return false;
                          }
                          
                          // 3. Main School "Nikos" - Filter out by exact ID
                          if (school._id === '6834c513b7b423cc93e4afee') {
                            console.log(`Class Form: Excluding main cluster Nikos by ID`);
                            return false;
                          }
                          
                          // 4. Branch "Φροντιστήριο Βαθύ" - Keep this one explicitly
                          if (school._id === '6834cef6ae7eb00ba4d0820d') {
                            console.log(`Class Form: KEEPING confirmed branch school: ${school.name}`);
                            return true;
                          }
                          
                          // 5. Schools that are direct branches should be kept
                          if (school.parentCluster) {
                            console.log(`Class Form: KEEPING branch with parent: ${school.name}`);
                            return true;
                          }
                          
                          // 6. Filter out schools with exact main cluster names
                          const mainClusterNames = ['Παρώθηση', 'Nikos'];
                          if (mainClusterNames.includes(school.name)) {
                            console.log(`Class Form: Excluding main cluster by name: ${school.name}`);
                            return false;
                          }
                          
                          // 7. Compare domain with name (normalized for Greek characters)
                          if (school.schoolDomain && school.name) {
                            const normalizedName = school.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            const normalizedDomain = school.schoolDomain.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            
                            // If the domain exactly matches the school name, it's likely a main cluster
                            if (normalizedName === normalizedDomain || 
                                normalizedDomain === 'parwthisi' && school.name === 'Παρώθηση') {
                              console.log(`Class Form: Excluding main cluster by domain: ${school.name}`);
                              return false;
                            }
                          }
                          
                          // By default, include all other schools
                          console.log(`Class Form: KEEPING school: ${school.name}`);
                          return true;
                        } catch (error) {
                          // On error, include the school to be safe
                          console.error('Class Form: Error filtering school, keeping it:', error);
                          return true;
                        }
                      }).map((school) => (
                        <MenuItem key={school._id} value={school._id}>
                          {school.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              
              {/* Students & Teachers Tab */}
              {tabValue === 1 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Students
                  </Typography>
                  <Autocomplete
                    multiple
                    options={users ? users.filter(user => user.role === 'student') : []}
                    getOptionLabel={(option) => option.name}
                    value={users ? users.filter(user => 
                      classData.students.includes(user._id) && user.role === 'student'
                    ) : []}
                    onChange={(event, newValue) => {
                      handleStudentChange(newValue.map(student => student._id));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Students"
                        placeholder="Select students"
                        fullWidth
                        margin="normal"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                  
                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    Select Teachers
                  </Typography>
                  <Autocomplete
                    multiple
                    options={users ? users.filter(user => user.role === 'teacher') : []}
                    getOptionLabel={(option) => option.name}
                    value={users ? users.filter(user => 
                      classData.teachers.includes(user._id) && user.role === 'teacher'
                    ) : []}
                    onChange={(event, newValue) => {
                      handleTeacherChange(newValue.map(teacher => teacher._id));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Teachers"
                        placeholder="Select teachers"
                        fullWidth
                        margin="normal"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                </Box>
              )}
              
              {/* Schedule Tab */}
              {tabValue === 2 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Class Schedule
                  </Typography>
                  <Grid container spacing={2}>
                    {classData.schedule.map((scheduleItem, index) => (
                      <Grid item xs={12} key={scheduleItem.day}>
                        <Card variant="outlined">
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={3}>
                                <Typography variant="body1">
                                  {scheduleItem.day}
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  label="Start Time"
                                  type="time"
                                  value={scheduleItem.startTime}
                                  onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  label="End Time"
                                  type="time"
                                  value={scheduleItem.endTime}
                                  onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                  fullWidth
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
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
