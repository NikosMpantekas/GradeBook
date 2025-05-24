import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Alert,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Grid,
  Badge,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  BugReport as BugReportIcon,
  Message as MessageIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';

const UserContactMessages = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUserMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        
        // CRITICAL FIX: Force direct API call without caching
        const timestamp = Date.now();
        console.log(`Fetching contact messages for user ${user._id} at timestamp ${timestamp}`);
        
        // CRITICAL FIX: Make direct API call with timestamp to bypass cache
        const { data } = await axios.get(`/api/contact/user?_t=${timestamp}`, config);
        
        // DEBUG all messages to find admin replies
        data.forEach((msg, index) => {
          console.log(`Message ${index + 1} (${msg._id}):`, {
            subject: msg.subject,
            hasAdminReply: !!msg.adminReply,
            adminReplyLength: msg.adminReply?.length || 0,
            adminReplyDate: msg.adminReplyDate || 'No date',
            status: msg.status
          });
        });
        
        // Alert user about reply status
        const messagesWithReplies = data.filter(m => m.adminReply && m.adminReply.trim() !== '');
        if (messagesWithReplies.length > 0) {
          console.log(`Found ${messagesWithReplies.length} messages with admin replies`);
        } else {
          console.log('No messages with admin replies found');
        }
        
        setMessages(data);
      } catch (err) {
        console.error('Error fetching user messages:', err);
        setError(err.response?.data?.message || 'Failed to fetch your messages');
        toast.error('Failed to load your messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserMessages();
  }, [user]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    return format(new Date(date), 'PPpp');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Typography variant="h4" gutterBottom>
        My Messages & Bug Reports
      </Typography>
      
      {messages.length === 0 ? (
        <Alert severity="info">
          You haven't sent any messages or bug reports yet.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {messages.map((message) => (
            <Grid item xs={12} key={message._id}>
              <Card 
                elevation={3} 
                sx={{ 
                  mb: 2,
                  borderLeft: message.isBugReport 
                    ? '4px solid #f44336' // Red for bug reports
                    : '4px solid #2196f3', // Blue for messages
                }}
              >
                <CardHeader
                  title={
                    <Box display="flex" alignItems="center">
                      {message.isBugReport ? (
                        <BugReportIcon color="error" sx={{ mr: 1 }} />
                      ) : (
                        <MessageIcon color="primary" sx={{ mr: 1 }} />
                      )}
                      <Typography variant="h6">
                        {message.subject}
                      </Typography>
                    </Box>
                  }
                  subheader={`Sent on ${formatDate(message.createdAt)}`}
                  action={
                    <Chip 
                      label={message.status}
                      color={
                        message.status === 'new' ? 'default' :
                        message.status === 'in-progress' ? 'warning' :
                        message.status === 'replied' ? 'success' :
                        'default'
                      }
                      size="small"
                    />
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {message.message}
                  </Typography>
                  
                  {/* EMERGENCY FIX: Completely redesigned reply display with forced rendering */}
                  {(message.status === 'replied' || message.adminReply) ? (
                    <Box 
                      sx={{ 
                        mt: 2, 
                        pt: 2, 
                        borderTop: '1px dashed rgba(0, 0, 0, 0.12)',
                        position: 'relative',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)', // Light green background
                        borderRadius: 2,
                        p: 1
                      }}
                    >
                      <Box sx={{ position: 'absolute', top: -12, left: 16, bgcolor: 'white', px: 1 }}>
                        <Badge color="success" badgeContent=" " variant="dot" invisible={message.replyRead}>
                          <Typography variant="subtitle1" color="success.main" fontWeight="bold">
                            Admin Reply ({formatDate(message.adminReplyDate || new Date())})
                          </Typography>
                        </Badge>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        bgcolor: 'rgba(76, 175, 80, 0.08)', 
                        p: 2, 
                        borderRadius: 1,
                        mt: 2,
                        border: '1px solid #4caf50'
                      }}>
                        <ReplyIcon sx={{ mr: 1, color: 'success.main', fontSize: 24 }} />
                        <Typography sx={{ whiteSpace: 'pre-wrap', fontWeight: 'medium' }}>
                          {message.adminReply || "Your message has been reviewed and replied to by admin. Thank you for your report."}
                        </Typography>
                      </Box>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default UserContactMessages;
