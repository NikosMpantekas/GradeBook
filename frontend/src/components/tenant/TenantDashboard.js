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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Grid
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Tenant Dashboard Component - Only accessible to superadmin users
const TenantDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Form state for creating a new tenant
  const [newTenant, setNewTenant] = useState({
    name: '',
    databaseName: '',
    contactEmail: '',
    contactPhone: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    status: 'active'
  });
  
  // Get all tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/tenants`, config);
        setTenants(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching tenants');
        console.error('Error fetching tenants:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if user is superadmin
    if (user && user.role === 'superadmin') {
      fetchTenants();
    } else {
      setError('Unauthorized: Only superadmins can access this page');
    }
  }, [user, refreshTrigger]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTenant({ ...newTenant, [name]: value });
  };
  
  // Handle tenant creation
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/tenants`, newTenant, config);
      
      // Reset form and close modal
      setNewTenant({
        name: '',
        databaseName: '',
        contactEmail: '',
        contactPhone: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        status: 'active'
      });
      
      setShowAddModal(false);
      
      // Refresh the tenant list
      setRefreshTrigger(prev => prev + 1);
      
      alert('Tenant created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating tenant');
      console.error('Error creating tenant:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tenant status toggle
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.put(`${API_URL}/tenants/${id}`, { status: newStatus }, config);
      
      // Update local state
      setTenants(prevTenants => 
        prevTenants.map(tenant => 
          tenant._id === id ? { ...tenant, status: newStatus } : tenant
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating tenant status');
      console.error('Error updating tenant status:', err);
    }
  };
  
  // Handle tenant deletion (only disabled tenants can be deleted)
  const handleDeleteTenant = async (id) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        await axios.delete(`${API_URL}/tenants/${id}`, config);
        
        // Remove from local state
        setTenants(prevTenants => prevTenants.filter(tenant => tenant._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting tenant');
        console.error('Error deleting tenant:', err);
      }
    }
  };
  
  // Not authorized if not superadmin
  if (user && user.role !== 'superadmin') {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          You are not authorized to access this page. Only superadmins can manage tenants.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tenant Management Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage school owner accounts and their tenant databases.
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">
            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            School Tenants
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<AddIcon />}
            onClick={() => setShowAddModal(true)}
          >
            Add New School
          </Button>
        </Box>
        <Box sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : tenants.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No tenants found. Create your first tenant by clicking "Add New School".
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>School Name</TableCell>
                    <TableCell>Owner Name</TableCell>
                    <TableCell>Owner Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.map(tenant => (
                    <TableRow key={tenant._id}>
                      <TableCell>{tenant.name}</TableCell>
                      <TableCell>{tenant.ownerName}</TableCell>
                      <TableCell>{tenant.ownerEmail}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={tenant.status === 'active' ? <CheckCircleIcon /> : <BlockIcon />}
                          label={tenant.status}
                          color={tenant.status === 'active' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          color={tenant.status === 'active' ? 'warning' : 'success'}
                          onClick={() => handleToggleStatus(tenant._id, tenant.status)}
                          sx={{ mr: 1 }}
                        >
                          {tenant.status === 'active' ? 'Disable' : 'Activate'}
                        </Button>
                        
                        {tenant.status === 'disabled' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteTenant(tenant._id)}
                          >
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
      
      {/* Dialog for adding a new tenant */}
      <Dialog 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" alignItems="center">
            <SchoolIcon sx={{ mr: 1 }} />
            Add New School Tenant
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleCreateTenant} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="School Name"
              name="name"
              value={newTenant.name}
              onChange={handleInputChange}
              placeholder="Enter school name"
              helperText="This will be used as the tenant name."
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Database Name"
              name="databaseName"
              value={newTenant.databaseName}
              onChange={handleInputChange}
              placeholder="school_name_db"
              helperText="A unique identifier for this tenant's database (no spaces or special characters)."
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contact Email"
              name="contactEmail"
              value={newTenant.contactEmail}
              onChange={handleInputChange}
              placeholder="contact@school.com"
              helperText="Primary contact email for the school."
            />
            
            <TextField
              margin="normal"
              fullWidth
              label="Contact Phone"
              name="contactPhone"
              value={newTenant.contactPhone}
              onChange={handleInputChange}
              placeholder="+1 (123) 456-7890"
              helperText="Optional contact phone number."
            />
            
            <Divider sx={{ mt: 3, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              School Owner Account
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Owner Name"
              name="ownerName"
              value={newTenant.ownerName}
              onChange={handleInputChange}
              placeholder="Enter owner's full name"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Owner Email"
              name="ownerEmail"
              type="email"
              value={newTenant.ownerEmail}
              onChange={handleInputChange}
              placeholder="Enter owner's email"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Owner Password"
              name="ownerPassword"
              type="password"
              value={newTenant.ownerPassword}
              onChange={handleInputChange}
              placeholder="Create a strong password"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="tenant-status-label">Status</InputLabel>
              <Select
                labelId="tenant-status-label"
                name="status"
                value={newTenant.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="disabled">Disabled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAddModal(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCreateTenant} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create Tenant
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TenantDashboard;
