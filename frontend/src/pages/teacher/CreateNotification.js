import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Alert,
  FormHelperText,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { createNotification, reset } from '../../features/notifications/notificationSlice';

const CreateNotification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.notifications);
  
  const [studentsToSelect, setStudentsToSelect] = useState([]);
  const [formData, setFormData] = useState({
    recipient: '',
    title: '',
    message: '',
    sendToAll: false,
  });
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Dummy students data - in a real app, you would fetch this from the API
    setStudentsToSelect([
      { _id: '1', name: 'John Doe' },
      { _id: '2', name: 'Jane Smith' },
      { _id: '3', name: 'Michael Johnson' },
      { _id: '4', name: 'Emily Williams' },
      { _id: '5', name: 'Robert Brown' },
    ]);
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (isSuccess) {
      toast.success('Notification sent successfully');
      navigate('/app/teacher/notifications');
    }
  }, [isError, isSuccess, message, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the error for this field when it's modified
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: checked,
      // If sending to all students, clear the recipient field
      ...(name === 'sendToAll' && checked ? { recipient: '' } : {}),
    });
    
    // Clear any errors related to recipient when switching to sendToAll
    if (name === 'sendToAll' && checked && formErrors.recipient) {
      setFormErrors({
        ...formErrors,
        recipient: '',
      });
    }
  };
  
  const validate = () => {
    const errors = {};
    
    if (!formData.sendToAll && !formData.recipient) {
      errors.recipient = 'Please select a recipient or choose to send to all students';
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Please enter a title';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Please enter a message';
    } else if (formData.message.length > 1000) {
      errors.message = 'Message must be less than 1000 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      const notificationData = {
        sender: user._id,
        recipient: formData.sendToAll ? null : formData.recipient,
        title: formData.title,
        message: formData.message,
        sendToAll: formData.sendToAll,
      };
      
      dispatch(createNotification(notificationData));
    }
  };
  
  const handleBack = () => {
    navigate('/teacher/notifications');
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Notifications
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <NotificationsIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Create New Notification
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sendToAll}
                    onChange={handleSwitchChange}
                    name="sendToAll"
                    color="primary"
                  />
                }
                label="Send to all students"
              />
            </Grid>
            
            {!formData.sendToAll && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.recipient}>
                  <InputLabel id="recipient-label">Recipient *</InputLabel>
                  <Select
                    labelId="recipient-label"
                    id="recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                    label="Recipient *"
                    disabled={formData.sendToAll}
                  >
                    <MenuItem value="">
                      <em>Select a student</em>
                    </MenuItem>
                    {studentsToSelect.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.recipient && (
                    <FormHelperText>{formErrors.recipient}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!formErrors.title}
                helperText={formErrors.title || 'Enter a descriptive title for your notification'}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message *"
                name="message"
                value={formData.message}
                onChange={handleChange}
                multiline
                rows={6}
                error={!!formErrors.message}
                helperText={
                  formErrors.message || 
                  `${formData.message.length}/1000 characters. Enter your notification message.`
                }
                inputProps={{ maxLength: 1000 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isLoading}
                sx={{ py: 1.5, px: 4 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Send Notification'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateNotification;
