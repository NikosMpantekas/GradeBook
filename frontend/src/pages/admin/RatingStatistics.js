import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
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
 * RatingStatistics Component
 * Displays statistics about teacher and subject ratings
 * with improved authentication handling
 */
const RatingStatistics = () => {
  // State for component
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Navigation
  const navigate = useNavigate();
  
  // Get auth token from Redux
  const authState = useSelector((state) => state.auth);
  const userInfo = authState?.userInfo;
  
  // Get token with comprehensive safeguards
  const token = useMemo(() => {
    // First try from Redux
    let token = userInfo?.token || '';
    
    // If no token in Redux, check localStorage as fallback
    if (!token) {
      try {
        const userInfoString = localStorage.getItem('userInfo');
        if (userInfoString) {
          const parsedUserInfo = JSON.parse(userInfoString);
          token = parsedUserInfo?.token || '';
        }
      } catch (err) {
        console.error('Error accessing localStorage:', err);
      }
    }
    
    return token;
  }, [userInfo]);
  
  // Initialize axios with auth headers
  const initializeAxios = useCallback((specificToken = null) => {
    const tokenToUse = specificToken || token;
    if (!tokenToUse) return null;
    
    return {
      headers: {
        'Authorization': `Bearer ${tokenToUse.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }, [token]);
  
  // Fetch rating periods
  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Ensure we have a token
    if (!token) {
      setError('Authentication required. Please log in to continue.');
      setLoading(false);
      return false;
    }
    
    // Set up request config
    const config = initializeAxios();
    if (!config) {
      setError('Unable to configure authentication. Please try logging in again.');
      setLoading(false);
      return false;
    }
    
    try {
      // Make the API request
      const response = await axios.get(`${API_URL}/api/ratings/periods`, config);
      
      // Process the response
      if (response.data && Array.isArray(response.data)) {
        setPeriods(response.data);
        return true;
      } else {
        setPeriods([]);
        return true;
      }
    } catch (err) {
      // Handle errors
      console.error('Error fetching rating periods:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(`Error: ${err.message || 'Unknown error occurred'}`);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, navigate, initializeAxios]);
  
  // Fetch statistics for a selected period
  const fetchStatistics = useCallback(async (periodId) => {
    if (!periodId || !token) return;
    
    setLoading(true);
    setError(null);
    
    // Set up request config
    const config = initializeAxios();
    if (!config) {
      setError('Authentication error. Please try logging in again.');
      setLoading(false);
      return;
    }
    
    try {
      // Make the API request
      const response = await axios.get(
        `${API_URL}/api/ratings/stats?periodId=${periodId}`, 
        config
      );
      
      // Process the response
      if (response.data) {
        setStatistics(response.data);
      } else {
        setStatistics(null);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(`Error: ${err.message || 'Failed to load statistics'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, initializeAxios]);
  
  // Handle period selection
  const handlePeriodChange = (event) => {
    const newPeriodId = event.target.value;
    setSelectedPeriod(newPeriodId);
    
    if (newPeriodId) {
      fetchStatistics(newPeriodId);
    } else {
      setStatistics(null);
    }
  };
  
  // Fetch periods on component mount
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!authChecked) {
        setAuthChecked(true);
        
        if (!token) {
          setError('Authentication required. Please log in to continue.');
          setLoading(false);
          return;
        }
        
        await fetchPeriods();
      }
    };
    
    checkAuthAndFetchData();
  }, [token, fetchPeriods, authChecked]);
  
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
                
                {/* Display statistics in a formatted way */}
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
