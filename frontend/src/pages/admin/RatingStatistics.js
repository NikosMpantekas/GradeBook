import React, { useEffect, useState, useRef } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
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
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../../config/appConfig';

// Component to render the printable report
const PrintableReport = ({ stats, periodTitle, filters }) => {
  if (!stats) return null;
  
  // Filter targets based on selected filters
  const filteredTargets = stats.targets?.filter(target => {
    // Filter by target type
    if (filters.targetType !== 'all' && target.targetType !== filters.targetType) {
      return false;
    }
    return true;
  }) || [];
  
  return (
    <div style={{ padding: '20px', maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>Rating Statistics Report</h1>
        <h2>{periodTitle || 'All Periods'}</h2>
        <p>Generated on: {new Date().toLocaleString()}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Summary</h3>
        <p>Total Ratings: {stats.totalRatings || 0}</p>
      </div>
      
      {filteredTargets.length > 0 && (
        <div>
          <h3>Targets Overview</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Total Ratings</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Average Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredTargets.map((target, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {target.targetType === 'teacher' ? 'Teacher' : 'Subject'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{target.name || 'Unknown'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{target.totalRatings || 0}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{(target.averageRating || 0).toFixed(1)}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTargets.map((target, tIndex) => (
            <div key={tIndex} style={{ marginBottom: '30px', breakInside: 'avoid' }}>
              <h3>{target.targetType === 'teacher' ? 'Teacher' : 'Subject'}: {target.name}</h3>
              
              <h4>Questions Detail</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Question</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Type</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Rating/Responses</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(target.questionStats) && target.questionStats.map((qStat, qIndex) => (
                    <tr key={qIndex}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{qStat.questionText || 'Unknown Question'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{qStat.questionType === 'text' ? 'Text' : 'Rating'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        {qStat.questionType === 'text' ? 
                          'Text Responses' : 
                          `${(qStat.average || 0).toFixed(1)}/5`
                        }
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{qStat.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* School and Direction Breakdown */}
              {Array.isArray(target.questionStats) && target.questionStats.some(q => q.schools && Object.keys(q.schools).length > 0) && (
                <div>
                  <h4>Response Distribution by School</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Question</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>School</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {target.questionStats.flatMap((qStat, qIndex) => 
                        qStat.schools ? 
                          Object.entries(qStat.schools).map(([schoolId, schoolData], sIndex) => (
                            <tr key={`${qIndex}-${sIndex}`}>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{qStat.questionText}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{schoolData.name}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{schoolData.count}</td>
                            </tr>
                          ))
                        : []
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {Array.isArray(target.questionStats) && target.questionStats.some(q => q.directions && Object.keys(q.directions).length > 0) && (
                <div>
                  <h4>Response Distribution by Direction</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Question</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Direction</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {target.questionStats.flatMap((qStat, qIndex) => 
                        qStat.directions ? 
                          Object.entries(qStat.directions).map(([directionId, directionData], dIndex) => (
                            <tr key={`${qIndex}-${dIndex}`}>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{qStat.questionText}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{directionData.name}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{directionData.count}</td>
                            </tr>
                          ))
                        : []
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Display text responses if available */}
              {Array.isArray(target.questionStats) && target.questionStats.some(q => q.questionType === 'text' && q.responses && q.responses.length > 0) && (
                <div>
                  <h4>Text Responses</h4>
                  {target.questionStats
                    .filter(q => q.questionType === 'text' && q.responses && q.responses.length > 0)
                    .map((qStat, qIndex) => (
                      <div key={qIndex} style={{ marginBottom: '20px' }}>
                        <h5>{qStat.questionText}</h5>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                          {qStat.responses.map((response, rIndex) => (
                            <li key={rIndex} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                              <div><strong>Response:</strong> {response.text}</div>
                              {response.studentName && <div><strong>Student:</strong> {response.studentName}</div>}
                              {response.schoolName && <div><strong>School:</strong> {response.schoolName}</div>}
                              {response.directionName && <div><strong>Direction:</strong> {response.directionName}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Text Response Dialog Component
const TextResponsesDialog = ({ open, handleClose, responses, question }) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Text Responses for: {question}
      </DialogTitle>
      <DialogContent dividers>
        {responses && responses.length > 0 ? (
          <List>
            {responses.map((response, index) => (
              <ListItem key={index} divider={index < responses.length - 1}>
                <ListItemText
                  primary={response.text}
                  secondary={
                    <React.Fragment>
                      {response.studentName && <Typography component="span" variant="body2">Student: {response.studentName}</Typography>}
                      {response.schoolName && (
                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                          <SchoolIcon fontSize="small" /> School: {response.schoolName}
                        </Typography>
                      )}
                      {response.directionName && (
                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                          <LocationIcon fontSize="small" /> Direction: {response.directionName}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No text responses available.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Print Report Dialog Component
const PrintReportDialog = ({ open, handleClose, onPrint, onFilterChange, filters }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Print Report Options</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Target Type</InputLabel>
              <Select
                value={filters.targetType}
                onChange={(e) => onFilterChange('targetType', e.target.value)}
                label="Target Type"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="teacher">Teachers Only</MenuItem>
                <MenuItem value="subject">Subjects Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={onPrint} color="primary" variant="contained" startIcon={<PrintIcon />}>
          Print Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RatingStatistics = () => {
  const [loading, setLoading] = useState(false);
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

  const token = useSelector((state) => state.auth?.userInfo?.token);
  const reportRef = useRef();

  const fetchRatingPeriods = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/api/ratings/periods`, config);
      if (response.data) {
        setPeriods(response.data);
      }
    } catch (err) {
      console.error('Error fetching rating periods:', err);
      setError('Failed to fetch rating periods. Please try again.');
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
        // Consider redirecting to login page here
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (periodId = '') => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Using the general stats endpoint
      const url = `${API_URL}/api/ratings/stats`;
      // Add period as a query parameter if provided
      const urlWithParams = periodId ? `${url}?periodId=${periodId}` : url;
      
      console.log('Fetching statistics from:', urlWithParams);
      const response = await axios.get(urlWithParams, config);
      if (response.data) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to fetch statistics. Please try again.');
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
        // Consider redirecting to login page here
      }
    } finally {
      setLoading(false);
    }
  };

  const showTextResponsesFromStats = (targetId, questionId) => {
    // Find the target and question in statistics
    if (!statistics || !statistics.targets) {
      toast.error('Statistics data not available');
      return;
    }
    
    const target = statistics.targets.find(t => t.targetId === targetId);
    if (!target || !target.questionStats) {
      toast.error('Target not found in statistics');
      return;
    }
    
    const question = target.questionStats.find(q => q.questionId === questionId);
    if (!question) {
      toast.error('Question not found in statistics');
      return;
    }
    
    // Use the text responses already in the statistics data
    if (question.textResponses && question.textResponses.length > 0) {
      // Format the responses for the dialog
      const formattedResponses = question.textResponses.map(resp => ({
        text: resp.text,
        studentName: resp.student || 'Anonymous Student',
        schoolName: resp.school || 'Unknown School',
        directionName: resp.direction || 'Unknown Direction',
        date: resp.date ? new Date(resp.date).toLocaleString() : ''
      }));
      
      setTextResponses(formattedResponses);
      setCurrentQuestion(question.questionText);
      setShowTextResponses(true);
    } else {
      toast.info('No text responses available for this question');
    }
  };

  // Keep this as a fallback in case we need it in the future
  const fetchTextResponses = async (targetId, questionId) => {
    setLoading(true);
    try {
      // Text responses are now included in the main statistics response
      // This function is kept as a fallback but should not be needed
      toast.info('Using statistics data for text responses');
      showTextResponsesFromStats(targetId, questionId);
    } catch (err) {
      console.error('Error handling text responses:', err);
      toast.error('Failed to show text responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event) => {
    const periodId = event.target.value;
    setSelectedPeriod(periodId);
    fetchStatistics(periodId);
  };

  const handleRefresh = () => {
    fetchStatistics(selectedPeriod);
  };

  const handleShowTextResponses = (targetId, questionId) => {
    showTextResponsesFromStats(targetId, questionId);
  };
  
  const handleCloseTextResponses = () => {
    setShowTextResponses(false);
    setTextResponses([]);
    setCurrentQuestion('');
  };

  const handlePrintDialogOpen = () => {
    setPrintDialogOpen(true);
  };
  
  const handlePrintDialogClose = () => {
    setPrintDialogOpen(false);
  };
  
  const handlePrintFilterChange = (field, value) => {
    setPrintFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Rating Statistics Report - ${selectedPeriod ? periods.find(p => p._id === selectedPeriod)?.title : 'All Periods'}`,
    onAfterPrint: () => {
      setPrintDialogOpen(false);
      toast.success('Report printed successfully');
    }
  });

  useEffect(() => {
    fetchRatingPeriods();
    fetchStatistics();
  }, []);

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Rating Statistics
          </Typography>
          <Divider />
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Rating Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                label="Filter by Rating Period"
              >
                <MenuItem value="">All Periods</MenuItem>
                {periods.map((period) => (
                  <MenuItem key={period._id} value={period._id}>
                    {period.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={handleRefresh}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PrintIcon />} 
              onClick={handlePrintDialogOpen}
            >
              Print Report
            </Button>
          </Grid>
        </Grid>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : statistics ? (
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
                
                {statistics.targets.map((target) => (
                  <Accordion key={target.targetId} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        {target.targetType === 'teacher' ? (
                          <PersonIcon sx={{ mr: 1 }} />
                        ) : (
                          <SchoolIcon sx={{ mr: 1 }} />
                        )}
                        {target.targetType === 'teacher' ? 'Teacher: ' : 'Subject: '}
                        <strong>{target.name}</strong>
                        <Chip 
                          label={`${target.totalRatings} ratings`} 
                          size="small" 
                          sx={{ ml: 2 }} 
                        />
                        <Chip 
                          label={`Avg: ${(target.averageRating || 0).toFixed(1)}/5`} 
                          color="primary" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
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
                              <TableCell align="center">Distribution</TableCell>
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
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<QuestionIcon />}
                                      onClick={() => handleShowTextResponses(target.targetId, qStat.questionId)}
                                    >
                                      View {qStat.count || 0} Responses
                                    </Button>
                                  ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Rating value={qStat.average || 0} precision={0.1} readOnly max={5} />
                                      <Typography variant="body2" sx={{ ml: 1 }}>
                                        ({(qStat.average || 0).toFixed(1)})
                                      </Typography>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  {qStat.count || 0}
                                </TableCell>
                                <TableCell align="center">
                                  {(qStat.schools && Object.keys(qStat.schools).length > 0) || 
                                   (qStat.directions && Object.keys(qStat.directions).length > 0) ? (
                                    <Tooltip
                                      title={
                                        <React.Fragment>
                                          {qStat.schools && Object.keys(qStat.schools).length > 0 && (
                                            <div>
                                              <Typography variant="body2">
                                                <SchoolIcon fontSize="small" /> Schools:
                                              </Typography>
                                              {Object.entries(qStat.schools).map(([id, data]) => (
                                                <Typography key={id} variant="body2" sx={{ pl: 2 }}>
                                                  {data.name}: {data.count} responses
                                                </Typography>
                                              ))}
                                            </div>
                                          )}
                                          
                                          {qStat.directions && Object.keys(qStat.directions).length > 0 && (
                                            <div style={{ marginTop: '8px' }}>
                                              <Typography variant="body2">
                                                <LocationIcon fontSize="small" /> Directions:
                                              </Typography>
                                              {Object.entries(qStat.directions).map(([id, data]) => (
                                                <Typography key={id} variant="body2" sx={{ pl: 2 }}>
                                                  {data.name}: {data.count} responses
                                                </Typography>
                                              ))}
                                            </div>
                                          )}
                                        </React.Fragment>
                                      }
                                    >
                                      <IconButton size="small">
                                        <InfoIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    '—'
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
        ) : (
          <Alert severity="info">
            Select a rating period to view statistics.
          </Alert>
        )}
      </Paper>
      
      {/* Hidden printable report */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef}>
          <PrintableReport 
            stats={statistics} 
            periodTitle={selectedPeriod ? periods.find(p => p._id === selectedPeriod)?.title : 'All Periods'} 
            filters={printFilters} 
          />
        </div>
      </div>
      
      {/* Text responses dialog */}
      <TextResponsesDialog
        open={showTextResponses}
        handleClose={handleCloseTextResponses}
        responses={textResponses}
        question={currentQuestion}
      />
      
      {/* Print dialog */}
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
