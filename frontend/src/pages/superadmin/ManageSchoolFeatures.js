import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import {
  Box, Card, CardContent, Typography, Grid, FormControlLabel,
  Switch, Button, Alert, CircularProgress, Paper, Divider
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarRateIcon from '@mui/icons-material/StarRate';
import { toast } from 'react-toastify';

const ManageSchoolFeatures = () => {
  const navigate = useNavigate();
  // Get auth state from Redux store
  const { user, token } = useSelector((state) => state.auth);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch schools on component mount
  useEffect(() => {
    // Only super admins should access this page
    if (user?.role !== 'superadmin') {
      navigate('/app/dashboard');
      return;
    }

    fetchSchools();
  }, [user, navigate]);

  // Fetch schools and their feature toggles
  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError('');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Get all schools
      const schoolsResponse = await axios.get(`${API_URL}/api/schools`, config);
      
      // Get feature toggles for each school
      const schoolsWithFeatures = await Promise.all(
        schoolsResponse.data.map(async (school) => {
          try {
            // Get school permissions (feature toggles)
            const permissionsResponse = await axios.get(
              `${API_URL}/api/schools/${school._id}/permissions`,
              config
            );
            
            return {
              ...school,
              features: permissionsResponse.data?.features || {
                enableCalendar: false,
                enableRatingSystem: false
              }
            };
          } catch (error) {
            console.error(`Error fetching features for school ${school._id}:`, error);
            return {
              ...school,
              features: {
                enableCalendar: false,
                enableRatingSystem: false
              }
            };
          }
        })
      );

      setSchools(schoolsWithFeatures);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setError('Failed to load schools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle change for a specific feature
  const handleToggleFeature = (schoolId, feature, checked) => {
    setSchools(schools.map(school => {
      if (school._id === schoolId) {
        return {
          ...school,
          features: {
            ...school.features,
            [feature]: checked
          }
        };
      }
      return school;
    }));
  };

  // Save feature toggles for a school
  const saveFeatures = async (schoolId) => {
    try {
      setSaving(true);
      const school = schools.find(s => s._id === schoolId);
      
      if (!school) {
        throw new Error('School not found');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      await axios.put(
        `${API_URL}/api/schools/${schoolId}/permissions`,
        { features: school.features },
        config
      );

      toast.success(`Features updated for ${school.name}`);
    } catch (error) {
      console.error('Error saving features:', error);
      toast.error('Failed to save feature settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          color="primary"
          sx={{ mt: 2 }}
          onClick={fetchSchools}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage School Features
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Toggle features on or off for each school. Changes will apply immediately for all users of that school.
      </Typography>

      {schools.length === 0 ? (
        <Alert severity="info">No schools found. Create a school first to manage its features.</Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {schools.map((school) => (
            <Grid item xs={12} sm={6} md={4} key={school._id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" noWrap>
                      {school.name}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Feature Toggles
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={school.features?.enableCalendar === true}
                            onChange={(e) => handleToggleFeature(school._id, 'enableCalendar', e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarMonthIcon sx={{ mr: 1, fontSize: '1rem' }} />
                            <Typography variant="body2">Calendar</Typography>
                          </Box>
                        }
                      />
                    </Box>
                    
                    <Box sx={{ mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={school.features?.enableRatingSystem === true}
                            onChange={(e) => handleToggleFeature(school._id, 'enableRatingSystem', e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StarRateIcon sx={{ mr: 1, fontSize: '1rem' }} />
                            <Typography variant="body2">Rating System</Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Paper>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => saveFeatures(school._id)}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ManageSchoolFeatures;
