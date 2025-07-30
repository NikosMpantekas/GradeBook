import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Autocomplete
} from '@mui/material';
import {
  Send as SendIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../../config/appConfig';

const SuperAdminNotifications = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientType: 'all_admins',
    schoolId: '',
    userId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  const recipientOptions = [
    { value: 'all_admins', label: 'All Admin Accounts', icon: <AdminIcon />, description: 'Send to all school administrators' },
    { value: 'all_users', label: 'All Users', icon: <PeopleIcon />, description: 'Send to all users (admins, teachers, students)' },
    { value: 'specific_school', label: 'Specific School', icon: <SchoolIcon />, description: 'Send to all users in a particular school' },
    { value: 'specific_user', label: 'Specific User', icon: <PersonIcon />, description: 'Send to a single user' }
  ];

  // Load schools when component mounts
  useEffect(() => {
    fetchSchools();
  }, []);

  // Search users when needed
  useEffect(() => {
    if (formData.recipientType === 'specific_user' && userSearchQuery.length > 2) {
      const delayedSearch = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(delayedSearch);
    }
  }, [userSearchQuery, formData.recipientType]);

  const fetchSchools = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };

      const response = await axios.get(`${API_URL}/api/superadmin/schools`, config);
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to load schools');
    }
  };

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };

      const params = new URLSearchParams({
        query: userSearchQuery
      });

      const response = await axios.get(`${API_URL}/api/superadmin/users/search?${params}`, config);
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset dependent fields when recipient type changes
    if (name === 'recipientType') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        schoolId: '',
        userId: ''
      }));
      setSelectedUser(null);
      setUserSearchQuery('');
    }
  };

  const handleUserSelect = (event, newValue) => {
    setSelectedUser(newValue);
    setFormData({
      ...formData,
      userId: newValue ? newValue._id : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please provide both title and message');
      return;
    }

    if (formData.recipientType === 'specific_school' && !formData.schoolId) {
      toast.error('Please select a school');
      return;
    }

    if (formData.recipientType === 'specific_user' && !formData.userId) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',  
          Authorization: `Bearer ${user.token}`
        }
      };

      const response = await axios.post(`${API_URL}/api/superadmin/notifications`, formData, config);
      
      toast.success(`✅ Notification sent successfully to ${response.data.recipientCount} recipient(s)!`);
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        recipientType: 'all_admins',
        schoolId: '',
        userId: ''
      });
      setSelectedUser(null);
      setUserSearchQuery('');
      
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientInfo = () => {
    const option = recipientOptions.find(opt => opt.value === formData.recipientType);
    return option || recipientOptions[0];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            SuperAdmin Notifications
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Send targeted notifications to users across the platform with easy-to-use filters.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SendIcon sx={{ mr: 1 }} />
                Send Notification
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Recipient Type Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Recipient Type</InputLabel>
                      <Select
                        name="recipientType"
                        value={formData.recipientType}
                        onChange={handleChange}
                        label="Recipient Type"
                        disabled={loading}
                      >
                        {recipientOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {option.icon}
                              <Box sx={{ ml: 2 }}>
                                <Typography variant="body1">{option.label}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.description}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* School Selection for specific school */}
                  {formData.recipientType === 'specific_school' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Select School</InputLabel>
                        <Select
                          name="schoolId"
                          value={formData.schoolId}
                          onChange={handleChange}
                          label="Select School"
                          disabled={loading}
                        >
                          {schools.map((school) => (
                            <MenuItem key={school._id} value={school._id}>
                              <Box>
                                <Typography variant="body1">{school.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {school.emailDomain}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* User Selection for specific user */}
                  {formData.recipientType === 'specific_user' && (
                    <Grid item xs={12}>
                      <Autocomplete
                        options={users}
                        getOptionLabel={(option) => `${option.name} (${option.email})`}
                        value={selectedUser}
                        onChange={handleUserSelect}
                        onInputChange={(event, newInputValue) => {
                          setUserSearchQuery(newInputValue);
                        }}
                        loading={searchLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Search and Select User"
                            placeholder="Type name or email to search..."
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {option.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1">{option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.email} • {option.role}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        disabled={loading}
                      />
                    </Grid>
                  )}

                  {/* Notification Title */}
                  <Grid item xs={12}>
                    <TextField
                      name="title"
                      label="Notification Title"
                      fullWidth
                      value={formData.title}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      placeholder="Enter a clear, descriptive title..."
                    />
                  </Grid>

                  {/* Notification Message */}
                  <Grid item xs={12}>
                    <TextField
                      name="message"
                      label="Notification Message"
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      placeholder="Enter your message here..."
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? 'Sending...' : 'Send Notification'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Notification Preview
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Recipient Type:
                </Typography>
                <Chip 
                  icon={getRecipientInfo().icon}
                  label={getRecipientInfo().label}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {formData.schoolId && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Selected School:
                  </Typography>
                  <Typography variant="body2">
                    {schools.find(s => s._id === formData.schoolId)?.name || 'Loading...'}
                  </Typography>
                </Box>
              )}

              {selectedUser && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Selected User:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 1, width: 24, height: 24, fontSize: 12 }}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{selectedUser.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedUser.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Title:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, fontStyle: formData.title ? 'normal' : 'italic' }}>
                  {formData.title || 'Enter notification title...'}
                </Typography>

                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Message:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: formData.message ? 'normal' : 'italic' }}>
                  {formData.message || 'Enter notification message...'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Quick Tips
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="All Admins"
                    secondary="Sends to all school administrators across all schools"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="All Users" 
                    secondary="Sends to every user in the system (admins, teachers, students)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Specific School"
                    secondary="Sends to all users within a selected school"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Specific User"
                    secondary="Sends to one individual user by searching their name or email"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminNotifications;
