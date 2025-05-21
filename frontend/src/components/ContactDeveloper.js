import React, { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import axios from 'axios';

const ContactDeveloper = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      setStatus({ 
        type: 'error', 
        message: 'Please fill out all fields' 
      });
      return;
    }

    try {
      setSending(true);
      setStatus(null);
      
      // Get token from storage for authentication
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      
      if (!user || !user.token) {
        throw new Error('You must be logged in to send a message');
      }
      
      // Create the request configuration with the auth token
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Send the message to the backend API
      const response = await axios.post('/api/contact', formData, config);
      
      console.log('Contact form submission response:', response.data);

      setStatus({
        type: 'success',
        message: response.data.message || 'Your message has been sent. We will respond as soon as possible.'
      });

      // Reset form after successful submission
      setFormData({ subject: '', message: '' });
      
      // Close the dialog after 3 seconds on success
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send message. Please try again.'
      });
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={!sending ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Contact Developer</Typography>
          {!sending && (
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <DialogContentText gutterBottom>
            Having trouble or want to suggest a new feature? Send us a message and we'll respond as soon as possible.
          </DialogContentText>

          {status && (
            <Alert 
              severity={status.type} 
              sx={{ mb: 2 }}
              onClose={() => setStatus(null)}
            >
              {status.message}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="subject"
                label="Subject"
                fullWidth
                variant="outlined"
                value={formData.subject}
                onChange={handleChange}
                disabled={sending}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="message"
                label="Message"
                fullWidth
                multiline
                rows={5}
                variant="outlined"
                value={formData.message}
                onChange={handleChange}
                disabled={sending}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {!sending && (
            <Button 
              onClick={onClose} 
              color="inherit"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit"
            variant="contained" 
            color="primary"
            disabled={sending}
            startIcon={<SendIcon />}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContactDeveloper;
