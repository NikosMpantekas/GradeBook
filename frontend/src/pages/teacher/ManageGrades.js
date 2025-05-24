import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Snackbar,
  Alert,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getStudentsBySubject } from '../../features/students/studentSlice';
import { toast } from 'react-toastify';
import {
  getGradesByTeacher,
  getAllGrades,
  updateGrade,
  deleteGrade,
  reset,
} from '../../features/grades/gradeSlice';
import { getSubjectsByTeacher, getSubjects } from '../../features/subjects/subjectSlice';

const ManageGrades = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { grades, isLoading, isSuccess, isError, message } = useSelector((state) => state.grades);
  const { subjects } = useSelector((state) => state.subjects);
  const { students } = useSelector((state) => state.students);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGradeData, setEditGradeData] = useState({
    id: '',
    value: 0,
    description: '',
    student: '',
    subject: '',
    date: new Date(),
  });
  const [alertState, setAlertState] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Force refetch on component mount to avoid stale data issues
    const fetchData = async () => {
      if (user && user._id) {
        try {
          console.log('Fetching grades data');
          // Clear the grades first to prevent stale data display
          dispatch(reset());
          
          // Fetch grades with a slight delay to ensure reset takes effect
          setTimeout(() => {
            // If user is admin, fetch all grades instead of just teacher's grades
            if (user.role === 'admin') {
              console.log('Admin user detected - fetching ALL grades');
              dispatch(getAllGrades())
                .unwrap()
                .then(data => {
                  console.log(`Successfully fetched ${data?.length || 0} grades for admin`);
                  if (data && data.length === 0) {
                    console.log('API returned empty grades array - no grades exist in the system');
                  }
                })
                .catch(error => {
                  console.error('Error fetching all grades:', error);
                  toast.error('Failed to load grades. Please try again.');
                });
            } else {
              console.log('Fetching grades for teacher ID:', user._id);
              dispatch(getGradesByTeacher(user._id))
                .unwrap()
                .then(data => {
                  console.log(`Successfully fetched ${data?.length || 0} grades for teacher`);
                  if (data && data.length === 0) {
                    console.log('API returned empty grades array - this is expected if teacher has no grades');
                  }
                })
                .catch(error => {
                  console.error('Error fetching teacher grades:', error);
                  toast.error('Failed to load grades. Please try again.');
                });
            }
            
            // Fetch subjects (both admin and teacher need this)
            if (user.role === 'admin') {
              dispatch(getSubjects());
            } else {
              dispatch(getSubjectsByTeacher(user._id));
            }
          }, 100);
        } catch (error) {
          console.error('Error in grades fetch flow:', error);
          toast.error('Something went wrong. Please refresh the page.');
        }
      } else {
        console.error('User ID missing - cannot fetch grades');
        toast.error('User information is missing. Please try logging in again.');
      }
    };
    
    fetchData();

    return () => {
      dispatch(reset());
    };
  }, [dispatch, user]);



  useEffect(() => {
    if (isError) {
      toast.error(message || 'An error occurred loading grades');
    }

    if (isSuccess) {
      if (alertState.message) {
        setAlertState({
          ...alertState,
          open: true,
        });
      }
      
      // Log success information for debugging
      console.log(`Grade fetch succeeded, received: ${grades?.length || 0} grades`);
      if (grades && grades.length === 0) {
        console.log('Received empty array of grades from server');
      }
    }

    // Always call applyFilters, even if grades is empty array
    // This ensures the UI updates properly with empty state
    applyFilters();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grades, isError, isSuccess, message, searchTerm, subjectFilter, alertState]);

  const applyFilters = () => {
    // Safety check that grades exists and is an array
    if (!grades || !Array.isArray(grades)) {
      console.warn('Cannot filter grades: grades is not an array', grades);
      setFilteredGrades([]);
      return;
    }

    console.log(`Applying filters to ${grades.length} grades`);
    
    try {
      let filtered = [...grades];

      // Apply subject filter
      if (subjectFilter) {
        filtered = filtered.filter((grade) => {
          if (!grade) return false;
          // Handle both object references and direct IDs
          const subjectId = typeof grade.subject === 'object' ? grade.subject?._id : grade.subject;
          return subjectId === subjectFilter;
        });
        console.log(`After subject filter: ${filtered.length} grades`);
      }

      // Apply search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter((grade) => {
          if (!grade) return false;
          
          // Safely check subject name
          const hasSubjectMatch = grade.subject && 
            (typeof grade.subject === 'object' ? 
              (grade.subject.name && grade.subject.name.toLowerCase().includes(search)) : 
              false);
              
          // Safely check description
          const hasDescriptionMatch = grade.description && 
            grade.description.toLowerCase().includes(search);
            
          // Safely check student name
          const hasStudentMatch = grade.student && 
            (typeof grade.student === 'object' ? 
              (grade.student.name && grade.student.name.toLowerCase().includes(search)) : 
              false);
              
          return hasSubjectMatch || hasDescriptionMatch || hasStudentMatch;
        });
        console.log(`After search filter: ${filtered.length} grades`);
      }

      console.log(`Final filtered grades: ${filtered.length}`);
      setFilteredGrades(filtered);
    } catch (error) {
      console.error('Error in applyFilters:', error);
      // Fallback to showing all grades in case of error
      setFilteredGrades(grades);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSubjectFilterChange = (event) => {
    setSubjectFilter(event.target.value);
    setPage(0);
  };

  const handleAddGrade = () => {
    navigate('/app/teacher/grades/create');
  };

  // Delete Grade Dialog
  const handleDeleteClick = (grade) => {
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (gradeToDelete) {
      dispatch(deleteGrade(gradeToDelete._id))
        .then((result) => {
          if (result.meta.requestStatus === 'fulfilled') {
            setAlertState({
              open: true,
              message: 'Grade deleted successfully',
              severity: 'success',
            });
            setFilteredGrades((prev) => prev.filter(grade => grade._id !== gradeToDelete._id));
          }
        });
    }
    setDeleteDialogOpen(false);
    setGradeToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setGradeToDelete(null);
  };

  // Edit Grade Dialog
  const handleEditClick = (grade) => {
    console.log('Edit grade clicked:', grade);
    
    // CRITICAL FIX: Store the complete student object for better display
    const studentObject = typeof grade.student === 'object' ? grade.student : null;
    const studentId = studentObject ? studentObject._id : grade.student;
    const studentName = studentObject ? studentObject.name : null;
    
    const subjectObject = typeof grade.subject === 'object' ? grade.subject : null;
    const subjectId = subjectObject ? subjectObject._id : grade.subject;
    const subjectName = subjectObject ? subjectObject.name : null;
    
    // EMERGENCY FIX: Directly preload the student data in memory to avoid reliance on API
    console.log('CRITICAL FIX - Preloaded student data:', {
      studentId,
      studentName,
      subjectId,
      subjectName
    });
    
    // Force update the editGradeData with complete student information
    const newGradeData = {
      id: grade._id,
      value: grade.value,
      description: grade.description || '',
      student: studentId,
      subject: subjectId,
      date: grade.date ? new Date(grade.date) : new Date(),
      // CRITICAL FIX: Add cached student data to avoid reliance on redux
      studentObject: studentObject,
      studentName: studentName,
      subjectName: subjectName
    };
    
    // Update the form state with the correct data
    setEditGradeData(newGradeData);
    
    // Make sure we have all the necessary data for editing
    try {
      // CRITICAL FIX: Force immediate student data retrieval before opening dialog
      if (subjectId) {
        // Show loading toast
        toast.info('Loading students data...', {
          autoClose: 2000,
          position: 'bottom-right'
        });
        
        // Dispatch action to fetch students
        dispatch(getStudentsBySubject(subjectId))
          .unwrap()
          .then(fetchedStudents => {
            console.log(`Successfully loaded ${fetchedStudents.length} students`);
            
            // Double-check if our student is in the list, add if missing
            if (studentObject && !fetchedStudents.find(s => s._id === studentId)) {
              console.log('CRITICAL FIX: Adding missing student to students list');
              dispatch({
                type: 'students/studentsLoaded',
                payload: [...fetchedStudents, studentObject]
              });
            }
            
            // Open the dialog after data is loaded
            setEditDialogOpen(true);
          })
          .catch(error => {
            console.error('Failed to load students:', error);
            // Continue anyway with our cached student data
            toast.warning('Using cached student data due to API error');
            setEditDialogOpen(true);
          });
      } else {
        // No subject ID, just open the dialog
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Critical error in edit process:', error);
      // Open dialog anyway - we have the cached student data
      setEditDialogOpen(true);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // For grade value, ensure it's within 0-100 range
    if (name === 'value') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return;
      if (numValue < 0) return;
      if (numValue > 100) return;
    }
    
    setEditGradeData({
      ...editGradeData,
      [name]: value,
    });
  };

  const handleEditSave = () => {
    const { id, value, description, student, subject, date } = editGradeData;
    
    // Create comprehensive grade data with all editable fields
    const gradeData = {
      value: parseInt(value, 10),
      student: student,
      subject: subject,
      date: date instanceof Date ? format(date, 'yyyy-MM-dd') : date
    };
    
    // Only include description if teacher has permission
    if (user?.canAddGradeDescriptions !== false && description) {
      gradeData.description = description;
    }
    
    console.log('Updating grade with data:', { id, gradeData });
    
    dispatch(updateGrade({
      id,
      gradeData
    }))
      .then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          setAlertState({
            open: true,
            message: 'Grade updated successfully',
            severity: 'success',
          });
        }
      });
    
    setEditDialogOpen(false);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
  };

  const handleAlertClose = () => {
    setAlertState({
      ...alertState,
      open: false,
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Manage Grades
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddGrade}
        >
          Add Grade
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by student or subject"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="subject-filter-label">Filter by Subject</InputLabel>
              <Select
                labelId="subject-filter-label"
                id="subject-filter"
                value={subjectFilter}
                onChange={handleSubjectFilterChange}
                label="Filter by Subject"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>All Subjects</em>
                </MenuItem>
                {subjects && subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>



      {/* Grades Table */}
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="grades table">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(filteredGrades) && filteredGrades.length > 0 ? (
                filteredGrades
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((grade) => {
                    if (!grade) return null;
                    return (
                      <TableRow hover key={grade._id}>
                        <TableCell>
                          {grade.student ? (typeof grade.student === 'object' ? grade.student.name : 'Unknown Student') : 'Unknown Student'}
                        </TableCell>
                        <TableCell>
                          {grade.subject ? (typeof grade.subject === 'object' ? grade.subject.name : 'Unknown Subject') : 'Unknown Subject'}
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 'bold',
                              color: grade.value >= 50 ? 'success.main' : 'error.main',
                            }}
                          >
                            {grade.value}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {grade.description 
                            ? (grade.description.length > 30 
                                ? `${grade.description.substring(0, 30)}...` 
                                : grade.description)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {grade.date ? format(new Date(grade.date), 'PP') : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={grade.value >= 50 ? 'Passed' : 'Failed'}
                            color={grade.value >= 50 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            aria-label="edit grade"
                            onClick={() => handleEditClick(grade)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            aria-label="delete grade"
                            onClick={() => handleDeleteClick(grade)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    {isLoading
                      ? 'Loading grades...'
                      : isError
                        ? 'Error loading grades. Please try again.'
                        : Array.isArray(grades) && grades.length > 0
                          ? 'No grades match the filter criteria.'
                          : 'No grades found. Add a grade to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredGrades.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this grade? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Grade Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="md" fullWidth>
        <DialogTitle>Edit Grade</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            {/* Added subject selection */}
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="subject-label">Subject</InputLabel>
              <Select
                labelId="subject-label"
                name="subject"
                value={editGradeData.subject}
                onChange={handleEditChange}
                label="Subject"
              >
                {Array.isArray(subjects) && subjects.length > 0 ? subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                )) : <MenuItem disabled>No subjects available</MenuItem>}
              </Select>
              <FormHelperText>Select the subject for this grade</FormHelperText>
            </FormControl>
            
            {/* EMERGENCY FIX: Completely redesigned student selection that always shows the student */}
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="student-label">Student</InputLabel>
              <Select
                labelId="student-label"
                name="student"
                value={editGradeData.student || ''}
                onChange={handleEditChange}
                label="Student"
              >
                {/* CRITICAL FIX: Always show the current student as first option */}
                {editGradeData.student && (
                  <MenuItem key={`current-${editGradeData.student}`} value={editGradeData.student}>
                    {editGradeData.studentName || students.find(s => s._id === editGradeData.student)?.name || `Student ID: ${editGradeData.student}`}
                  </MenuItem>
                )}
                
                {/* Then show divider if we're showing additional students */}
                {editGradeData.student && Array.isArray(students) && students.length > 0 && (
                  <Divider sx={{ my: 1 }} />
                )}
                
                {/* Then show other available students */}
                {isLoading ? (
                  <MenuItem disabled>Loading students...</MenuItem>
                ) : Array.isArray(students) && students.length > 0 ? (
                  students
                    // Filter out duplicates of current student
                    .filter(student => student._id !== editGradeData.student)
                    .map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name}
                      </MenuItem>
                    ))
                ) : (
                  <MenuItem disabled>No other students available</MenuItem>
                )}
              </Select>
              <FormHelperText sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {editGradeData.studentName ? 
                  `Student: ${editGradeData.studentName}` : 
                  editGradeData.student ? 
                    `Student ID: ${editGradeData.student}` : 
                    'Select a student for this grade'}
              </FormHelperText>
            </FormControl>
            
            {/* Grade value field */}
            <TextField
              margin="dense"
              name="value"
              label="Grade Value"
              type="number"
              fullWidth
              variant="outlined"
              value={editGradeData.value}
              onChange={handleEditChange}
              InputProps={{
                inputProps: { min: 0, max: 100 }
              }}
              required
              helperText="Enter a value between 0 and 100"
            />
            
            {/* Added date picker */}
            <TextField
              margin="dense"
              name="date"
              label="Date"
              type="date"
              fullWidth
              variant="outlined"
              value={editGradeData.date ? format(new Date(editGradeData.date), 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value) : new Date();
                setEditGradeData({
                  ...editGradeData,
                  date: newDate
                });
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: format(new Date(), 'yyyy-MM-dd') }}
              helperText="Select the date for this grade"
            />
            
            {/* Description field - only show if teacher has permission */}
            {(user?.canAddGradeDescriptions !== false) && (
              <TextField
                margin="dense"
                name="description"
                label="Description / Feedback"
                type="text"
                fullWidth
                variant="outlined"
                value={editGradeData.description}
                onChange={handleEditChange}
                multiline
                rows={4}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button onClick={handleEditSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alertState.open}
        autoHideDuration={5000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alertState.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageGrades;
