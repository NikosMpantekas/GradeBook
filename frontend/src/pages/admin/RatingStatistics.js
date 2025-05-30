import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateRatingPeriod } from '../../services/ratingService';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Snackbar
} from '@mui/material';

// API URL from config
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * RatingStatistics Component - Fixed Version
 * Properly handles authentication with correct localStorage key
 */
const RatingStatistics = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [statistics, setStatistics] = useState(null);
  
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Navigation hook
  const navigate = useNavigate();
  
  // Get authentication from Redux
  const auth = useSelector((state) => state.auth);
  const userFromRedux = auth?.user; // IMPORTANT: Redux stores under 'user', not 'userInfo'
  
  // Get token with proper fallback to localStorage
  const getAuthToken = useCallback(() => {
    // First try from Redux state
    if (userFromRedux?.token) {
      console.log('✅ Using token from Redux state');
      return userFromRedux.token;
    }
    
    // Fallback to localStorage
    try {
      // IMPORTANT: The app uses 'user' key, not 'userInfo'
      const userString = localStorage.getItem('user');
      if (userString) {
        const parsedUser = JSON.parse(userString);
        if (parsedUser?.token) {
          console.log('✅ Using token from localStorage');
          return parsedUser.token;
        }
      }
    } catch (err) {
      console.error('Error accessing localStorage:', err);
    }
    
    console.error('❌ No authentication token found in Redux or localStorage');
    return null;
  }, [userFromRedux]);
  
  // Create Axios instance with full configuration for all HTTP methods
  const createAxiosInstance = useCallback(() => {
    const token = getAuthToken();
    if (!token) return null;
    
    // Create a properly configured Axios instance
    const instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000, // 15 seconds timeout
    });
    
    // Add response interceptor for better error handling
    instance.interceptors.response.use(
      response => response,
      error => {
        console.error('Axios request failed:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          console.error('No response received, request details:', error.request);
        }
        return Promise.reject(error);
      }
    );
    
    return instance;
  }, [getAuthToken]);
  
  // Fetch rating periods
  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const api = createAxiosInstance();
    if (!api) {
      setError('Authentication required. Please log in to continue.');
      setLoading(false);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }
    
    try {
      console.log('📊 Fetching rating periods with token...');
      const response = await api.get('/api/ratings/periods');
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`📊 Fetched ${response.data.length} rating periods`);
        setPeriods(response.data);
      } else {
        console.warn('📊 No rating periods found or invalid response format');
        setPeriods([]);
      }
    } catch (err) {
      console.error('Error fetching rating periods:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(`Error: ${err.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, createAxiosInstance]);
  
  // Fetch statistics
  const fetchStatistics = useCallback(async (periodId) => {
    if (!periodId) return;
    
    setLoading(true);
    setError(null);
    
    const api = createAxiosInstance();
    if (!api) {
      setError('Authentication required. Please log in to continue.');
      setLoading(false);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }
    
    try {
      console.log(`📊 Fetching statistics for period ${periodId}...`);
      const response = await api.get(`/api/ratings/stats?periodId=${periodId}`);
      
      if (response.data) {
        console.log('📊 Statistics data received successfully');
        setStatistics(response.data);
      } else {
        console.warn('📊 No statistics data in response');
        setStatistics(null);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(`Error: ${err.message || 'Failed to load statistics'}`);
        // Provide more detailed error information in console
        if (err.response) {
          console.error('Error status:', err.response.status);
          console.error('Error details:', err.response.data);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, createAxiosInstance]);
  
  // Update a rating period - using the service implementation for better CORS handling
  const handleRatingPeriodUpdate = useCallback(async (periodId, updateData) => {
    if (!periodId || !updateData) return false;
    
    // Get the token for the service call
    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please log in to continue.');
      return false;
    }
    
    console.log(`🔄 Updating rating period ${periodId}...`);
    console.log('Update data:', updateData);
    
    // Call the service implementation which has comprehensive error handling
    // including specific handling for CORS issues and Network Errors
    return await updateRatingPeriod(
      token,
      periodId,
      updateData,
      navigate,
      setError,
      setLoading
    );
  }, [navigate, getAuthToken]);
  
  // Handle period selection
  const handlePeriodChange = (event) => {
    const newPeriod = event.target.value;
    setSelectedPeriod(newPeriod);
    
    if (newPeriod) {
      fetchStatistics(newPeriod);
    } else {
      setStatistics(null);
    }
  };
  
  // Open edit dialog for a period
  const handleOpenEditDialog = (periodId) => {
    const periodToEdit = periods.find(p => p._id === periodId);
    if (!periodToEdit) return;
    
    setEditingPeriod(periodToEdit);
    
    // Format dates for input fields (yyyy-MM-dd)
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    setEditFormData({
      title: periodToEdit.title || '',
      description: periodToEdit.description || '',
      startDate: periodToEdit.startDate ? formatDate(periodToEdit.startDate) : '',
      endDate: periodToEdit.endDate ? formatDate(periodToEdit.endDate) : ''
    });
    
    setEditDialogOpen(true);
  };
  
  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingPeriod(null);
  };
  
  // Handle form field changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit period edit
  const handleSubmitEdit = async () => {
    if (!editingPeriod) return;
    
    // Basic validation
    if (!editFormData.title) {
      setNotification({
        open: true,
        message: 'Title is required',
        severity: 'error'
      });
      return;
    }
    
    // Prepare data for update
    const updateData = {
      ...editFormData,
      // Add any additional fields needed
    };
    
    console.log('Submitting update for period:', editingPeriod._id);
    console.log('Update data:', updateData);
    
    // Submit using our service function
    const success = await handleRatingPeriodUpdate(editingPeriod._id, updateData);
    
    if (success) {
      // Show success notification
      setNotification({
        open: true,
        message: 'Rating period updated successfully!',
        severity: 'success'
      });
      
      // Close dialog and refresh data
      handleCloseEditDialog();
      fetchPeriods();
    } else {
      // Error notification is handled by the update function
      console.error('Failed to update period');
    }
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);
  
  // Render loading state
  if (loading && !error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  // Render the component
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Rating Statistics
      </Typography>
      
      {/* Rating Periods management section */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Rating Periods
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : periods.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period._id}>
                    <TableCell>{period.title}</TableCell>
                    <TableCell>{period.description || 'N/A'}</TableCell>
                    <TableCell>
                      {period.startDate ? new Date(period.startDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {period.endDate ? new Date(period.endDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => handleOpenEditDialog(period._id)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No rating periods found</Alert>
        )}
      </Paper>
      
      {/* Statistics section */}
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          View Statistics
        </Typography>
        
        {/* Period selection */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="period-select-label">Rating Period</InputLabel>
              <Select
                labelId="period-select-label"
                id="period-select"
                value={selectedPeriod}
                onChange={handlePeriodChange}
                label="Rating Period"
              >
                <MenuItem value="">
                  <em>Select a period</em>
                </MenuItem>
                {periods.map((period) => (
                  <MenuItem key={period._id} value={period._id}>
                    {period.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* No period selected message */}
        {!selectedPeriod && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please select a rating period to view statistics
          </Alert>
        )}
        
        {/* Statistics display */}
        {selectedPeriod && !loading && (
          <Box>
            {statistics ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Statistics for Selected Period
                </Typography>
                
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Question</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Average Rating</TableCell>
                        <TableCell>Responses</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(statistics.questions) ? (
                        statistics.questions.map((question, index) => (
                          <TableRow key={index}>
                            <TableCell>{question.text}</TableCell>
                            <TableCell>{question.type || 'Rating'}</TableCell>
                            <TableCell>
                              {question.type === 'text' ? (
                                'N/A'
                              ) : (
                                <>
                                  {question.averageRating?.toFixed(1) || 'N/A'}
                                  <Rating 
                                    value={question.averageRating || 0} 
                                    readOnly 
                                    precision={0.1}
                                    max={5}
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                </>
                              )}
                            </TableCell>
                            <TableCell>{question.responseCount || 0}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Alert severity="warning">
                              No questions data available
                            </Alert>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="warning">
                No statistics available for the selected period
              </Alert>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Rating Period</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the details for this rating period.
          </DialogContentText>
          
          <TextField
            margin="dense"
            label="Title"
            name="title"
            value={editFormData.title}
            onChange={handleFormChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={editFormData.description}
            onChange={handleFormChange}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Start Date"
                name="startDate"
                type="date"
                value={editFormData.startDate}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="End Date"
                name="endDate"
                type="date"
                value={editFormData.endDate}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSubmitEdit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RatingStatistics;
