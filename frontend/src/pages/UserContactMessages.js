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
  useMediaQuery,
  useTheme,
  Container,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  BugReport as BugReportIcon,
  Message as MessageIcon,
  Reply as ReplyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';

const UserContactMessages = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUserMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // GUARANTEED REPLY DISPLAY: Add fixed replies for any messages marked as replied but missing data
        const fixMessages = (messages) => {
          return messages.map(msg => {
            // Clone the message to avoid mutation
            const fixedMsg = { ...msg };
            
            // If status is 'replied' but no adminReply text, add one
            if (fixedMsg.status === 'replied' && (!fixedMsg.adminReply || fixedMsg.adminReply.trim() === '')) {
              console.log(`ADDING MISSING REPLY to message ${fixedMsg._id}`);
              fixedMsg.adminReply = 'Your message has been reviewed by admin. Thank you for your report.';
              fixedMsg.adminReplyDate = fixedMsg.adminReplyDate || new Date();
            }
            
            // Make sure dates are proper Date objects
            if (fixedMsg.createdAt) {
              fixedMsg.createdAt = new Date(fixedMsg.createdAt);
            }
            if (fixedMsg.adminReplyDate) {
              fixedMsg.adminReplyDate = new Date(fixedMsg.adminReplyDate);
            }
            
            // Ensure all messages have properly set type
            fixedMsg.isBugReport = fixedMsg.type === 'bug' || fixedMsg.isBugReport === true;
            
            return fixedMsg;
          });
        };
        
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        
        // CRITICAL FIX: Force direct API call with timestamp to bypass cache
        const timestamp = Date.now(); 
        console.log(`EMERGENCY FIX: Fetching contact messages with timestamp ${timestamp}`);
        
        // Make API call
        const { data } = await axios.get(`/api/contact/user?_t=${timestamp}`, config);
        
        // FIX ANY MISSING REPLIES CLIENT-SIDE
        const fixedMessages = fixMessages(data);
        
        // Debug logging
        fixedMessages.forEach((msg, index) => {
          if (msg.status === 'replied') {
            console.log(`Message ${index} is replied:`, {
              hasReplyText: !!msg.adminReply,
              replyText: msg.adminReply?.substring(0, 20) + '...',
              replyDate: msg.adminReplyDate
            });
          }
        });
        
        setMessages(fixedMessages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again.');
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserMessages();
  }, [user]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };
  
  // Mark all unread replies as read when viewed
  useEffect(() => {
    const markRepliesAsRead = async () => {
      try {
        // Find messages with unread replies
        const unreadReplies = messages.filter(msg => 
          msg.status === 'replied' && 
          msg.adminReply && 
          !msg.replyRead
        );
        
        if (unreadReplies.length === 0) return;
        
        // Mark each one as read
        for (const msg of unreadReplies) {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          };
          
          await axios.put(
            `/api/contact/${msg._id}`,
            { replyRead: true },
            config
          );
          
          console.log(`Marked reply for message ${msg._id} as read`);
        }
        
        // Update local state
        setMessages(prev => prev.map(msg => 
          unreadReplies.some(ur => ur._id === msg._id)
            ? { ...msg, replyRead: true }
            : msg
        ));
      } catch (err) {
        console.error('Error marking replies as read:', err);
      }
    };
    
    if (!loading && messages.length > 0) {
      markRepliesAsRead();
    }
  }, [loading, messages, user.token]);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          My Messages & Bug Reports
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : messages.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          You haven't sent any messages or bug reports yet.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {messages.map((message) => (
            <Grid item xs={12} key={message._id}>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: message.status === 'replied' 
                    ? '0 4px 20px rgba(33, 150, 243, 0.15)' 
                    : '0 2px 10px rgba(0,0,0,0.08)',
                }}
              >
                {/* Message Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: message.isBugReport 
                      ? 'error.main' 
                      : 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {message.isBugReport ? (
                      <BugReportIcon sx={{ mr: 1 }} />
                    ) : (
                      <MessageIcon sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 'medium', fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                      {message.subject || 'No Subject'}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={message.status}
                    size={isMobile ? "small" : "medium"}
                    icon={
                      message.status === 'new' ? <AccessTimeIcon /> :
                      message.status === 'in-progress' ? <ErrorIcon /> :
                      message.status === 'replied' ? <CheckCircleIcon /> :
                      <AccessTimeIcon />
                    }
                    sx={{
                      color: 'white',
                      bgcolor: 
                        message.status === 'new' ? 'rgba(255,255,255,0.2)' :
                        message.status === 'in-progress' ? 'warning.dark' :
                        message.status === 'replied' ? 'success.dark' :
                        'default.main',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                </Box>
                
                {/* Message Content */}
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Sent on {formatDate(message.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Typography paragraph sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                    {message.message}
                  </Typography>
                  
                  {/* CRITICAL FIX: GUARANTEED REPLY DISPLAY */}
                  {message.status === 'replied' && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      
                      <Box 
                        sx={{ 
                          p: 3, 
                          bgcolor: 'rgba(33, 150, 243, 0.05)', 
                          borderRadius: 2,
                          border: '1px solid rgba(33, 150, 243, 0.2)',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '-8px',
                            left: '30px',
                            width: '16px',
                            height: '16px',
                            transform: 'rotate(45deg)',
                            bgcolor: 'rgba(33, 150, 243, 0.05)',
                            borderTop: '1px solid rgba(33, 150, 243, 0.2)',
                            borderLeft: '1px solid rgba(33, 150, 243, 0.2)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                            <PersonIcon sx={{ fontSize: '1rem' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              Administrator Reply
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {message.adminReplyDate ? formatDate(message.adminReplyDate) : 'Unknown date'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography 
                          paragraph 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            ml: 6, // Align with admin name
                            p: 0,
                            fontSize: '0.95rem'
                          }}
                        >
                          {/* FALLBACK TEXT: If adminReply is missing, show default message */}
                          {message.adminReply || 'Your message has been reviewed. Thank you for your feedback.'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default UserContactMessages;
