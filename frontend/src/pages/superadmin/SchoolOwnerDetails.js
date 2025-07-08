import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/appConfig';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid, 
  Divider, 
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  FormControlLabel,
  FormGroup,
  Paper
} from '@mui/material';
import axios from 'axios';
import { 
  ArrowBack, 
  Check, 
  Close, 
  Delete, 
  Edit, 
  Notifications, 
  Grade, 
  Group, 
  School, 
  MenuBook, 
  Folder, 
  Assessment, 
  Event
} from '@mui/icons-material';

function SchoolOwnerDetails() {
  const [schoolOwner, setSchoolOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Only initialize the two permissions we're managing
  const [permissions, setPermissions] = useState({
    canAccessReports: true,
    canManageEvents: true
  });
  const [updatingPermissions, setUpdatingPermissions] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchSchoolOwner = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/api/superadmin/school-owners/${id}`, config);
        setSchoolOwner(response.data);
        
        // Initialize only the two permissions we want to display/manage
        if (response.data.adminPermissions) {
          // Extract only the two permissions we care about
          const { canAccessReports = true, canManageEvents = true } = response.data.adminPermissions;
          setPermissions({ canAccessReports, canManageEvents });
        }
        
        setLoading(false);
      } catch (error) {
        setError('Error fetching school owner details: ' + 
          (error.response?.data?.message || error.message));
        setLoading(false);
        toast.error('Failed to load school owner details');
      }
    };

    fetchSchoolOwner();
  }, [id, user.token]);

  const handleToggleStatus = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const response = await axios.put(
        `${API_URL}/api/superadmin/school-owners/${id}/status`,
        { active: !schoolOwner.active },
        config
      );
      
      setSchoolOwner(response.data);
      toast.success(`School owner ${response.data.active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update school owner status: ' + 
        (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.delete(`${API_URL}/api/superadmin/school-owners/${id}`, config);
      toast.success('School owner deleted successfully');
      navigate('/superadmin/dashboard');
    } catch (error) {
      toast.error('Failed to delete school owner: ' + 
        (error.response?.data?.message || error.message));
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handlePermissionChange = async (permission) => {
    try {
      setUpdatingPermissions(true);
      
      // Update local state first for immediate feedback
      const updatedPermissions = {
        ...permissions,
        [permission]: !permissions[permission]
      };
      setPermissions(updatedPermissions);
      
      // Send the update to the server
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Only send the changed permission to the API
      await axios.put(
        `${API_URL}/api/superadmin/school-owners/${id}/permissions`,
        { 
          permissions: { [permission]: updatedPermissions[permission] } 
        },
        config
      );
      
      toast.success(`Permission updated successfully`);
    } catch (error) {
      // Revert the change if the server update fails
      setPermissions(permissions);
      toast.error('Failed to update permission: ' + 
        (error.response?.data?.message || error.message));
    } finally {
      setUpdatingPermissions(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/superadmin/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!schoolOwner) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">School owner not found</Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/superadmin/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/superadmin/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>
      
      <Card sx={{ mb: 3, borderLeft: schoolOwner.active ? '5px solid #4caf50' : '5px solid #f44336' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Typography variant="h5" component="div" gutterBottom>
                {schoolOwner.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Email: {schoolOwner.email}
              </Typography>
              {schoolOwner.school && (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>School Cluster:</strong> {schoolOwner.school.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Address:</strong> {schoolOwner.school.address}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Email Domain:</strong> {schoolOwner.school.emailDomain}
                  </Typography>
                </>
              )}
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2" sx={{ 
                bgcolor: schoolOwner.active ? '#e8f5e9' : '#ffebee', 
                color: schoolOwner.active ? '#2e7d32' : '#c62828',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
                mb: 2
              }}>
                Status: {schoolOwner.active ? 'Active' : 'Inactive'}
              </Typography>
              
              <Button 
                variant="outlined" 
                color={schoolOwner.active ? "error" : "success"}
                startIcon={schoolOwner.active ? <Close /> : <Check />}
                onClick={handleToggleStatus}
                sx={{ mb: 1 }}
              >
                {schoolOwner.active ? 'Deactivate' : 'Activate'}
              </Button>
              
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteClick}
              >
                Delete
              </Button>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            <strong>Created At:</strong> {new Date(schoolOwner.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Last Updated:</strong> {new Date(schoolOwner.updatedAt).toLocaleString()}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Feature Permissions
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Enable or disable features for this school owner
          </Typography>
          
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <FormGroup>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Enable or disable features for this school owner
                  </Typography>
                </Grid>
                {/* Only showing Access Reports and Manage Events as per requirements */}
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissions.canAccessReports}
                        onChange={() => handlePermissionChange('canAccessReports')}
                        disabled={updatingPermissions}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Assessment sx={{ mr: 1, color: permissions.canAccessReports ? 'primary.main' : 'text.disabled' }} />
                        <Typography>Access Reports</Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissions.canManageEvents}
                        onChange={() => handlePermissionChange('canManageEvents')}
                        disabled={updatingPermissions}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Event sx={{ mr: 1, color: permissions.canManageEvents ? 'primary.main' : 'text.disabled' }} />
                        <Typography>Manage Events</Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </FormGroup>
          </Paper>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this school owner? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SchoolOwnerDetails;
