import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Rating,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemButton
} from '@mui/material';
import { 
  Person as PersonIcon,
  School as SchoolIcon,
  CheckCircleOutline as SuccessIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format, isAfter, parseISO } from 'date-fns';

// Redux actions
import { 
  getActiveRatingPeriods,
  getRatingPeriod,
  getStudentRatingQuestions,
  getRatingTargets,
  submitRating,
  reset as resetRatings
} from '../../features/ratings/ratingSlice';

// Components
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const RatingSubmission = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { 
    activePeriods, 
    currentPeriod,
    questions,
    targets,
    isLoading, 
    isSuccess,
    isError, 
    message 
  } = useSelector(state => state.ratings);

  // Local state
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch active rating periods when component mounts
  useEffect(() => {
    dispatch(getActiveRatingPeriods());

    return () => {
      dispatch(resetRatings());
    };
  }, [dispatch]);

  // Load period details when a period is selected
  useEffect(() => {
    if (selectedPeriod) {
      dispatch(getRatingPeriod(selectedPeriod._id));
      dispatch(getStudentRatingQuestions(selectedPeriod._id));
      dispatch(getRatingTargets(selectedPeriod._id));
    }
  }, [selectedPeriod, dispatch]);

  // Initialize answers when questions change
  useEffect(() => {
    if (questions.length > 0 && selectedTarget) {
      // Filter questions based on target type
      const applicableQuestions = questions.filter(q => 
        q.targetType === 'both' || q.targetType === selectedTarget.type
      );

      // Initialize answers
      setAnswers(applicableQuestions.map(question => ({
        question: question._id,
        ratingValue: question.questionType === 'rating' ? 5 : null, // Default to middle value for ratings
        textAnswer: question.questionType === 'text' ? '' : null
      })));
    }
  }, [questions, selectedTarget]);

  // Reset when submission is successful
  useEffect(() => {
    if (isSuccess && submitting) {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Rating submitted successfully!');
    }
  }, [isSuccess, submitting]);

  // Show error message
  useEffect(() => {
    if (isError && submitting) {
      setSubmitting(false);
      toast.error(message);
    }
  }, [isError, message, submitting]);

  // Handle period selection
  const handleSelectPeriod = (period) => {
    setSelectedPeriod(period);
    setActiveStep(1);
    setSelectedTarget(null);
    setSubmitted(false);
  };

  // Handle target selection
  const handleSelectTarget = (target) => {
    setSelectedTarget(target);
    setActiveStep(2);
  };

  // Handle rating change
  const handleRatingChange = (questionId, value) => {
    setAnswers(prev => 
      prev.map(answer => 
        answer.question === questionId 
          ? { ...answer, ratingValue: value } 
          : answer
      )
    );
  };

  // Handle text answer change
  const handleTextChange = (questionId, value) => {
    setAnswers(prev => 
      prev.map(answer => 
        answer.question === questionId 
          ? { ...answer, textAnswer: value } 
          : answer
      )
    );
  };

  // Go back to previous step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Submit rating
  const handleSubmit = () => {
    // Validation
    const missingAnswers = answers.filter(answer => {
      const question = questions.find(q => q._id === answer.question);
      if (question.questionType === 'rating') {
        return answer.ratingValue === null;
      } else {
        return !answer.textAnswer;
      }
    });

    if (missingAnswers.length > 0) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);

    // Create submission object
    const submission = {
      ratingPeriod: selectedPeriod._id,
      targetType: selectedTarget.type,
      targetId: selectedTarget.id,
      answers,
      school: user.school || user.schools?.[0],
      direction: user.direction || user.directions?.[0]
    };

    // Submit rating
    dispatch(submitRating(submission));
  };

  // Reset and start new rating
  const handleNewRating = () => {
    setActiveStep(0);
    setSelectedPeriod(null);
    setSelectedTarget(null);
    setAnswers([]);
    setSubmitted(false);
    dispatch(getActiveRatingPeriods());
  };

  // If loading initial data
  if (isLoading && activePeriods.length === 0) {
    return <LoadingScreen />;
  }

  // If error loading initial data
  if (isError && activePeriods.length === 0) {
    return <ErrorState message={message} />;
  }

  // If no active rating periods
  if (activePeriods.length === 0 && !isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <EmptyState
          title="No Active Rating Periods"
          description="There are currently no active rating periods. Please check back later."
          icon={<TimeIcon sx={{ fontSize: 60 }} />}
        />
      </Container>
    );
  }

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Rating Period
            </Typography>
            <List sx={{ mt: 2 }}>
              {activePeriods.map(period => (
                <ListItem 
                  key={period._id}
                  disablePadding
                  sx={{ mb: 2 }}
                >
                  <ListItemButton
                    onClick={() => handleSelectPeriod(period)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={period.title}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Available until: {format(new Date(period.endDate), 'MMM d, yyyy')}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={period.targetType === 'both' 
                                ? 'Teachers & Subjects' 
                                : period.targetType === 'teacher' ? 'Teachers Only' : 'Subjects Only'}
                              sx={{ mr: 1 }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select What to Rate
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Show teachers section if applicable */}
                {(currentPeriod?.targetType === 'both' || currentPeriod?.targetType === 'teacher') && (
                  <Grid item xs={12} md={currentPeriod?.targetType === 'both' ? 6 : 12}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Teachers
                        </Typography>
                        {targets.teachers.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            You have already rated all available teachers for this period.
                          </Typography>
                        ) : (
                          <List>
                            {targets.teachers.map(teacher => (
                              <ListItem 
                                key={teacher._id}
                                disablePadding
                                sx={{ mb: 1 }}
                              >
                                <ListItemButton
                                  onClick={() => handleSelectTarget({ 
                                    type: 'teacher', 
                                    id: teacher._id,
                                    name: teacher.name
                                  })}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                  }}
                                >
                                  <ListItemAvatar>
                                    <Avatar>
                                      <PersonIcon />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={teacher.name}
                                    secondary={teacher.email}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Show subjects section if applicable */}
                {(currentPeriod?.targetType === 'both' || currentPeriod?.targetType === 'subject') && (
                  <Grid item xs={12} md={currentPeriod?.targetType === 'both' ? 6 : 12}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Subjects
                        </Typography>
                        {targets.subjects.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            You have already rated all available subjects for this period.
                          </Typography>
                        ) : (
                          <List>
                            {targets.subjects.map(subject => (
                              <ListItem 
                                key={subject._id}
                                disablePadding
                                sx={{ mb: 1 }}
                              >
                                <ListItemButton
                                  onClick={() => handleSelectTarget({ 
                                    type: 'subject', 
                                    id: subject._id,
                                    name: subject.name
                                  })}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                  }}
                                >
                                  <ListItemAvatar>
                                    <Avatar>
                                      <SchoolIcon />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={subject.name}
                                    secondary={subject.direction?.name}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Show message if no targets available */}
                {targets.teachers.length === 0 && targets.subjects.length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You have already rated all available teachers and subjects for this period.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Rate: {selectedTarget?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please provide your feedback by answering the questions below. All ratings are anonymous.
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {questions
                  .filter(question => question.targetType === 'both' || question.targetType === selectedTarget?.type)
                  .sort((a, b) => a.order - b.order)
                  .map((question, index) => {
                    const answer = answers.find(a => a.question === question._id);
                    
                    return (
                      <Card key={question._id} variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {index + 1}. {question.text}
                          </Typography>
                          
                          {question.questionType === 'rating' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Poor</Typography>
                                <Typography variant="body2" color="text.secondary">Excellent</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 1 }}>
                                <Typography variant="body1">1</Typography>
                                <Box sx={{ mx: 'auto' }}>
                                  <Rating 
                                    name={`rating-${question._id}`}
                                    value={answer?.ratingValue || 0}
                                    onChange={(event, newValue) => {
                                      handleRatingChange(question._id, newValue);
                                    }}
                                    max={10}
                                    size="large"
                                  />
                                </Box>
                                <Typography variant="body1">10</Typography>
                              </Box>
                              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                {answer?.ratingValue || 0}
                              </Typography>
                            </Box>
                          ) : (
                            <TextField
                              fullWidth
                              multiline
                              rows={4}
                              placeholder="Type your answer here..."
                              value={answer?.textAnswer || ''}
                              onChange={(e) => handleTextChange(question._id, e.target.value)}
                              sx={{ mt: 2 }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </Box>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // Render success message after submission
  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <SuccessIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Thank You for Your Feedback!
          </Typography>
          <Typography variant="body1" paragraph>
            Your rating has been submitted successfully.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleNewRating}
            sx={{ mt: 2 }}
          >
            Submit Another Rating
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Submit Ratings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Your feedback helps improve teaching quality and subject content. All ratings are anonymous.
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Select Period</StepLabel>
          </Step>
          <Step>
            <StepLabel>Select Target</StepLabel>
          </Step>
          <Step>
            <StepLabel>Submit Rating</StepLabel>
          </Step>
        </Stepper>

        <Divider sx={{ mb: 3 }} />

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          {activeStep === 2 && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading || submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit Rating'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default RatingSubmission;
