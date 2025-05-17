import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// Material UI imports
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

// TenantDetail component to allow school owners to manage their tenant
const TenantDetail = () => {
  const { user } = useSelector(state => state.auth);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSchools: 0
  });
  
  // Form state for editing tenant details
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });
  
  // Fetch tenant details on component mount
  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        setLoading(true);
        
        if (!user || !user.tenantId) {
          setError('No tenant information available');
          setLoading(false);
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/tenants/${user.tenantId}`, config);
        setTenant(response.data);
        
        // Initialize form data with tenant details
        setFormData({
          name: response.data.name || '',
          contactEmail: response.data.contactEmail || '',
          contactPhone: response.data.contactPhone || '',
          address: response.data.address || ''
        });
        
        // Also fetch statistics
        if (user.role === 'school_owner' || user.role === 'admin') {
          const statsResponse = await axios.get(`${API_URL}/tenants/${user.tenantId}/stats`, config);
          setStats(statsResponse.data);
        }
        
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching tenant details');
        console.error('Error fetching tenant details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if user is school owner or admin
    if (user && (user.role === 'school_owner' || user.role === 'admin')) {
      fetchTenantDetails();
    } else {
      setError('Unauthorized: Only school owners and admins can access this page');
      setLoading(false);
    }
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle form submission to update tenant
  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.put(`${API_URL}/tenants/${user.tenantId}`, formData, config);
      
      // Update local tenant state
      setTenant({ ...tenant, ...formData });
      setEditing(false);
      
      // Show success message
      alert('Tenant details updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating tenant');
      console.error('Error updating tenant:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Not authorized if not school owner or admin
  if (user && !(user.role === 'school_owner' || user.role === 'admin')) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          You are not authorized to access this page. Only school owners and admins can manage tenant details.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          School Tenant Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View and manage your school tenant settings.
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : tenant ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">
                  School Information
                </Typography>
                {!editing && (
                  <Button 
                    variant="contained" 
                    color="secondary"
                    startIcon={<EditIcon />}
                    onClick={() => setEditing(true)}
                    disabled={user.role !== 'school_owner'}
                  >
                    Edit Details
                  </Button>
                )}
              </Box>
              <Box sx={{ p: 3 }}>
                {editing ? (
                  <Box component="form" onSubmit={handleUpdateTenant} noValidate>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="School Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Contact Email"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      label="Contact Phone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button 
                        variant="outlined" 
                        onClick={() => setEditing(false)} 
                        sx={{ mr: 1 }}
                        startIcon={<CancelIcon />}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        type="submit" 
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><SchoolIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="School Name" secondary={tenant.name} />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="Contact Email" secondary={tenant.contactEmail} />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="Contact Phone" secondary={tenant.contactPhone || 'Not provided'} />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemIcon><LocationOnIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="Address" secondary={tenant.address || 'Not provided'} />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Status" 
                        secondary={
                          <Chip 
                            label={tenant.status}
                            color={tenant.status === 'active' ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        } 
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText primary="Database" secondary={tenant.databaseName} />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText primary="Created On" secondary={new Date(tenant.createdAt).toLocaleDateString()} />
                    </ListItem>
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">Tenant Statistics</Typography>
              </Box>
              <Box sx={{ p: 0 }}>
                <List>
                  <ListItem>
                    <ListItemText primary="Total Users" secondary={stats.totalUsers} />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemText primary="Students" secondary={stats.totalStudents} />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemText primary="Teachers" secondary={stats.totalTeachers} />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemText primary="Schools" secondary={stats.totalSchools || 1} />
                  </ListItem>
                </List>
              </Box>
            </Paper>
            
            <Paper elevation={3} sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">Account Information</Typography>
              </Box>
              <Box sx={{ p: 0 }}>
                <List>
                  <ListItem>
                    <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Owner" secondary={tenant.ownerName || user.name} />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Email" secondary={tenant.ownerEmail || user.email} />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemText primary="Role" secondary={<Chip label={user.role} size="small" color="primary" />} />
                  </ListItem>
                </List>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="warning">
          No tenant information available. Please contact the system administrator.
        </Alert>
      )}
    </Container>
  );
};

export default TenantDetail;
