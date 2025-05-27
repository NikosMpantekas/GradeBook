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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Help as HelpIcon,
  BarChart as StatsIcon
} from '@mui/icons-material';
// Note: If the project uses an older version of MUI, we'll use TextField for dates
// and format them manually with date-fns instead of using DateTimePicker
import { toast } from 'react-toastify';
import { format, isAfter, parseISO } from 'date-fns';

// Redux actions
import { 
  getRatingPeriods, 
  createRatingPeriod, 
  updateRatingPeriod, 
  deleteRatingPeriod,
  getRatingQuestions,
  createRatingQuestion,
  updateRatingQuestion,
  deleteRatingQuestion,
  reset as resetRatings
} from '../../features/ratings/ratingSlice';
import { getSchools } from '../../features/schools/schoolSlice';
import { getDirections } from '../../features/directions/directionSlice';

// Components
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';
import RatingStatsViewer from '../../components/ratings/RatingStatsViewer';

const RatingManager = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { periods, questions, isLoading, isError, message } = useSelector(state => state.ratings);
  const { schools } = useSelector(state => state.schools);
  const { directions } = useSelector(state => state.directions);

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsTarget, setStatsTarget] = useState(null);
  
  // Form state
  const [periodForm, setPeriodForm] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days
    targetType: 'both',
    isActive: false,
    schools: [],
    directions: []
  });

  const [questionForm, setQuestionForm] = useState({
    text: '',
    questionType: 'rating',
    targetType: 'both',
    order: 0,
    ratingPeriod: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    dispatch(getRatingPeriods());
    dispatch(getSchools());
    dispatch(getDirections());

    return () => {
      dispatch(resetRatings());
    };
  }, [dispatch]);

  // Load questions when a period is selected
  useEffect(() => {
    if (selectedPeriod) {
      dispatch(getRatingQuestions(selectedPeriod._id));
    }
  }, [selectedPeriod, dispatch]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Reset period form function - moved outside handleOpenPeriodDialog for cleaner code
  const resetPeriodForm = () => {
    // Create a safe date with error handling
    const today = new Date();
    const nextWeek = new Date();
    try {
      nextWeek.setDate(today.getDate() + 7);
    } catch (error) {
      console.error('Error setting end date:', error);
      // Fallback to today + 1 day if there's an error
      nextWeek.setDate(today.getDate() + 1);
    }

    setPeriodForm({
      title: '',
      description: '',
      startDate: today,
      endDate: nextWeek,
      targetType: 'both',
      isActive: false,
      schools: [],
      directions: []
    });
  };

  // Open period dialog for creating/editing
  const handleOpenPeriodDialog = (period = null) => {
    if (period) {
      // Edit mode - populate form
      setPeriodForm({
        id: period._id,
        title: period.title,
        description: period.description,
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate),
        targetType: period.targetType,
        isActive: period.isActive,
        schools: period.schools?.map(s => typeof s === 'object' ? s._id : s) || [],
        directions: period.directions?.map(d => typeof d === 'object' ? d._id : d) || []
      });
    } else {
      // Create mode - reset form
      resetPeriodForm();
    }
    setPeriodDialogOpen(true);
  };

  // Open question dialog for creating/editing
  const handleOpenQuestionDialog = (question = null) => {
    if (!selectedPeriod) {
      toast.error('Please select a rating period first');
      return;
    }

    if (question) {
      // Edit mode - populate form with question data
      setQuestionForm({
        text: question.text,
        questionType: question.questionType,
        targetType: question.targetType,
        order: question.order || 0,
        ratingPeriod: question.ratingPeriod
      });
    } else {
      // Create mode - reset form with current period ID
      setQuestionForm({
        text: '',
        questionType: 'rating',
        targetType: 'both',
        order: questions.length, // Default to next order
        ratingPeriod: selectedPeriod._id
      });
    }
    setQuestionDialogOpen(true);
  };

  // Handle period form change
  const handlePeriodFormChange = (e) => {
    const { name, value, checked } = e.target;
    setPeriodForm(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setPeriodForm(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // Handle question form change
  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setQuestionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit period form
  const handlePeriodSubmit = () => {
    // Validation
    if (!periodForm.title) {
      toast.error('Please enter a title');
      return;
    }

    if (isAfter(periodForm.startDate, periodForm.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    if (selectedPeriod) {
      // Update existing period
      dispatch(updateRatingPeriod({
        id: selectedPeriod._id,
        periodData: periodForm
      }));
    } else {
      // Create new period
      dispatch(createRatingPeriod(periodForm));
    }

    setPeriodDialogOpen(false);
  };

  // Submit question form
  const handleQuestionSubmit = () => {
    // Validation
    if (!questionForm.text) {
      toast.error('Please enter question text');
      return;
    }

    if (selectedPeriod) {
      dispatch(createRatingQuestion(questionForm))
        .then((result) => {
          console.log('Question created, reloading questions', result);
          // After creating a question, reload the questions for this period
          dispatch(getRatingQuestions(selectedPeriod._id));
        })
        .catch(error => {
          console.error('Error creating question:', error);
        });
    }

    setQuestionDialogOpen(false);
  };

  // Handle period selection
  const handleSelectPeriod = (period) => {
    setSelectedPeriod(period);
  };

  // Handle period deletion
  const handleDeletePeriod = (id) => {
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };

  // Confirm period deletion
  const confirmDeletePeriod = () => {
    dispatch(deleteRatingPeriod(deleteItemId));
    setDeleteDialogOpen(false);
    setDeleteItemId(null);
    if (selectedPeriod && selectedPeriod._id === deleteItemId) {
      setSelectedPeriod(null);
    }
  };

  // Handle question deletion
  const handleDeleteQuestion = (id) => {
    setDeleteItemId(id);
    setDeleteQuestionDialogOpen(true);
  };

  // Confirm question deletion
  const confirmDeleteQuestion = () => {
    dispatch(deleteRatingQuestion(deleteItemId));
    setDeleteQuestionDialogOpen(false);
    setDeleteItemId(null);
  };

  // Toggle period active status
  const handleTogglePeriodActive = (period) => {
    dispatch(updateRatingPeriod({
      id: period._id,
      periodData: { isActive: !period.isActive }
    }));
  };

  // Show statistics dialog
  const handleShowStats = (targetType, targetId) => {
    setStatsTarget({ targetType, targetId });
    setStatsDialogOpen(true);
  };

  // Render period list
  const renderPeriodList = () => {
    if (!periods || periods.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No rating periods found
          </Typography>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => handleOpenPeriodDialog()}
          >
            Create Your First Rating Period
          </Button>
        </Box>
      );
    }

    return (
      <List>
        {periods.map(period => (
          <ListItem 
            key={period._id} 
            button 
            selected={selectedPeriod && selectedPeriod._id === period._id}
            onClick={() => handleSelectPeriod(period)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: selectedPeriod && selectedPeriod._id === period._id 
                ? 'action.selected' 
                : 'background.paper'
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {period.title}
                  </Typography>
                  <Chip 
                    size="small"
                    label={period.isActive ? 'Active' : 'Inactive'}
                    color={period.isActive ? 'success' : 'default'}
                    sx={{ ml: 2 }}
                  />
                </Box>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(period.startDate), 'MMM d, yyyy')} - {format(new Date(period.endDate), 'MMM d, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Target: {period.targetType === 'both' 
                      ? 'Teachers & Subjects' 
                      : period.targetType === 'teacher' ? 'Teachers Only' : 'Subjects Only'}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePeriodActive(period);
                }}
                color={period.isActive ? 'error' : 'success'}
                title={period.isActive ? 'Deactivate' : 'Activate'}
              >
                {period.isActive ? <StopIcon /> : <StartIcon />}
              </IconButton>
              <IconButton 
                edge="end" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPeriodDialog(period);
                }}
                color="primary"
                title="Edit"
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePeriod(period._id);
                }}
                color="error"
                title="Delete"
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    );
  };

  // Render question list - improved Google Forms style
  const renderQuestionList = () => {
    if (!selectedPeriod) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Please select a rating period to manage questions
          </Typography>
        </Box>
      );
    }

    const periodQuestions = questions.filter(q => q.ratingPeriod === selectedPeriod._id);

    if (!periodQuestions || periodQuestions.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No questions found for this rating period
          </Typography>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => handleOpenQuestionDialog()}
          >
            Add Your First Question
          </Button>
        </Box>
      );
    }

    return (
      <List>
        {periodQuestions.map((question, index) => (
          <ListItem 
            key={question._id}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%'
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 'medium',
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                {index + 1}
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">
                  {question.text}
                </Typography>
                <Box sx={{ display: 'flex', mt: 0.5 }}>
                  <Chip 
                    size="small"
                    label={question.questionType === 'rating' ? 'Rating (1-10)' : 'Text Answer'}
                    color={question.questionType === 'rating' ? 'primary' : 'secondary'}
                    sx={{ mr: 1 }}
                  />
                  {question.targetType !== 'both' && (
                    <Chip 
                      size="small"
                      label={question.targetType === 'teacher' ? 'Teachers Only' : 'Subjects Only'}
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                onClick={() => handleDeleteQuestion(question._id)}
                color="error"
                title="Delete"
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        
        {/* Google Forms style add button */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenQuestionDialog()}
            fullWidth
            sx={{ 
              borderStyle: 'dashed', 
              py: 1.5,
              borderRadius: 2,
              '&:hover': { borderStyle: 'dashed' }
            }}
          >
            Add Question
          </Button>
        </Box>
      </List>
    );
  };

  // If loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If error
  if (isError) {
    return <ErrorState message={message} />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Teacher & Subject Rating System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and manage rating periods and questions for students to rate teachers and subjects.
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3 }}
        >
          <Tab label="Rating Periods" />
          <Tab label="Questions" />
        </Tabs>

        <Divider sx={{ mb: 3 }} />

        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenPeriodDialog()}
              >
                Create Rating Period
              </Button>
            </Box>
            {renderPeriodList()}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                {selectedPeriod ? `Questions for: ${selectedPeriod.title}` : 'Select a rating period'}
              </Typography>
              {selectedPeriod && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenQuestionDialog()}
                >
                  Add Question
                </Button>
              )}
            </Box>
            {renderQuestionList()}
          </Box>
        )}
      </Paper>

      {/* Rating Period Dialog */}
      <Dialog open={periodDialogOpen} onClose={() => setPeriodDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPeriod ? 'Edit Rating Period' : 'Create Rating Period'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={periodForm.title}
                onChange={handlePeriodFormChange}
                required
                helperText="Enter a descriptive title for this rating period"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={periodForm.description}
                onChange={handlePeriodFormChange}
                multiline
                rows={3}
                helperText="Optional: Provide more details about this rating period"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="datetime-local"
                value={periodForm.startDate ? format(periodForm.startDate, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => handleDateChange('startDate', new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="datetime-local"
                value={periodForm.endDate ? format(periodForm.endDate, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => handleDateChange('endDate', new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Type</InputLabel>
                <Select
                  name="targetType"
                  value={periodForm.targetType}
                  onChange={handlePeriodFormChange}
                  label="Target Type"
                >
                  <MenuItem value="both">Both Teachers & Subjects</MenuItem>
                  <MenuItem value="teacher">Teachers Only</MenuItem>
                  <MenuItem value="subject">Subjects Only</MenuItem>
                </Select>
                <FormHelperText>
                  What should students be able to rate during this period?
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={periodForm.isActive}
                    onChange={handlePeriodFormChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Active (available for students to submit ratings)"
              />
              <FormHelperText>
                Ratings are only available to students when a period is active and within the date range
              </FormHelperText>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={schools || []}
                getOptionLabel={(option) => option.name}
                value={(schools || []).filter(s => 
                  periodForm.schools.includes(s._id)
                )}
                onChange={(e, newValue) => {
                  setPeriodForm({
                    ...periodForm,
                    schools: newValue.map(v => v._id)
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Schools"
                    placeholder="Select schools"
                    helperText="Leave empty to include all schools"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={directions || []}
                getOptionLabel={(option) => option.name}
                value={(directions || []).filter(d => 
                  periodForm.directions.includes(d._id)
                )}
                onChange={(e, newValue) => {
                  setPeriodForm({
                    ...periodForm,
                    directions: newValue.map(v => v._id)
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Directions"
                    placeholder="Select directions"
                    helperText="Leave empty to include all directions"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePeriodSubmit} variant="contained" color="primary">
            {selectedPeriod ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Rating Question
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Text"
                name="text"
                value={questionForm.text}
                onChange={handleQuestionFormChange}
                required
                helperText="Enter the question that students will answer"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  name="questionType"
                  value={questionForm.questionType}
                  onChange={handleQuestionFormChange}
                  label="Question Type"
                >
                  <MenuItem value="rating">Rating (1-10)</MenuItem>
                  <MenuItem value="text">Text Answer</MenuItem>
                </Select>
                <FormHelperText>
                  How should students answer this question?
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Type</InputLabel>
                <Select
                  name="targetType"
                  value={questionForm.targetType}
                  onChange={handleQuestionFormChange}
                  label="Target Type"
                >
                  <MenuItem value="both">Both Teachers & Subjects</MenuItem>
                  <MenuItem value="teacher">Teachers Only</MenuItem>
                  <MenuItem value="subject">Subjects Only</MenuItem>
                </Select>
                <FormHelperText>
                  Which targets should this question apply to?
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Order"
                name="order"
                type="number"
                value={questionForm.order}
                onChange={handleQuestionFormChange}
                helperText="Order in which questions will be displayed"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleQuestionSubmit} variant="contained" color="primary">
            Add Question
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Period Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Rating Period"
        content="Are you sure you want to delete this rating period? This will also delete all related questions and student ratings. This action cannot be undone."
        onConfirm={confirmDeletePeriod}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Delete Question Confirmation Dialog */}
      <ConfirmDialog
        open={deleteQuestionDialogOpen}
        title="Delete Question"
        content="Are you sure you want to delete this question? This will also delete all student responses to this question. This action cannot be undone."
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteQuestionDialogOpen(false)}
      />

      {/* Stats Dialog */}
      <Dialog 
        open={statsDialogOpen} 
        onClose={() => setStatsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Rating Statistics</DialogTitle>
        <DialogContent>
          {statsTarget && (
            <RatingStatsViewer 
              targetType={statsTarget.targetType}
              targetId={statsTarget.targetId}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RatingManager;
