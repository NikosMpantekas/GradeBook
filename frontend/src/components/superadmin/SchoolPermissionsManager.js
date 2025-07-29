import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  FormGroup,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  School as SchoolIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { green, red, orange, blue } from '@mui/material/colors';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { useSelector } from 'react-redux';

/**
 * School Permissions Management Components
 * Comprehensive interface for superadmins to manage school feature permissions
 */
const SchoolPermissionsManager = () => {
  const { user } = useSelector((state) => state.auth);
  const token = user?.token; // Token is INSIDE the user object
  
  // DEBUG: Log auth state to troubleshoot
  console.log('🔍 [SchoolPermissionsManager] Auth state:', { user, token: token ? 'Present' : 'Missing', userRole: user?.role });
  
  // State management
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedSchools, setExpandedSchools] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [availableFeatures, setAvailableFeatures] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState({});

  // Fetch schools and their permissions
  const fetchSchoolsWithPermissions = async () => {
    try {
      console.log('🔄 [SchoolPermissions] Starting to fetch schools with permissions...');
      setLoading(true);
      setError(null);
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('📡 [SchoolPermissions] Making API request to:', `${API_URL}/api/school-permissions/all`);
      console.log('🔑 [SchoolPermissions] Using token:', token ? 'Present' : 'Missing');
      
      // Fetch all schools with permissions
      const response = await axios.get(`${API_URL}/api/school-permissions/all`, config);
      
      console.log('📋 [SchoolPermissions] API Response:', response.data);
      
      if (response.data && response.data.success) {
        // DEFENSIVE: Filter out schools with invalid data to prevent crashes
        const validSchools = (response.data.data.schools || []).filter(schoolData => {
          if (!schoolData?.school) {
            console.warn('⚠️ [SchoolPermissions] Skipping school data without school object:', schoolData);
            return false;
          }
          
          if (!schoolData.school.name || typeof schoolData.school.name !== 'string') {
            console.warn('⚠️ [SchoolPermissions] Skipping school with invalid name:', {
              schoolId: schoolData.school._id,
              name: schoolData.school.name,
              nameType: typeof schoolData.school.name
            });
            return false;
          }
          
          return true;
        });
        
        // CRITICAL FIX: Map the nested school data structure to flat structure expected by UI
        const mappedSchools = validSchools.map(schoolData => ({
          // School basic info (flattened from nested structure)
          _id: schoolData.school._id,
          name: schoolData.school.name,
          emailDomain: schoolData.school.emailDomain,
          address: schoolData.school.address,
          active: schoolData.school.active,
          
          // Permissions data
          permissions: schoolData.permissions,
          
          // Original nested data for reference
          originalData: schoolData
        }));
        
        console.log(`✅ [SchoolPermissions] Loaded ${mappedSchools.length} valid schools (filtered from ${response.data.data.schools?.length || 0} total)`);
        console.log('🔍 [SchoolPermissions] Sample mapped school:', mappedSchools[0]);
        
        setSchools(mappedSchools);
      } else {
        console.error('❌ [SchoolPermissions] API returned unsuccessful response:', response.data);
        setError('Failed to load schools - API returned unsuccessful response');
      }
      
    } catch (error) {
      console.error('💥 [SchoolPermissions] Error fetching schools:', error);
      console.error('💥 [SchoolPermissions] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      setError(error.response?.data?.message || `Failed to load schools: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('🏁 [SchoolPermissions] Finished loading schools');
    }
  };

  // Fetch available features
  const fetchAvailableFeatures = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('🔍 [SchoolPermissions] Fetching available features...');
      const response = await axios.get(`${API_URL}/api/school-permissions/features`, config);
      
      console.log('📋 [SchoolPermissions] Features API response:', response.data);
      
      if (response.data && response.data.success) {
        const features = response.data.data.features || {};
        console.log('✅ [SchoolPermissions] Available features loaded:', features);
        setAvailableFeatures(features);
      } else {
        console.warn('⚠️ [SchoolPermissions] Features API unsuccessful, using fallback');
        // Fallback feature names if API fails
        setAvailableFeatures(getDefaultFeatureNames());
      }
      
    } catch (error) {
      console.error('💥 [SchoolPermissions] Error fetching features:', error);
      // Use fallback on error
      setAvailableFeatures(getDefaultFeatureNames());
    }
  };
  
  // Fallback feature names in case API fails
  const getDefaultFeatureNames = () => ({
    enableGrades: 'Grade Management',
    enableClasses: 'Class Management', 
    enableSubjects: 'Subject Management',
    enableStudents: 'Student Management',
    enableTeachers: 'Teacher Management',
    enableNotifications: 'Notifications',
    enableContactDeveloper: 'Contact Developer',
    enableCalendar: 'Calendar',
    enableSchedule: 'Schedule',
    enableRatingSystem: 'Rating System',
    enableAnalytics: 'Analytics',
    enableUserManagement: 'User Management',
    enableSchoolSettings: 'School Settings',
    enableSystemMaintenance: 'System Maintenance',
    enableBugReports: 'Bug Reports',
    enableDirections: 'Directions',
    enablePatchNotes: 'Patch Notes',
    enableStudentProgress: 'Student Progress'
  });

  // Initial data load
  useEffect(() => {
    console.log('🔄 [SchoolPermissionsManager] useEffect triggered with:', {
      userRole: user?.role,
      hasToken: !!token,
      tokenLength: token?.length,
      userId: user?._id || user?.id
    });
    
    if (user?.role === 'superadmin' && token) {
      console.log('✅ [SchoolPermissionsManager] Conditions met, calling fetchSchoolsWithPermissions');
      fetchSchoolsWithPermissions();
      fetchAvailableFeatures();
    } else {
      console.log('❌ [SchoolPermissionsManager] Conditions not met:', {
        isSuperadmin: user?.role === 'superadmin',
        hasToken: !!token,
        actualRole: user?.role
      });
    }
  }, [user, token]);

  // Handle feature toggle
  const handleFeatureToggle = (schoolId, featureKey, newValue) => {
    console.log(`🔄 [SchoolPermissions] Toggle triggered:`, {
      schoolId,
      featureKey,
      newValue,
      schoolIdType: typeof schoolId,
      currentPendingChanges: pendingChanges
    });
    
    // DEFENSIVE: Ensure schoolId is valid
    if (!schoolId || schoolId === 'undefined') {
      console.error('🚨 [SchoolPermissions] Invalid school ID in toggle:', schoolId);
      setError('Invalid school ID - cannot update permissions');
      return;
    }
    
    setPendingChanges(prev => {
      const updated = {
        ...prev,
        [schoolId]: {
          ...prev[schoolId],
          [featureKey]: newValue
        }
      };
      
      console.log(`✅ [SchoolPermissions] Updated pending changes:`, {
        schoolId,
        featureKey,
        newValue,
        updatedState: updated
      });
      
      return updated;
    });
  };

  // Save changes for a school
  const saveSchoolPermissions = async (schoolId) => {
    try {
      setSaving(prev => ({ ...prev, [schoolId]: true }));
      setError(null);
      setSuccess(null);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const features = pendingChanges[schoolId] || {};
      
      const response = await axios.put(
        `${API_URL}/api/school-permissions/${schoolId}`,
        { features },
        config
      );

      if (response.data && response.data.success) {
        // Update the local state with the saved permissions
        setSchools(prev => 
          prev.map(school => 
            school._id === schoolId 
              ? { ...school, permissions: response.data.data.permissions }
              : school
          )
        );
        
        // Clear pending changes for this school
        setPendingChanges(prev => {
          const newPending = { ...prev };
          delete newPending[schoolId];
          return newPending;
        });
        
        setSuccess(`Permissions updated successfully for ${response.data.data.school.name}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        
      } else {
        setError('Failed to save permissions');
      }
      
    } catch (error) {
      console.error('Error saving permissions:', error);
      setError(error.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(prev => ({ ...prev, [schoolId]: false }));
    }
  };

  // Toggle school expansion
  const toggleSchoolExpansion = (schoolId) => {
    setExpandedSchools(prev => ({
      ...prev,
      [schoolId]: !prev[schoolId]
    }));
  };

  // Get current feature value (including pending changes)
  const getFeatureValue = (school, featureKey) => {
    const pendingValue = pendingChanges[school._id]?.[featureKey];
    if (pendingValue !== undefined) {
      return pendingValue;
    }
    return school.permissions?.features?.[featureKey] || false;
  };

  // Check if there are pending changes for a school
  const hasPendingChanges = (schoolId) => {
    return pendingChanges[schoolId] && Object.keys(pendingChanges[schoolId]).length > 0;
  };

  // Get feature statistics
  const getFeatureStats = (featureKey) => {
    const total = schools.length;
    const enabled = schools.filter(school => 
      getFeatureValue(school, featureKey)
    ).length;
    
    return { enabled, total, percentage: total > 0 ? (enabled / total * 100).toFixed(1) : 0 };
  };

  // Filter schools based on search term
  const filteredSchools = schools.filter(school => {
    // DEFENSIVE: Ensure school.name exists before calling toLowerCase
    const schoolName = school.name || school.school?.name || '';
    const searchLower = searchTerm.toLowerCase();
    
    return (
      schoolName.toLowerCase().includes(searchLower) ||
      school.emailDomain?.toLowerCase().includes(searchLower)
    );
  });

  // Feature categories - FIXED to use valid backend feature names from schoolPermissionsModel
  const featureCategories = {
    'Core Management': [
      'enableUserManagement', 'enableClasses'
    ],
    'Grade Management': [
      'enableGrades', 'enableAnalytics'
    ],
    'Notification Management': [
      'enableNotifications'
    ],
    'School Administration': [
      'enableSchedule', 'enableSchoolSettings'
    ],
    'Communication': [
      'enableContact'
    ]
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading school permissions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          School Permissions Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage feature permissions for all schools in the system
        </Typography>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Schools"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchSchoolsWithPermissions}
              >
                Refresh
              </Button>
              <Chip
                label={`${filteredSchools.length} Schools`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Feature Statistics */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Feature Usage Statistics
        </Typography>
        <Grid container spacing={2}>
          {Object.keys(availableFeatures).map(featureKey => {
            const stats = getFeatureStats(featureKey);
            return (
              <Grid item xs={12} sm={6} md={4} key={featureKey}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {availableFeatures[featureKey]}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Typography variant="h6">
                        {stats.enabled}/{stats.total}
                      </Typography>
                      <Chip 
                        label={`${stats.percentage}%`} 
                        size="small"
                        color={stats.percentage >= 80 ? 'success' : stats.percentage >= 50 ? 'warning' : 'error'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Schools List */}
      <Grid container spacing={3}>
        {filteredSchools.map((school) => (
          <Grid item xs={12} key={school._id}>
            <Card>
              <CardHeader
                avatar={<SchoolIcon color="primary" />}
                title={school.name}
                subheader={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {school.emailDomain} • {school.address}
                    </Typography>
                    {school.permissions && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={school.active ? 'Active' : 'Inactive'}
                          color={school.active ? 'success' : 'error'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {hasPendingChanges(school._id) && (
                          <Chip
                            label="Unsaved Changes"
                            color="warning"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                }
                action={
                  <Box>
                    {hasPendingChanges(school._id) && (
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => saveSchoolPermissions(school._id)}
                        disabled={saving[school._id]}
                        sx={{ mr: 1 }}
                      >
                        {saving[school._id] ? <CircularProgress size={20} /> : 'Save'}
                      </Button>
                    )}
                    <IconButton
                      onClick={() => toggleSchoolExpansion(school._id)}
                    >
                      {expandedSchools[school._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                }
              />
              
              <Collapse in={expandedSchools[school._id]}>
                <CardContent>
                  {school.permissions ? (
                    <Box>
                      {Object.entries(featureCategories).map(([categoryName, features]) => (
                        <Box key={categoryName} sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            {categoryName}
                          </Typography>
                          <FormGroup>
                            <Grid container spacing={2}>
                              {features.map((featureKey) => (
                                <Grid item xs={12} sm={6} md={4} key={featureKey}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={getFeatureValue(school, featureKey)}
                                        onChange={(e) => handleFeatureToggle(school._id, featureKey, e.target.checked)}
                                        color="primary"
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography variant="body2">
                                          {availableFeatures[featureKey] || featureKey}
                                        </Typography>
                                        {pendingChanges[school._id]?.[featureKey] !== undefined && (
                                          <Typography variant="caption" color="warning.main">
                                            Changed
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </FormGroup>
                          <Divider sx={{ mt: 2 }} />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="error">
                      Failed to load permissions for this school
                    </Alert>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredSchools.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No schools found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search criteria' : 'No schools are available'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SchoolPermissionsManager;
