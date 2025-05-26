import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Rating,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Tab,
  Tabs
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { getRatingStats, getRatingPeriods } from '../../features/ratings/ratingSlice';
import { getSubjects } from '../../features/subjects/subjectSlice';
import { getUsers } from '../../features/users/userSlice';
import ErrorState from '../common/ErrorState';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8DD1E1', '#A4DE6C'];

const RatingStatsViewer = ({ targetType, targetId, periodId }) => {
  const dispatch = useDispatch();
  const { stats, periods, isLoading } = useSelector((state) => state.ratings);
  const { subjects } = useSelector((state) => state.subjects);
  const { users } = useSelector((state) => state.users);
  
  const [selectedPeriodId, setSelectedPeriodId] = useState(periodId || 'all');
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch data
  useEffect(() => {
    dispatch(getRatingPeriods());
    
    if (targetType === 'subject') {
      dispatch(getSubjects());
    } else if (targetType === 'teacher') {
      dispatch(getUsers({ role: 'teacher' }));
    }
  }, [dispatch, targetType]);

  // Get stats when target or period changes
  useEffect(() => {
    if (targetType && targetId) {
      dispatch(getRatingStats({
        targetType,
        targetId,
        periodId: selectedPeriodId === 'all' ? null : selectedPeriodId
      }));
    }
  }, [dispatch, targetType, targetId, selectedPeriodId]);

  // Handle period change
  const handlePeriodChange = (event) => {
    setSelectedPeriodId(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Get target name
  const getTargetName = () => {
    if (targetType === 'teacher') {
      const teacher = users?.find(user => user._id === targetId);
      return teacher ? teacher.name : 'Teacher';
    } else if (targetType === 'subject') {
      const subject = subjects?.find(subject => subject._id === targetId);
      return subject ? subject.name : 'Subject';
    }
    return 'Unknown';
  };

  // Format distribution data for charts
  const formatDistributionData = (distribution) => {
    if (!distribution) return [];
    
    return Object.keys(distribution).map(value => ({
      value: parseInt(value),
      count: distribution[value]
    }));
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Loading rating statistics...</Typography>
      </Box>
    );
  }

  // Render error state if no stats
  if (!stats && !isLoading) {
    return (
      <ErrorState message="Could not load rating statistics" />
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Rating Statistics for {getTargetName()}
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Rating Period</InputLabel>
          <Select
            value={selectedPeriodId}
            label="Rating Period"
            onChange={handlePeriodChange}
          >
            <MenuItem value="all">All Periods</MenuItem>
            {periods?.map((period) => (
              <MenuItem key={period._id} value={period._id}>
                {period.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {stats && (
        <>
          {/* Summary Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="overline" display="block">
                      Total Ratings
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {stats.totalRatings}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="overline" display="block">
                      Average Rating
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ mr: 1 }}>
                        {stats.averageRating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / 10
                      </Typography>
                    </Box>
                    <Rating 
                      value={stats.averageRating / 2} 
                      precision={0.1} 
                      readOnly 
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="overline" display="block">
                      Periods
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {Object.keys(stats.periods).length}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs for different types of data */}
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Questions" />
              <Tab label="Distribution" />
              <Tab label="Text Responses" />
            </Tabs>
          </Box>

          {/* Questions Tab */}
          {currentTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Rating by Question
              </Typography>
              <Grid container spacing={2}>
                {Object.values(stats.questions)
                  .filter(q => q.type === 'rating')
                  .map((question) => (
                    <Grid item xs={12} md={6} key={question.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {question.text}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h5" color="primary" sx={{ mr: 1 }}>
                              {question.average.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              / 10 ({question.count} ratings)
                            </Typography>
                          </Box>
                          <Box sx={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={formatDistributionData(question.distribution)}
                                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="value" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" name="Count" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          )}

          {/* Distribution Tab */}
          {currentTab === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Overall Rating Distribution
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Distribution Chart
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={formatDistributionData(
                                Object.values(stats.questions)
                                  .filter(q => q.type === 'rating')
                                  .reduce((acc, q) => {
                                    Object.entries(q.distribution).forEach(([value, count]) => {
                                      acc[value] = (acc[value] || 0) + count;
                                    });
                                    return acc;
                                  }, {})
                              )}
                              dataKey="count"
                              nameKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({value, percent}) => `${value} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {
                                formatDistributionData(
                                  Object.values(stats.questions)
                                    .filter(q => q.type === 'rating')
                                    .reduce((acc, q) => {
                                      Object.entries(q.distribution).forEach(([value, count]) => {
                                        acc[value] = (acc[value] || 0) + count;
                                      });
                                      return acc;
                                    }, {})
                                ).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))
                              }
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Rating Breakdown
                      </Typography>
                      <List>
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(value => {
                          const totalCount = Object.values(stats.questions)
                            .filter(q => q.type === 'rating')
                            .reduce((acc, q) => acc + (q.distribution[value] || 0), 0);
                          
                          const totalRatings = Object.values(stats.questions)
                            .filter(q => q.type === 'rating')
                            .reduce((acc, q) => acc + q.count, 0);
                          
                          const percentage = totalRatings > 0 ? (totalCount / totalRatings) * 100 : 0;
                          
                          return (
                            <ListItem key={value}>
                              <ListItemText 
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body1" sx={{ width: 30 }}>
                                      {value}
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={percentage} 
                                      sx={{ 
                                        flexGrow: 1, 
                                        mx: 2, 
                                        height: 10, 
                                        borderRadius: 5 
                                      }} 
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      {totalCount} ({percentage.toFixed(1)}%)
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Text Responses Tab */}
          {currentTab === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Text Responses
              </Typography>
              {stats.textResponses.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No text responses available
                </Typography>
              ) : (
                <List>
                  {stats.textResponses.map((response, index) => (
                    <ListItem 
                      key={index}
                      sx={{ 
                        mb: 1, 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2">
                              {response.question}
                            </Typography>
                            <Chip 
                              size="small"
                              label={response.periodTitle}
                              variant="outlined"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography 
                            variant="body1" 
                            color="text.primary" 
                            sx={{ 
                              mt: 1, 
                              p: 1, 
                              backgroundColor: 'action.hover', 
                              borderRadius: 1 
                            }}
                          >
                            "{response.response}"
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default RatingStatsViewer;
