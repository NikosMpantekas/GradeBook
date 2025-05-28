import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
  CircularProgress,
  Rating,
  Alert,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const RatingStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState('all');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [tokenValid, setTokenValid] = useState(true);

  // Add hooks for navigation and dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Add defensive coding for Redux state access
  const { userInfo } = useSelector((state) => state?.userLogin || {});
  
  // Validate token on mount - but only take action if definitely invalid
  useEffect(() => {
    // Reset token valid state on first load - assume valid until proven otherwise
    setTokenValid(true);
    
    // Only redirect if we're certain there's no token
    if (userInfo === null || userInfo === undefined) {
      setTokenValid(false);
      setError('Authentication required. Please log in.');
      // Redirect to login after a short delay
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userInfo, navigate]);

  // Fetch rating periods on component mount
  useEffect(() => {
    fetchRatingPeriods();
  }, []);

  // Fetch stats when period or target type changes
  useEffect(() => {
    if (selectedPeriod) {
      fetchStats();
    }
  }, [selectedPeriod, selectedTargetType]);

  const fetchRatingPeriods = async () => {
    // Only bail completely if we have no userInfo at all
    if (userInfo === null || userInfo === undefined) {
      setError('Authentication required. Please log in again.');
      setTokenValid(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure token is valid and in correct format
      const token = userInfo?.token?.trim();
      if (!token) {
        throw new Error('Invalid authentication token');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };

      console.log('Fetching rating periods with auth token');
      const response = await axios.get('/api/ratings/periods', config);
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const data = response.data || [];
      setPeriods(data);
      
      // Set the first period as selected if available - with extra null checking
      if (Array.isArray(data) && data.length > 0 && data[0] && data[0]._id) {
        setSelectedPeriod(data[0]._id);
      } else {
        console.log('No valid rating periods found or period data structure is unexpected');
      }
    } catch (error) {
      console.error('Error fetching rating periods:', error);
      
      // Check for authentication errors
      if (error?.response?.status === 401 || 
          error?.message?.includes('auth') || 
          error?.message?.includes('token')) {
        setError('Authentication failed. Please log in again.');
        setTokenValid(false);
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to fetch rating periods. Please try again.');
        toast.error(
          error?.response?.data?.message || 'Failed to fetch rating periods'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Guard clause - only for completely missing userInfo or period
    if (userInfo === null || userInfo === undefined) {
      setError('Authentication required. Please try logging in again.');
      console.error('Cannot fetch stats: userInfo missing');
      setTokenValid(false);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    if (!selectedPeriod) {
      setError('Please select a rating period');
      console.error('Cannot fetch stats: periodId missing');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure token is valid and in correct format
      const token = userInfo?.token?.trim();
      if (!token) {
        throw new Error('Invalid authentication token');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };

      // Build query parameters with safety checks
      let queryParams = `?periodId=${encodeURIComponent(selectedPeriod)}`;
      if (selectedTargetType && selectedTargetType !== 'all') {
        queryParams += `&targetType=${encodeURIComponent(selectedTargetType)}`;
      }

      console.log(`Fetching stats with params: ${queryParams}`);
      const response = await axios.get(`/api/ratings/stats${queryParams}`, config);
      
      // Extra validation of the response data
      if (!response?.data) {
        console.warn('Received empty response data from ratings stats API');
        setStats({ targets: [] });
      } else {
        // Ensure targets is always an array even if missing in the response
        const sanitizedData = {
          ...response.data,
          targets: Array.isArray(response.data.targets) ? response.data.targets : [],
          totalRatings: response.data.totalRatings || 0
        };
        setStats(sanitizedData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // Check for authentication errors
      if (error?.response?.status === 401 || 
          error?.message?.includes('auth') || 
          error?.message?.includes('token')) {
        setError('Authentication failed. Please log in again.');
        setTokenValid(false);
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to fetch rating statistics. Please try again.');
        toast.error(
          error?.response?.data?.message || 'Failed to fetch rating statistics'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Get human-readable target type with defensive coding
  const getTargetTypeText = (type) => {
    if (!type) return 'Unknown';
    return type === 'teacher' ? 'Teacher' : 'Subject';
  };

  // Get icon for target type with defensive coding
  const getTargetTypeIcon = (type) => {
    if (!type) return <SchoolIcon />;
    return type === 'teacher' ? <PersonIcon /> : <SchoolIcon />;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Rating Statistics</Typography>
      
      {!tokenValid ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Your session has expired. Redirecting to login...'}
        </Alert>
      ) : error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined" disabled={loading}>
              <InputLabel id="period-select-label">Rating Period</InputLabel>
              <Select
                labelId="period-select-label"
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                label="Rating Period"
              >
                {(periods || []).map((period) => (
                  <MenuItem key={period?._id} value={period?._id}>
                    {period?.title || 'Unnamed Period'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined" disabled={loading}>
              <InputLabel id="target-type-select-label">Target Type</InputLabel>
              <Select
                labelId="target-type-select-label"
                id="target-type-select"
                value={selectedTargetType}
                onChange={(e) => setSelectedTargetType(e.target.value)}
                label="Target Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="teacher">Teachers Only</MenuItem>
                <MenuItem value="subject">Subjects Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={fetchStats}
              disabled={!selectedPeriod || loading}
              fullWidth
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Ratings: {stats?.totalRatings || 0}
                </Typography>
                {(stats?.totalRatings === 0 || !stats?.targets?.length) && (
                  <Alert severity="info">
                    No ratings have been submitted for this period yet.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
          
          {stats?.targets?.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Total Ratings</TableCell>
                    <TableCell align="center">Average Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(stats?.targets) ? stats.targets.map((target, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getTargetTypeIcon(target?.targetType)}
                          <Typography sx={{ ml: 1 }}>
                            {getTargetTypeText(target?.targetType)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{target?.name || 'Unknown'}</TableCell>
                      <TableCell align="center">{target?.totalRatings || 0}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Rating
                            value={target?.averageRating || 0}
                            precision={0.1}
                            readOnly
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({(target?.averageRating || 0).toFixed(1)})
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No target data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          Select a rating period to view statistics
        </Typography>
      )}
    </Container>
  );
};

export default RatingStatistics;
