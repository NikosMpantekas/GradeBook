import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { green, red, orange, blue } from '@mui/material/colors';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { useSelector } from 'react-redux';

/**
 * System Maintenance Panel
 * UPDATED: Removed all previous content as requested
 * Now only contains the "Fix School Permissions" button functionality
 */
const SystemMaintenance = () => {
  const { user, token } = useSelector((state) => state.auth);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [results, setResults] = useState(null);

  // Fix school permissions - the only function in this panel
  const fixSchoolPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setResults(null);

      console.log('Starting school permissions fix...');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Call the fix school permissions endpoint
      const response = await axios.post(`${API_URL}/api/school-permissions/fix`, {}, config);

      if (response.data && response.data.success) {
        const { processed, created, errors, totalSchools } = response.data.data;
        
        setResults({
          processed,
          created,
          errors,
          totalSchools,
          message: response.data.message
        });
        
        setSuccess(response.data.message);
        console.log('School permissions fix completed successfully:', response.data.data);
        
      } else {
        setError('Failed to fix school permissions');
      }

    } catch (error) {
      console.error('Error fixing school permissions:', error);
      setError(error.response?.data?.message || 'Failed to fix school permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Maintenance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System maintenance tools for managing school permissions
        </Typography>
      </Box>

      {/* Main Content - Only Fix School Permissions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Card>
          <CardHeader
            avatar={<BuildIcon color="primary" />}
            title="Fix School Permissions"
            subheader="Scan all schools and create missing permission entries"
          />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                This tool will scan all schools in the database and create missing entries 
                in the school permissions system. All features will be set to enabled by default 
                for new entries.
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>What this does:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Scans all schools in the database" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Creates missing permission entries" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Sets all features to enabled by default" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText primary="Provides detailed feedback on the process" />
                </ListItem>
              </List>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Fix Button */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <BuildIcon />}
                onClick={fixSchoolPermissions}
                disabled={loading}
                color="primary"
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Fixing Permissions...' : 'Fix School Permissions'}
              </Button>
            </Box>

            {/* Alerts */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                <strong>Error:</strong> {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                <strong>Success:</strong> {success}
              </Alert>
            )}

            {/* Results */}
            {results && (
              <Card variant="outlined" sx={{ mt: 3 }}>
                <CardHeader
                  title="Fix Results"
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Summary:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        label={`${results.totalSchools} Total Schools`}
                        color="info"
                        variant="outlined"
                      />
                      <Chip
                        label={`${results.processed} Processed`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`${results.created} Created`}
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        label={`${results.errors?.length || 0} Errors`}
                        color={results.errors?.length > 0 ? 'error' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {results.errors && results.errors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="error.main" gutterBottom>
                        <strong>Errors encountered:</strong>
                      </Typography>
                      <List dense>
                        {results.errors.map((error, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ErrorIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={error.schoolName || error.schoolId}
                              secondary={error.error}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {results.created > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Next Steps:</strong> You can now manage individual school permissions 
                        through the SuperAdmin → School Permissions panel.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </Paper>

      {/* Footer Information */}
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          <strong>Note:</strong> This system maintenance panel now only contains the school permissions 
          fix functionality. All other maintenance tools have been removed as part of the new 
          comprehensive permission control system.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SystemMaintenance;
