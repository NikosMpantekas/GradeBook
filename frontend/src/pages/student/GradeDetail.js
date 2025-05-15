import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { getGrade, reset } from '../../features/grades/gradeSlice';

const GradeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { grade, isLoading, isError, message } = useSelector((state) => state.grades);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(getGrade(id));
    }

    return () => {
      dispatch(reset());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
      navigate('/app/grades');
    }
  }, [isError, message, navigate]);

  const handleBack = () => {
    navigate('/app/grades');
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'PPP');
  };

  // Get grade status and color
  const getGradeStatus = () => {
    if (!grade) return { status: 'Unknown', color: 'grey' };

    if (grade.value >= 90) return { status: 'Excellent', color: '#388e3c' };
    if (grade.value >= 80) return { status: 'Very Good', color: '#2e7d32' };
    if (grade.value >= 70) return { status: 'Good', color: '#43a047' };
    if (grade.value >= 60) return { status: 'Satisfactory', color: '#ffb74d' };
    if (grade.value >= 50) return { status: 'Pass', color: '#ff9800' };
    return { status: 'Fail', color: '#e53935' };
  };

  if (isLoading || !grade) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const gradeStatus = getGradeStatus();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Grades
      </Button>

      <Grid container spacing={3}>
        {/* Grade Summary Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                {grade.subject?.name || 'Subject'}
              </Typography>
              
              <Box 
                sx={{ 
                  width: 150, 
                  height: 150, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: `conic-gradient(${gradeStatus.color} ${grade.value}%, #e0e0e0 0)`,
                  mb: 3,
                  position: 'relative',
                }}
              >
                <Box 
                  sx={{ 
                    width: 130, 
                    height: 130, 
                    borderRadius: '50%', 
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {grade.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    out of 100
                  </Typography>
                </Box>
              </Box>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: gradeStatus.color,
                  mb: 1,
                }}
              >
                {gradeStatus.status}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Submitted on {formatDate(grade.date)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Grade Details Card */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              Grade Details
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <SchoolIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Subject
                    </Typography>
                    <Typography variant="body1">
                      {grade.subject?.name || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Teacher
                    </Typography>
                    <Typography variant="body1">
                      {grade.teacher?.name || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <CalendarIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date Assigned
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(grade.date)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <DescriptionIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {grade.description || 'No description provided'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              Feedback
            </Typography>
            
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography variant="body1">
                {grade.description ? (
                  grade.description
                ) : (
                  'No feedback provided for this grade.'
                )}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GradeDetail;
