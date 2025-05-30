import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { 
  Email as EmailIcon,
  BugReport as BugReportIcon,
  Announcement as AnnouncementIcon
} from '@mui/icons-material';
import ContactDeveloper from '../components/ContactDeveloper';
import UserMessagesList from '../components/UserMessagesList';
import PatchNotesList from '../components/PatchNotesList';
import PatchNoteEditor from '../components/PatchNoteEditor';
import AdminMessagesList from '../components/AdminMessagesList';
import axios from 'axios';
import { toast } from 'react-toastify';

// Custom Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}

const ContactMessages = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [patchNotes, setPatchNotes] = useState([]);
  
  // For admins/superadmins only
  const [allMessages, setAllMessages] = useState([]);
  
  // For patch notes management (superadmin only)
  const [editingPatchNote, setEditingPatchNote] = useState(null);
  const [patchNoteForm, setPatchNoteForm] = useState({
    title: '',
    content: '',
    version: '',
    type: 'release',
    isActive: true
  });

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchUserMessages();
      fetchPatchNotes();
      
      // If admin or superadmin, fetch all messages
      if (user.role === 'admin' || user.role === 'superadmin') {
        fetchAllMessages();
      }
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Contact Developer handlers
  const handleOpenContact = () => {
    setContactOpen(true);
  };
  
  const handleCloseContact = () => {
    setContactOpen(false);
    // Refresh user messages after closing contact form
    fetchUserMessages();
  };

  // Fetch user's messages
  const fetchUserMessages = async () => {
    if (!user || !user.token) return;
    
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const response = await axios.get('/api/contact/user', config);
      setUserMessages(response.data);
    } catch (error) {
      console.error('Error fetching user messages:', error);
      toast.error('Failed to load your messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all messages (admin/superadmin only)
  const fetchAllMessages = async () => {
    if (!user || !user.token || (user.role !== 'admin' && user.role !== 'superadmin')) return;
    
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const response = await axios.get('/api/contact', config);
      setAllMessages(response.data);
    } catch (error) {
      console.error('Error fetching all messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch patch notes
  const fetchPatchNotes = async () => {
    if (!user || !user.token) return;
    
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const response = await axios.get('/api/patch-notes', config);
      setPatchNotes(response.data);
    } catch (error) {
      console.error('Error fetching patch notes:', error);
      toast.error('Failed to load patch notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 2,
          mt: 3,
          mb: 3
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Support & Announcements
        </Typography>
        
        {/* Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="support tabs"
          variant="fullWidth"
        >
          <Tab 
            label="My Messages" 
            icon={<EmailIcon />} 
            iconPosition="start"
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab 
            label="Patch Notes" 
            icon={<AnnouncementIcon />} 
            iconPosition="start"
            id="tab-1"
            aria-controls="tabpanel-1"
          />
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Tab 
              label="All Messages" 
              icon={<BugReportIcon />} 
              iconPosition="start"
              id="tab-2"
              aria-controls="tabpanel-2"
            />
          )}
        </Tabs>
        
        <Divider sx={{ mt: 1, mb: 2 }} />
        
        {/* My Messages Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EmailIcon />}
              onClick={handleOpenContact}
            >
              Contact Support
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <UserMessagesList messages={userMessages} />
          )}
        </TabPanel>
        
        {/* Patch Notes Tab */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Super admin can create/edit patch notes */}
              {user?.role === 'superadmin' && (
                <PatchNoteEditor 
                  user={user} 
                  onPatchNotesChanged={fetchPatchNotes} 
                />
              )}
              <PatchNotesList patchNotes={patchNotes} />
            </>
          )}
        </TabPanel>
        
        {/* All Messages Tab (Admin/Superadmin Only) */}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <TabPanel value={tabValue} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <AdminMessagesList 
                messages={allMessages} 
                user={user} 
                onMessagesChanged={fetchAllMessages} 
              />
            )}
          </TabPanel>
        )}
      </Paper>
      
      {/* Contact Developer Dialog */}
      <ContactDeveloper 
        open={contactOpen} 
        onClose={handleCloseContact} 
      />
    </Container>
  );
};

export default ContactMessages;
