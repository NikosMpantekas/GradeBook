import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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

  const { userInfo } = useSelector((state) => state.userLogin);

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
    setLoading(true);
    setError(null);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const response = await axios.get('/api/ratings/periods', config);
      const data = response?.data || [];
      setPeriods(data);
      
      // Set the first period as selected if available
      if (data.length > 0) {
        setSelectedPeriod(data[0]._id);
      }
    } catch (error) {
      setError('Failed to fetch rating periods. Please try again.');
      toast.error(
        error?.response?.data?.message || 'Failed to fetch rating periods'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      // Build query parameters
      let queryParams = `?periodId=${selectedPeriod}`;
      if (selectedTargetType !== 'all') {
        queryParams += `&targetType=${selectedTargetType}`;
      }

      const response = await axios.get(`/api/ratings/stats${queryParams}`, config);
      setStats(response?.data || { targets: [] });
    } catch (error) {
      setError('Failed to fetch rating statistics. Please try again.');
      toast.error(
        error?.response?.data?.message || 'Failed to fetch rating statistics'
      );
    } finally {
      setLoading(false);
    }
  };

  // Get human-readable target type
  const getTargetTypeText = (type) => {
    return type === 'teacher' ? 'Teacher' : 'Subject';
  };

  // Get icon for target type
  const getTargetTypeIcon = (type) => {
    return type === 'teacher' ? <PersonIcon /> : <SchoolIcon />;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Rating Statistics</Typography>
      
      {error && (
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
                  {stats.targets.map((target, index) => (
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
                  ))}
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
