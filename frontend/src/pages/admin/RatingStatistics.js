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
  Rating
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
  
  // Main render
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Rating Statistics
      </Typography>
      
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
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
    </Container>
  );
};

export default RatingStatistics;
