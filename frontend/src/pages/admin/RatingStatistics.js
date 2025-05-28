import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  IconButton,
  Tabs,
  Tab,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Rating,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';

const RatingStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState('all');
  const [statisticsSummary, setStatisticsSummary] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const { userInfo } = useSelector((state) => state.userLogin);

  // Fetch rating periods on component mount
  useEffect(() => {
    fetchRatingPeriods();
  }, []);

  // Fetch summary stats when period or target type changes
  useEffect(() => {
    if (selectedPeriod) {
      fetchSummaryStats();
    }
  }, [selectedPeriod, selectedTargetType]);

  const fetchRatingPeriods = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/ratings/periods', config);
      setPeriods(data);
      
      // Set the first period as selected if available
      if (data.length > 0) {
        setSelectedPeriod(data[0]._id);
      }
    } catch (error) {
      toast.error(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch rating periods'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryStats = async () => {
    setSummaryLoading(true);
    setDetailedStats(null);
    setSelectedTarget(null);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Build query parameters
      let queryParams = `?periodId=${selectedPeriod}`;
      if (selectedTargetType !== 'all') {
        queryParams += `&targetType=${selectedTargetType}`;
      }

      const { data } = await axios.get(`/api/ratings/stats${queryParams}`, config);
      setStatisticsSummary(data);
    } catch (error) {
      toast.error(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch rating statistics'
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchTargetStats = async (targetType, targetId) => {
    setDetailLoading(true);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        `/api/ratings/stats/${targetType}/${targetId}?periodId=${selectedPeriod}`, 
        config
      );
      
      setDetailedStats(data);
      setSelectedTarget({
        targetType,
        targetId,
        name: statisticsSummary.targets.find(
          t => t.targetType === targetType && t.targetId === targetId
        )?.name || 'Unknown'
      });
      
      // Switch to the detailed tab
      setActiveTab(1);
    } catch (error) {
      toast.error(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch detailed statistics'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Format date from ISO string
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Convert target type to readable text
  const getTargetTypeText = (type) => {
    return type === 'teacher' ? 'Teacher' : 'Subject';
  };

  // Get icon for target type
  const getTargetTypeIcon = (type) => {
    return type === 'teacher' ? <PersonIcon /> : <SchoolIcon />;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader title="Rating Statistics" />
      
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
                {periods.map((period) => (
                  <MenuItem key={period._id} value={period._id}>
                    {period.title}
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
              onClick={fetchSummaryStats}
              disabled={!selectedPeriod || loading}
              fullWidth
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="rating statistics tabs">
            <Tab label="Summary" />
            <Tab label="Detailed View" disabled={!detailedStats} />
          </Tabs>
        </Box>
        
        {/* Summary Tab */}
        {activeTab === 0 && (
          <Box>
            {summaryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : statisticsSummary ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Total Ratings: {statisticsSummary.totalRatings}
                </Typography>
                
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table aria-label="ratings summary table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="center">Total Ratings</TableCell>
                        <TableCell align="center">Average Rating</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statisticsSummary.targets.length > 0 ? (
                        statisticsSummary.targets.map((target) => (
                          <TableRow key={`${target.targetType}-${target.targetId}`}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getTargetTypeIcon(target.targetType)}
                                <Typography sx={{ ml: 1 }}>
                                  {getTargetTypeText(target.targetType)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{target.name || 'Unknown'}</TableCell>
                            <TableCell align="center">{target.totalRatings}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Rating 
                                  value={target.averageRating} 
                                  precision={0.1} 
                                  readOnly 
                                />
                                <Typography sx={{ ml: 1 }}>
                                  ({target.averageRating.toFixed(1)})
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => fetchTargetStats(target.targetType, target.targetId)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No ratings found for this period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography variant="body1" color="textSecondary" align="center">
                Select a rating period to view statistics
              </Typography>
            )}
          </Box>
        )}
        
        {/* Detailed View Tab */}
        {activeTab === 1 && detailedStats && (
          <Box>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                          {getTargetTypeText(selectedTarget.targetType)}: {selectedTarget.name}
                        </Typography>
                        <Typography variant="body1">
                          Total Ratings: {detailedStats.totalRatings}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                          Overall Rating
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={detailedStats.averageRating} 
                            precision={0.1} 
                            readOnly 
                            size="large" 
                          />
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            ({detailedStats.averageRating.toFixed(1)})
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                
                <Typography variant="h6" gutterBottom>
                  Question Ratings
                </Typography>
                
                {detailedStats.questionStats.map((question) => (
                  <Accordion key={question.questionId} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={8}>
                          <Typography variant="subtitle1">
                            {question.questionText}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Rating 
                              value={question.averageRating} 
                              precision={0.1} 
                              readOnly 
                              size="small" 
                            />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              ({question.averageRating.toFixed(1)})
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      {question.textAnswers && question.textAnswers.length > 0 ? (
                        <List>
                          {question.textAnswers.map((answer, index) => (
                            <ListItem key={index} divider={index < question.textAnswers.length - 1}>
                              <ListItemText
                                primary={answer.answer}
                                secondary={`${answer.student} - ${formatDate(answer.date)}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No text feedback provided for this question
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
                
                {detailedStats.textFeedback && detailedStats.textFeedback.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      All Text Feedback
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <List>
                        {detailedStats.textFeedback.map((feedback, index) => (
                          <ListItem key={index} divider={index < detailedStats.textFeedback.length - 1}>
                            <ListItemText
                              primary={feedback.answer}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="textPrimary">
                                    {feedback.question}
                                  </Typography>
                                  {` - ${feedback.student} (${formatDate(feedback.date)})`}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default RatingStatistics;
