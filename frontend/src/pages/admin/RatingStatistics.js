import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
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
  Chip,
  IconButton,
  Badge
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as QuestionIcon,
  Print as PrintIcon,
  FilterAlt as FilterIcon,
  LocationOn as LocationIcon,
  Domain as DomainIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

// Import components and services
import PrintableReport from '../../components/statistics/PrintableReport';
import TextResponsesDialog from '../../components/statistics/TextResponsesDialog';
import PrintReportDialog from '../../components/statistics/PrintReportDialog';
import { fetchRatingPeriods, fetchStatistics, validateToken } from '../../services/ratingService';

/**
 * RatingStatistics Component - Displays statistics about teacher and subject ratings
 */
const RatingStatistics = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [showTextResponses, setShowTextResponses] = useState(false);
  const [textResponses, setTextResponses] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printFilters, setPrintFilters] = useState({
    targetType: 'all'
  });
  
  // State for selected target type and ID
  const [selectedTargetType, setSelectedTargetType] = useState('teacher');
  const [selectedTargetId, setSelectedTargetId] = useState('');

  // Get user info and token from Redux store
  const userInfo = useSelector((state) => state.auth?.userInfo);
  const token = userInfo?.token || '';
  const navigate = useNavigate();
  
  // Reference for printable report
  const reportRef = useRef();

  // Main component initialization and data fetching
  useEffect(() => {
    console.log('📊 COMPONENT: RatingStatistics initialization');
    let isMounted = true; // Flag to prevent state updates after unmount
    
    const initializeComponent = async () => {
      // Only proceed if component is still mounted
      if (!isMounted) return;
      
      // Start with a clean slate
      setError(null);
      setLoading(true);
      
      // Server logs show authentication is actually working
      // Check if token exists - but don't do extra validation
      if (!token || token.trim() === '') {
        console.error('❌ No authentication token available');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          if (isMounted) navigate('/login');
        }, 2000);
        return;
      }
      
      console.log('🔐 Auth token present:', token.substring(0, 10) + '...');
      
      try {
        // Configure axios - ensure headers are properly set for all requests
        const authToken = token.trim();
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        // Debug log to track request lifecycle
        console.log('📡 Fetching rating periods...');
        
        // CRITICAL FIX: Don't set loading false before the request
        // We'll handle loading in the finally block
        const periodsData = await fetchRatingPeriods(authToken, navigate, null, null);
        
        // Safety check - component may have unmounted during async operation
        if (!isMounted) return;
        
        if (periodsData && Array.isArray(periodsData)) {
          console.log(`✅ Success! Got ${periodsData.length} rating periods`);
          setPeriods(periodsData);
          
          // Fetch statistics if period is selected
          if (selectedPeriod) {
            console.log('📊 Fetching statistics for period:', selectedPeriod);
            const statsData = await fetchStatistics(
              authToken, 
              navigate, 
              selectedPeriod, 
              selectedTargetType, 
              selectedTargetId, 
              null, // Don't set error here, we'll handle it locally
              null  // Don't set loading here, we'll handle it locally
            );
            
            // Safety check again
            if (!isMounted) return;
            
            if (statsData && (Array.isArray(statsData) || typeof statsData === 'object')) {
              console.log('✅ Statistics data received successfully');
              setStatistics(statsData);
            } else {
              console.warn('⚠️ Statistics data is empty or invalid');
            }
          }
        } else {
          console.warn('⚠️ No periods data returned or unexpected format');
          // Show a user-friendly message instead of error
          toast.info('No rating periods available. Please create some first.');
        }
      } catch (error) {
        // Don't update state if unmounted
        if (!isMounted) return;
        
        console.error('❌ Error in RatingStatistics component:', error);
        
        // Determine the appropriate error message based on the error
        if (error.response) {
          console.error('   Response status:', error.response.status);
          console.error('   Response data:', JSON.stringify(error.response.data));
          
          // Handle different error types with appropriate messages
          if (error.response.status === 401) {
            const errorMsg = 'Your session has expired. Please log in again.';
            console.error('❌ Authentication error (401):', errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
            setTimeout(() => {
              if (isMounted) navigate('/login');
            }, 2000);
          } else if (error.response.status === 403) {
            const errorMsg = 'You do not have permission to view rating statistics.';
            console.error('❌ Authorization error (403):', errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
          } else if (error.response.status === 404) {
            const errorMsg = 'Rating statistics feature not available on this server.';
            console.error('❌ Not found error (404):', errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
          } else {
            const errorMsg = `Server error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`;
            console.error('❌ Server error:', errorMsg);
            setError(errorMsg);
            toast.error('Error loading rating statistics. Please try again later.');
          }
        } else if (error.request) {
          const errorMsg = 'Server did not respond. Please check your connection.';
          console.error('❌ Network error:', errorMsg);
          setError(errorMsg);
          toast.error(errorMsg);
        } else {
          const errorMsg = `Error: ${error.message || 'Unknown error occurred'}`;
          console.error('❌ Application error:', errorMsg);
          setError(errorMsg);
          toast.error('Error loading rating statistics. Please try again later.');
        }
      } finally {
        // Always clean up loading state if component is still mounted
        if (isMounted) {
          console.log('🏁 Component initialization completed');
          setLoading(false);
        }
      }
    };
    
    // Start the initialization process
    initializeComponent();
    
    // Cleanup function to prevent memory leaks and side effects
    return () => {
      console.log('🧹 Cleaning up RatingStatistics component');
      isMounted = false;
      // Clean up axios defaults to prevent affecting other components
      delete axios.defaults.headers.common['Authorization'];
    };
  }, [token, navigate, selectedPeriod, selectedTargetType, selectedTargetId]);

  // Handle period selection
  const handlePeriodChange = async (e) => {
    const periodId = e.target.value;
    setSelectedPeriod(periodId);
    
    if (periodId) {
      try {
        const statsData = await fetchStatistics(
          token, 
          navigate, 
          periodId, 
          selectedTargetType, 
          selectedTargetId, 
          setError, 
          setLoading
        );
        
        if (statsData) {
          setStatistics(statsData);
        }
      } catch (error) {
        console.error('Error handling period change:', error);
        // Error is already handled in fetchStatistics
      }
    } else {
      setStatistics(null);
    }
  };

  // Handle refreshing data
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Refetch periods
      const periodsData = await fetchRatingPeriods(token, navigate, setError, setLoading);
      
      if (periodsData) {
        setPeriods(periodsData);
        
        // Refetch statistics if period is selected
        if (selectedPeriod) {
          const statsData = await fetchStatistics(
            token, 
            navigate, 
            selectedPeriod, 
            selectedTargetType, 
            selectedTargetId, 
            setError, 
            setLoading
          );
          
          if (statsData) {
            setStatistics(statsData);
            toast.success('Statistics refreshed successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle showing text responses
  const handleShowTextResponses = (responses, question) => {
    setTextResponses(responses || []);
    setCurrentQuestion(question || '');
    setShowTextResponses(true);
  };

  // Handle closing text responses dialog
  const handleCloseTextResponses = () => {
    setShowTextResponses(false);
  };

  // Handle opening print dialog
  const handlePrintDialogOpen = () => {
    setPrintDialogOpen(true);
  };

  // Handle closing print dialog
  const handlePrintDialogClose = () => {
    setPrintDialogOpen(false);
  };

  // Handle print filter change
  const handlePrintFilterChange = (filterName, value) => {
    setPrintFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Handle printing
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Rating Statistics Report - ${new Date().toLocaleDateString()}`,
    onAfterPrint: () => {
      handlePrintDialogClose();
      toast.success('Report printed successfully');
    },
    onPrintError: () => toast.error('Failed to print report')
  });

  // Get period title for the selected period
  const getSelectedPeriodTitle = () => {
    if (!selectedPeriod || !periods || periods.length === 0) return '';
    const period = periods.find(p => p._id === selectedPeriod);
    return period ? period.title : '';
  };

  // Only show the 'select a rating period' message if there's no error and no statistics
  const showSelectPeriodMessage = !error && !statistics && !loading;
  
  // Only show the statistics content when there's data and no authentication error
  const showStatisticsContent = statistics && !error?.includes('Authentication required');

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Rating Statistics
          </Typography>
          <Divider />
        </Box>

        {/* Only show one set of filters */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Rating Period</InputLabel>
              <Select
                value={selectedPeriod || ''}
                onChange={handlePeriodChange}
                label="Filter by Rating Period"
                displayEmpty
                disabled={loading || (error && error.includes('Authentication required'))}
              >
                <MenuItem value="">All Periods</MenuItem>
                {Array.isArray(periods) && periods.length > 0 ? (
                  periods.map((period) => (
                    <MenuItem key={period._id} value={period._id}>
                      {period.title} {period.isActive && '(Active)'}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No rating periods available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Target Type</InputLabel>
              <Select
                value={selectedTargetType}
                onChange={(e) => {
                  setSelectedTargetType(e.target.value);
                  setSelectedTargetId('');
                }}
                label="Filter by Target Type"
                disabled={loading || (error && error.includes('Authentication required'))}
              >
                <MenuItem value="teacher">Teachers</MenuItem>
                <MenuItem value="subject">Subjects</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {selectedTargetType && statistics?.targets && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select {selectedTargetType === 'teacher' ? 'Teacher' : 'Subject'}</InputLabel>
                <Select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  label={`Select ${selectedTargetType === 'teacher' ? 'Teacher' : 'Subject'}`}
                  disabled={loading || (error && error.includes('Authentication required'))}
                >
                  <MenuItem value="">All {selectedTargetType === 'teacher' ? 'Teachers' : 'Subjects'}</MenuItem>
                  {statistics?.targets
                    ?.filter(target => target.targetType === selectedTargetType)
                    .map(target => (
                      <MenuItem key={target.targetId} value={target.targetId}>
                        {target.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={handleRefresh}
              sx={{ mr: 1 }}
              disabled={loading || (error && error.includes('Authentication required'))}
            >
              Refresh
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PrintIcon />} 
              onClick={handlePrintDialogOpen}
              disabled={!statistics || loading || (error && error.includes('Authentication required'))}
            >
              Print Report
            </Button>
          </Grid>
        </Grid>

        {/* Error message with high priority */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Select period message */}
        {showSelectPeriodMessage && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Select a rating period to view statistics.
          </Alert>
        )}

        {/* Statistics content */}
        {showStatisticsContent && (
          <div>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Typography>
                  Total Ratings: {statistics.totalRatings || 0}
                </Typography>
              </CardContent>
            </Card>

            {Array.isArray(statistics.targets) && statistics.targets.length > 0 ? (
              <div>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Target Details
                </Typography>
                
                {statistics.targets
                  .filter(target => !selectedTargetType || target.targetType === selectedTargetType)
                  .filter(target => !selectedTargetId || target.targetId === selectedTargetId)
                  .map((target) => (
                  <Accordion key={target.targetId} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        {target.targetType === 'teacher' ? (
                          <PersonIcon sx={{ mr: 1 }} />
                        ) : (
                          <SchoolIcon sx={{ mr: 1 }} />
                        )}
                        {target.name} ({target.targetType === 'teacher' ? 'Teacher' : 'Subject'})
                        <Chip 
                          label={`${target.totalRatings} ratings`} 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 2 }} 
                        />
                        <Rating 
                          value={target.averageRating || 0} 
                          precision={0.5} 
                          readOnly 
                          size="small"
                          sx={{ ml: 2 }}
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({(target.averageRating || 0).toFixed(1)})
                        </Typography>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Question</TableCell>
                              <TableCell align="center">Type</TableCell>
                              <TableCell align="center">Rating/Responses</TableCell>
                              <TableCell align="center">Count</TableCell>
                              <TableCell align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Array.isArray(target.questionStats) && target.questionStats.map((qStat) => (
                              <TableRow key={qStat.questionId}>
                                <TableCell>
                                  {qStat.questionText}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={qStat.questionType === 'text' ? 'Text' : 'Rating'}
                                    color={qStat.questionType === 'text' ? 'secondary' : 'primary'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {qStat.questionType === 'text' ? (
                                    <Badge badgeContent={qStat.responses?.length || 0} color="primary">
                                      <QuestionIcon />
                                    </Badge>
                                  ) : (
                                    <>
                                      <Rating 
                                        value={qStat.average || 0} 
                                        precision={0.5} 
                                        readOnly 
                                        size="small"
                                      />
                                      <Typography variant="body2">
                                        ({(qStat.average || 0).toFixed(1)}/5)
                                      </Typography>
                                    </>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  {qStat.count || 0}
                                </TableCell>
                                <TableCell align="center">
                                  {qStat.questionType === 'text' && qStat.responses && qStat.responses.length > 0 && (
                                    <Button 
                                      size="small" 
                                      onClick={() => handleShowTextResponses(qStat.responses, qStat.questionText)}
                                      startIcon={<QuestionIcon />}
                                    >
                                      View Responses
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </div>
            ) : (
              <Alert severity="info">
                No rating data available for the selected period.
              </Alert>
            )}
          </div>
        )}
      </Paper>
      
      {/* Hidden printable report */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef}>
          <PrintableReport 
            stats={statistics} 
            periodTitle={getSelectedPeriodTitle()}
            filters={printFilters}
          />
        </div>
      </div>
      
      {/* Dialogs */}
      <TextResponsesDialog 
        open={showTextResponses}
        handleClose={handleCloseTextResponses}
        responses={textResponses}
        question={currentQuestion}
      />
      
      <PrintReportDialog 
        open={printDialogOpen}
        handleClose={handlePrintDialogClose}
        onPrint={handlePrint}
        onFilterChange={handlePrintFilterChange}
        filters={printFilters}
      />
    </Container>
  );
};

export default RatingStatistics;
