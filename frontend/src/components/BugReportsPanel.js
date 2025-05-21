import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Badge,
  CircularProgress,
  Collapse,
  IconButton,
  Alert,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon,
  Reply as ReplyIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const BugReportsPanel = ({ openContactForm }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUserMessages = async () => {
      if (!user || !user.token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        };
        
        const response = await axios.get('/api/contact/user', config);
        console.log('User messages retrieved:', response.data.length);
        
        // Sort by creation date, newest first
        const sortedMessages = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setMessages(sortedMessages);
      } catch (err) {
        console.error('Error fetching user messages:', err);
        setError('Failed to load your messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserMessages();
  }, [user]);
  
  const markReplyAsRead = async (messageId) => {
    if (!user || !user.token) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        }
      };
      
      await axios.put(`/api/contact/user/${messageId}/read`, {}, config);
      
      // Update local state to reflect the change
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, replyRead: true } 
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking reply as read:', err);
    }
  };
  
  const toggleExpanded = (messageId) => {
    if (expandedId === messageId) {
      setExpandedId(null);
    } else {
      setExpandedId(messageId);
      
      // If this message has an unread reply, mark it as read when expanded
      const message = messages.find(msg => msg._id === messageId);
      if (message && message.adminReply && !message.replyRead) {
        markReplyAsRead(messageId);
      }
    }
  };
  
  const getStatusChip = (message) => {
    if (message.status === 'replied') {
      return (
        <Badge 
          color="success" 
          variant={message.replyRead ? "standard" : "dot"}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Chip 
            label="Replied" 
            color="success" 
            size="small" 
            icon={<ReplyIcon fontSize="small" />} 
          />
        </Badge>
      );
    } else if (message.status === 'read') {
      return <Chip label="Under Review" color="primary" size="small" />;
    } else {
      return <Chip label="New" color="secondary" size="small" />;
    }
  };
  
  // Filter only bug reports to display in this panel
  const bugReports = messages.filter(msg => msg.isBugReport);
  const hasUnreadReplies = bugReports.some(msg => 
    msg.adminReply && msg.adminReply.trim() !== '' && !msg.replyRead
  );
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
      <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <BugReportIcon color="secondary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Bug Reports
            {hasUnreadReplies && (
              <Badge 
                color="error" 
                variant="dot"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <Button
          variant="outlined" 
          color="secondary" 
          size="small"
          startIcon={<EmailIcon />}
          onClick={openContactForm}
        >
          New Report
        </Button>
      </Box>
      
      {bugReports.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          You haven't submitted any bug reports yet.
        </Typography>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {bugReports.map((report, index) => (
            <React.Fragment key={report._id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => toggleExpanded(report._id)}
                    aria-label="expand"
                  >
                    {expandedId === report._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                }
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: !report.replyRead && report.adminReply ? 'rgba(0, 128, 0, 0.05)' : 'transparent'  
                }}
                onClick={() => toggleExpanded(report._id)}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        component="span"
                        variant="subtitle1"
                        color="text.primary"
                        fontWeight={500}
                      >
                        {report.subject}
                      </Typography>
                      {getStatusChip(report)}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ 
                          display: 'inline',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '80%'
                        }}
                      >
                        {report.message.length > 60 
                          ? `${report.message.substring(0, 60)}...` 
                          : report.message}
                      </Typography>
                      <Typography
                        component="div"
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Submitted {formatDistanceToNow(new Date(report.createdAt))} ago
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Collapse 
                in={expandedId === report._id} 
                timeout="auto" 
                unmountOnExit 
                sx={{ px: 2, pb: 2 }}
              >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Your report:
                </Typography>
                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {report.message}
                </Typography>
                
                {report.adminReply && (
                  <>
                    <Typography 
                      variant="subtitle2" 
                      color="success.main" 
                      gutterBottom 
                      sx={{ mt: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <ReplyIcon fontSize="small" sx={{ mr: 0.5 }} />
                      Admin response:
                      {!report.replyRead && (
                        <Chip 
                          label="New" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'rgba(0, 128, 0, 0.05)', p: 1, borderRadius: 1 }}>
                      {report.adminReply}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Replied {formatDistanceToNow(new Date(report.adminReplyDate))} ago
                    </Typography>
                  </>
                )}
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default BugReportsPanel;
