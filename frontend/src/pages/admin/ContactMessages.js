import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
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

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('You do not have permission to access this page.');
      setLoading(false);
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

      const response = await axios.get('/api/contact', config);
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

      await axios.put(`/api/contact/${id}`, { read: !currentReadStatus }, config);
      
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
  const updateMessageStatus = async (id, status) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.put(`/api/contact/${id}`, { status }, config);
      
      // Update local state
      setMessages(
        messages.map((msg) =>
          msg._id === id ? { ...msg, status } : msg
        )
      );
    } catch (err) {
      console.error('Error updating message status:', err);
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
      // In a real app, you'd send the reply via email or create a notification
      // For now, just mark the message as replied
      await updateMessageStatus(selectedMessage._id, 'replied');
      
      // Close dialog
      handleCloseReply();
    } catch (err) {
      console.error('Error sending reply:', err);
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
    <Container>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h5" component="h1" fontWeight="bold">
              Contact Messages
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and respond to user feedback and support requests
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchMessages}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Box>

      {messages.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No contact messages yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            When users send messages, they will appear here
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {messages.map((message) => (
            <Grid item xs={12} key={message._id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderLeft: message.read ? '4px solid transparent' : '4px solid #f44336',
                  bgcolor: message.read ? 'transparent' : 'rgba(244, 67, 54, 0.05)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6">{message.subject}</Typography>
                      <Chip 
                        label={message.status} 
                        size="small" 
                        color={getStatusColor(message.status)}
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {message.createdAt ? format(new Date(message.createdAt), 'PPpp') : 'Date unknown'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    From: <strong>{message.userName}</strong> ({message.userRole}) - {message.userEmail}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      bgcolor: 'background.paper', 
                      p: 2, 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {message.message}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<MarkReadIcon />}
                    onClick={() => handleToggleRead(message._id, message.read)}
                  >
                    Mark as {message.read ? 'Unread' : 'Read'}
                  </Button>
                  
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<ReplyIcon />}
                    onClick={() => handleOpenReply(message)}
                    disabled={message.status === 'replied'}
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
    </Container>
  );
};

export default ContactMessages;
