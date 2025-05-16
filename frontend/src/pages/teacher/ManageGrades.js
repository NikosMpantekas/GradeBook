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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  getGradesByTeacher,
  updateGrade,
  deleteGrade,
  reset,
} from '../../features/grades/gradeSlice';
import { getSubjectsByTeacher } from '../../features/subjects/subjectSlice';
import { getStudentsBySubject } from '../../features/students/studentSlice';

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
    dispatch(getGradesByTeacher(user._id));
    dispatch(getSubjectsByTeacher(user._id));

    return () => {
      dispatch(reset());
    };
  }, [dispatch, user._id]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      if (alertState.message) {
        setAlertState({
          ...alertState,
          open: true,
        });
      }
    }

    if (grades) {
      applyFilters();
    }
  }, [grades, isError, isSuccess, message, searchTerm, subjectFilter]);

  const applyFilters = () => {
    if (!grades) return;

    let filtered = [...grades];

    // Apply subject filter
    if (subjectFilter) {
      filtered = filtered.filter((grade) =>
        grade.subject && grade.subject._id === subjectFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((grade) =>
        (grade.subject && grade.subject.name.toLowerCase().includes(search)) ||
        (grade.description && grade.description.toLowerCase().includes(search)) ||
        (grade.student && grade.student.name && grade.student.name.toLowerCase().includes(search))
      );
    }

    setFilteredGrades(filtered);
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
    // Ensure we store the complete grade data
    setEditGradeData({
      id: grade._id,
      value: grade.value,
      description: grade.description || '',
      student: grade.student?._id || grade.student || '',
      subject: grade.subject?._id || grade.subject || '',
      date: grade.date ? new Date(grade.date) : new Date(),
    });
    
    // Make sure we have all the necessary data for editing
    // If students aren't loaded yet, fetch them based on the subject
    if (grade.subject && (!students || students.length === 0)) {
      dispatch(getStudentsBySubject(grade.subject._id || grade.subject));
    }
    
    setEditDialogOpen(true);
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
      date: date
    };
    
    // Only include description if teacher has permission
    if (user?.canAddGradeDescriptions !== false && description) {
      gradeData.description = description;
    }
    
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
              {filteredGrades.length > 0 ? (
                filteredGrades
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((grade) => (
                    <TableRow hover key={grade._id}>
                      <TableCell>
                        {grade.student ? grade.student.name : 'Unknown Student'}
                      </TableCell>
                      <TableCell>
                        {grade.subject ? grade.subject.name : 'Unknown Subject'}
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
                        {format(new Date(grade.date), 'PP')}
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
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    {grades && grades.length > 0
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
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select the subject for this grade</FormHelperText>
            </FormControl>
            
            {/* Added student selection */}
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="student-label">Student</InputLabel>
              <Select
                labelId="student-label"
                name="student"
                value={editGradeData.student}
                onChange={handleEditChange}
                label="Student"
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select the student for this grade</FormHelperText>
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
