import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Email as EmailIcon,
  Send as SendIcon,
  MarkEmailRead as MarkReadIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config/appConfig';

const AdminMessagesList = ({ messages, user, onMessagesChanged }) => {
  const [replyText, setReplyText] = useState({});
  const [replying, setReplying] = useState({});
  const [expandedPanel, setExpandedPanel] = useState(null);

  if (!messages || messages.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No messages available.
        </Typography>
      </Box>
    );
  }

  const handleReplyChange = (id, text) => {
    setReplyText({
      ...replyText,
      [id]: text
    });
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'primary';
      case 'in-progress':
        return 'warning';
      case 'replied':
        return 'success';
      case 'closed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'in-progress':
        return 'In Progress';
      case 'replied':
        return 'Replied';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const handleStatusChange = async (messageId, newStatus) => {
    if (!user || !user.token) return;

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };

      await axios.put(`${API_URL}/api/contact/${messageId}`, { status: newStatus }, config);

      toast.success(`Message status updated to ${getStatusLabel(newStatus)}`);
      
      if (onMessagesChanged) {
        onMessagesChanged();
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    if (!user || !user.token) return;

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };

      await axios.put(`${API_URL}/api/contact/${messageId}`, { read: true }, config);

      toast.success('Message marked as read');
      
      if (onMessagesChanged) {
        onMessagesChanged();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  const handleSendReply = async (messageId) => {
    if (!user || !user.token) return;
    
    const reply = replyText[messageId];
    
    if (!reply || reply.trim() === '') {
      toast.error('Please enter a reply message');
      return;
    }
    
    setReplying({
      ...replying,
      [messageId]: true
    });

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };

      await axios.put(
        `${API_URL}/api/contact/${messageId}`, 
        { 
          adminReply: reply,
          status: 'replied'
        }, 
        config
      );

      toast.success('Reply sent successfully');
      
      // Clear reply text
      setReplyText({
        ...replyText,
        [messageId]: ''
      });
      
      if (onMessagesChanged) {
        onMessagesChanged();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setReplying({
        ...replying,
        [messageId]: false
      });
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {messages.map((message) => (
        <Accordion 
          key={message._id} 
          sx={{ 
            mb: 2,
            border: message.read ? 'none' : '1px solid',
            borderColor: 'primary.main'
          }}
          expanded={expandedPanel === message._id}
          onChange={handleAccordionChange(message._id)}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`message-${message._id}-content`}
            id={`message-${message._id}-header`}
          >
            <Grid container alignItems="center" spacing={1}>
              <Grid item>
                {message.isBugReport ? (
                  <BugReportIcon color="error" />
                ) : (
                  <EmailIcon color="primary" />
                )}
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1">{message.subject}</Typography>
                <Typography variant="caption" color="text.secondary">
                  From: {message.userName} ({message.userEmail}) • {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </Typography>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {!message.read && (
                    <Tooltip title="Mark as read">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(message._id);
                        }}
                      >
                        <MarkReadIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Chip 
                    label={getStatusLabel(message.status)} 
                    color={getStatusColor(message.status)} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {message.userName} ({message.userRole})
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      School ID: {message.schoolId}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                {message.message}
              </Typography>
              
              {message.adminReply && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="subtitle2">
                      Admin Response:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                      {message.adminReply}
                    </Typography>
                    {message.adminReplyDate && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Replied {formatDistanceToNow(new Date(message.adminReplyDate), { addSuffix: true })}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" variant="outlined">
                      <InputLabel id={`status-label-${message._id}`}>Status</InputLabel>
                      <Select
                        labelId={`status-label-${message._id}`}
                        value={message.status}
                        onChange={(e) => handleStatusChange(message._id, e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="new">New</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="replied">Replied</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Reply to user"
                    multiline
                    rows={4}
                    variant="outlined"
                    value={replyText[message._id] || ''}
                    onChange={(e) => handleReplyChange(message._id, e.target.value)}
                    placeholder="Enter your reply here..."
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={() => handleSendReply(message._id)}
                      disabled={replying[message._id] || !replyText[message._id]}
                    >
                      {replying[message._id] ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default AdminMessagesList;
