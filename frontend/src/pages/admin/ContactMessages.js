import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { format } from 'date-fns';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  MarkEmailRead as MarkReadIcon,
  Email as EmailIcon,
  CheckCircle as DoneIcon,
  Refresh as RefreshIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { user } = useSelector((state) => state.auth);

  // Check if user has proper permission (admin or superadmin)
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      setError('You do not have permission to access this page.');
      setLoading(false);
    } else {
      // Load messages on component mount
      fetchMessages();
    }
  }, [user]);

  // Fetch contact messages
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      console.log('[AdminContactMessages] Using API_URL for secure contact API call:', API_URL);
      const response = await axios.get(`${API_URL}/api/contact`, config);
      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching contact messages:', err);
      setError(err.response?.data?.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read/unread
  const handleToggleRead = async (id, currentReadStatus) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.put(`${API_URL}/api/contact/${id}`, { read: !currentReadStatus }, config);
      
      // Update local state
      setMessages(
        messages.map((msg) =>
          msg._id === id ? { ...msg, read: !currentReadStatus } : msg
        )
      );
    } catch (err) {
      console.error('Error updating message status:', err);
    }
  };

  // Update message status (new, read, replied)
  const updateMessageStatus = async (id, status, adminReply = null) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
      };

      // Create request body - include adminReply if provided
      const requestData = { status };
      if (adminReply !== null) {
        requestData.adminReply = adminReply;
      }

      console.log(`Updating message ${id} with:`, requestData);
      const response = await axios.put(`${API_URL}/api/contact/${id}`, requestData, config);
      
      // Update local state with ALL returned data, not just status
      setMessages(
        messages.map((msg) =>
          msg._id === id ? response.data : msg
        )
      );

      return response.data;
    } catch (err) {
      console.error('Error updating message status:', err);
      throw err; // Rethrow to allow caller to handle the error
    }
  };

  // Handle reply dialog
  const handleOpenReply = (message) => {
    setSelectedMessage(message);
    setReplyOpen(true);
    
    // Auto-populate with a template
    setReplyText(`Dear ${message.userName},\n\nThank you for your message regarding "${message.subject}".\n\n[Your response here]\n\nBest regards,\nGradeBook Administration Team`);
  };

  const handleCloseReply = () => {
    setReplyOpen(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText) return;

    try {
      // FIXED: Now sending the reply text to be saved in the database
      console.log('Sending reply:', replyText);
      await updateMessageStatus(selectedMessage._id, 'replied', replyText);
      
      // Show success message
      alert('Reply sent successfully');
      
      // Refresh messages to get the latest data
      await fetchMessages();
      
      // Close dialog
      handleCloseReply();
    } catch (err) {
      console.error('Error sending reply:', err);
      alert(`Error sending reply: ${err.message || 'Unknown error'}`);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMessages();
    }
  }, [user]);

  // Status chip color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'error';
      case 'read':
        return 'primary';
      case 'replied':
        return 'success';
      default:
        return 'default';
    }
  };

  // Loading state
  if (loading) {
    return <LoadingState message="Loading contact messages..." />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm>
            <Typography variant="h5" component="h1" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Contact Messages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              View and respond to user feedback and support requests
            </Typography>
          </Grid>
          <Grid item xs={12} sm="auto">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchMessages}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Box>

      {messages.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            No contact messages yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            When users send messages, they will appear here
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {messages.map((message) => (
            <Grid item xs={12} key={message._id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderLeft: message.read ? '4px solid transparent' : '4px solid #f44336',
                  bgcolor: message.read ? 'transparent' : 'rgba(244, 67, 54, 0.05)'
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{message.subject}</Typography>
                      <Chip 
                        label={message.status} 
                        size="small" 
                        color={getStatusColor(message.status)}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {message.createdAt ? format(new Date(message.createdAt), 'PPpp') : 'Date unknown'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    From: <strong>{message.userName}</strong> ({message.userRole}) - {message.userEmail}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      bgcolor: 'background.paper', 
                      p: { xs: 1, sm: 2 }, 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {message.message}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: { xs: 1, sm: 2 }, pt: 0, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                  <Button
                    size="small"
                    startIcon={<MarkReadIcon />}
                    onClick={() => handleToggleRead(message._id, message.read)}
                    sx={{ 
                      width: { xs: '100%', sm: 'auto' },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Mark as {message.read ? 'Unread' : 'Read'}
                  </Button>
                  
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<ReplyIcon />}
                    onClick={() => handleOpenReply(message)}
                    disabled={message.status === 'replied'}
                    sx={{ 
                      width: { xs: '100%', sm: 'auto' },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Reply
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onClose={handleCloseReply} fullWidth maxWidth="md">
        <DialogTitle>
          Reply to: {selectedMessage?.subject}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are replying to <strong>{selectedMessage?.userName}</strong> ({selectedMessage?.userEmail})
          </DialogContentText>
          <TextField
            autoFocus
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReply}>Cancel</Button>
          <Button 
            onClick={handleSendReply} 
            variant="contained" 
            color="primary"
            disabled={!replyText}
          >
            Mark as Replied
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactMessages;
