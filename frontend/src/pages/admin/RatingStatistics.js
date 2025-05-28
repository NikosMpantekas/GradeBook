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
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as QuestionIcon
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

  // Get user info from Redux store
  const { userInfo } = useSelector((state) => state?.userLogin || {});

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
          'Authorization': `Bearer ${userInfo?.token}`,
          'Content-Type': 'application/json'
        },
      };

      console.log('Fetching rating periods');
      const response = await axios.get('/api/ratings/periods', config);
      const data = response?.data || [];
      setPeriods(data);
      
      // Set the first period as selected if available
      if (Array.isArray(data) && data.length > 0 && data[0]?._id) {
        setSelectedPeriod(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching rating periods:', error);
      setError('Failed to fetch rating periods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedPeriod) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`,
          'Content-Type': 'application/json'
        },
      };

      // Build query parameters
      let queryParams = `?periodId=${selectedPeriod}`;
      if (selectedTargetType !== 'all') {
        queryParams += `&targetType=${selectedTargetType}`;
      }

      const response = await axios.get(`/api/ratings/stats${queryParams}`, config);
      
      if (response?.data) {
        // Ensure targets is always an array
        const sanitizedData = {
          ...response.data,
          targets: Array.isArray(response.data.targets) ? response.data.targets : [],
          totalRatings: response.data.totalRatings || 0
        };
        setStats(sanitizedData);
      } else {
        setStats({ targets: [] });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch rating statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get human-readable target type
  const getTargetTypeText = (type) => {
    if (!type) return 'Unknown';
    return type === 'teacher' ? 'Teacher' : 'Subject';
  };

  // Get icon for target type
  const getTargetTypeIcon = (type) => {
    if (!type) return <SchoolIcon />;
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
                  {Array.isArray(stats?.targets) ? stats.targets.map((target, index) => (
                    <React.Fragment key={index}>
                      <TableRow>
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
                      {Array.isArray(target?.questionStats) && target.questionStats.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ py: 0, borderBottom: 'none' }}>
                            <Accordion sx={{ boxShadow: 0, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls={`panel-${index}-content`}
                                id={`panel-${index}-header`}
                                sx={{ 
                                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                                  minHeight: '48px',
                                  '&.Mui-expanded': {
                                    minHeight: '48px'
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <QuestionIcon fontSize="small" sx={{ mr: 1 }} />
                                  <Typography variant="body2">Show ratings by question ({target.questionStats.length})</Typography>
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 0 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Question</TableCell>
                                      <TableCell align="center">Type</TableCell>
                                      <TableCell align="center">Rating/Responses</TableCell>
                                      <TableCell align="center">Count</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                     {target.questionStats.map((qStat, qIndex) => (
                                      <TableRow key={qIndex}>
                                        <TableCell>
                                          <Tooltip title={qStat.questionText || 'Unknown Question'} placement="top-start">
                                            <Typography noWrap variant="body2" sx={{ maxWidth: '300px' }}>
                                              {qStat.questionText || 'Unknown Question'}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Chip 
                                            label={qStat.questionType === 'text' ? 'Text' : 'Rating'} 
                                            size="small" 
                                            color={qStat.questionType === 'text' ? 'info' : 'primary'}
                                            variant="outlined"
                                          />
                                        </TableCell>
                                        <TableCell align="center">
                                          {qStat.questionType === 'text' ? (
                                            <Typography variant="body2" color="text.secondary">
                                              Text responses
                                            </Typography>
                                          ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <Rating
                                                value={qStat.average || 0}
                                                precision={0.1}
                                                readOnly
                                                max={5}
                                                size="small"
                                              />
                                              <Typography variant="body2" sx={{ ml: 1 }}>
                                                ({(qStat.average || 0).toFixed(1)})
                                              </Typography>
                                            </Box>
                                          )}
                                        </TableCell>
                                        <TableCell align="center">{qStat.count || 0}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </AccordionDetails>
                            </Accordion>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
