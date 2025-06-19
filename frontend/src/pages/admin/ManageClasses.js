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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { getClasses, deleteClass, createClass, updateClass } from '../../features/classes/classSlice';
import { getSchools } from '../../features/schools/schoolSlice';

const ManageClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { classes, isLoading, isError, message } = useSelector((state) => state.classes);
  const { schools } = useSelector((state) => state.schools);
  
  // State for dialog operations
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [classData, setClassData] = useState({
    name: '',
    description: '',
    schoolId: '',
    year: new Date().getFullYear(),
  });

  // Load classes and schools when component mounts
  useEffect(() => {
    console.log('Loading classes and schools');
    dispatch(getClasses());
    dispatch(getSchools());
  }, [dispatch]);

  // Filter classes when search term changes
  useEffect(() => {
    if (Array.isArray(classes)) {
      setFilteredClasses(
        classes.filter((classItem) =>
          classItem.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
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
      name: '',
      description: '',
      schoolId: user.role === 'admin' ? user.schoolId : '',
      year: new Date().getFullYear(),
    });
    setFormOpen(true);
  };

  const handleEdit = (classItem) => {
    setFormMode('edit');
    setClassData({
      id: classItem._id,
      name: classItem.name || '',
      description: classItem.description || '',
      schoolId: classItem.schoolId || '',
      year: classItem.year || new Date().getFullYear(),
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formMode === 'add') {
        await dispatch(createClass(classData)).unwrap();
        toast.success('Class created successfully');
      } else {
        await dispatch(updateClass(classData)).unwrap();
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
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>School</TableCell>
              <TableCell>Year</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Loading classes...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredClasses.length > 0 ? (
              filteredClasses.map((classItem) => (
                <TableRow key={classItem._id}>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.description}</TableCell>
                  <TableCell>
                    {schools?.find(s => s._id === classItem.schoolId)?.name || 'Unknown School'}
                  </TableCell>
                  <TableCell>{classItem.year || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleEdit(classItem)}
                      color="primary"
                      size="small"
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
                <TableCell colSpan={5} align="center">
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
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>{formMode === 'add' ? 'Add New Class' : 'Edit Class'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                name="name"
                label="Class Name"
                value={classData.name}
                onChange={handleFormChange}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                name="description"
                label="Description"
                value={classData.description}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={3}
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
                  {schools?.map((school) => (
                    <MenuItem key={school._id} value={school._id}>
                      {school.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                name="year"
                label="Year"
                value={classData.year}
                onChange={handleFormChange}
                fullWidth
                type="number"
                margin="normal"
              />
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
