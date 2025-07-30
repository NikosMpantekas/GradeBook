import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  OutlinedInput,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  Link as LinkIcon,
  Unlink as UnlinkIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/appConfig';

const ManageParents = () => {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('create'); // 'create', 'edit', 'link'
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobilePhone: '',
    personalEmail: '',
    emailCredentials: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, []);

  const fetchParents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users?role=parent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setParents(data.users || []);
      } else {
        throw new Error('Failed to fetch parents');
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
      setError('Failed to fetch parents');
      toast.error('Failed to fetch parents');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users?role=student`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.users || []);
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParent = async () => {
    if (!selectedStudents.length) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/create-parent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentIds: selectedStudents.map(s => s._id),
          parentName: formData.name,
          parentEmail: formData.email,
          parentPassword: formData.password,
          parentMobilePhone: formData.mobilePhone,
          parentPersonalEmail: formData.personalEmail,
          emailCredentials: formData.emailCredentials
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Parent account created successfully for ${selectedStudents.map(s => s.name).join(', ')}`);
        setDialogOpen(false);
        resetForm();
        fetchParents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create parent account');
      }
    } catch (error) {
      console.error('Error creating parent:', error);
      toast.error(error.message);
    }
  };

  const handleLinkStudents = async () => {
    if (!selectedParent || !selectedStudents.length) {
      toast.error('Please select a parent and at least one student');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/create-parent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentIds: selectedStudents.map(s => s._id),
          parentName: selectedParent.name,
          parentEmail: selectedParent.email,
          parentPassword: 'temp123', // Won't be used since parent exists
          emailCredentials: false
        })
      });

      if (response.ok) {
        toast.success(`Students linked to parent successfully`);
        setDialogOpen(false);
        resetForm();
        fetchParents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to link students');
      }
    } catch (error) {
      console.error('Error linking students:', error);
      toast.error(error.message);
    }
  };

  const handleUnlinkStudents = async (parentId, studentIds) => {
    try {
      const response = await fetch(`${API_URL}/api/users/parent/${parentId}/students`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds })
      });

      if (response.ok) {
        toast.success('Students unlinked successfully');
        fetchParents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unlink students');
      }
    } catch (error) {
      console.error('Error unlinking students:', error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      mobilePhone: '',
      personalEmail: '',
      emailCredentials: true
    });
    setSelectedStudents([]);
    setSelectedParent(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogType('create');
    setDialogOpen(true);
  };

  const openLinkDialog = () => {
    resetForm();
    setDialogType('link');
    setDialogOpen(true);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const filteredParents = parents.filter(parent =>
    parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLinkedStudentNames = (parent) => {
    if (!parent.linkedStudentIds || parent.linkedStudentIds.length === 0) {
      return 'No students linked';
    }
    
    const linkedStudents = students.filter(student => 
      parent.linkedStudentIds.includes(student._id)
    );
    
    return linkedStudents.map(s => s.name).join(', ');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          👨‍👩‍👧‍👦 Manage Parent Accounts
        </Typography>
        <Typography variant="body1">
          Create and manage parent accounts linked to students. Parents can view their children's grades, notifications, and academic progress.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ bgcolor: 'primary.main' }}
        >
          Create Parent Account
        </Button>
        <Button
          variant="outlined"
          startIcon={<LinkIcon />}
          onClick={openLinkDialog}
        >
          Link Students to Existing Parent
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search parents by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Parents List */}
      <Grid container spacing={3}>
        {filteredParents.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchTerm ? 'No parents found matching your search' : 'No parent accounts created yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {!searchTerm && 'Create parent accounts to allow parents to monitor their children\'s academic progress'}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredParents.map((parent) => (
            <Grid item xs={12} key={parent._id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <PersonIcon color="primary" />
                    <Box>
                      <Typography variant="h6" fontWeight="medium">
                        {parent.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {parent.email} • {parent.linkedStudentIds?.length || 0} students linked
                      </Typography>
                    </Box>
                    <Box ml="auto">
                      <Chip
                        label={parent.active ? 'Active' : 'Inactive'}
                        color={parent.active ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                        Contact Information
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{parent.email}</Typography>
                      </Box>
                      {parent.mobilePhone && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{parent.mobilePhone}</Typography>
                        </Box>
                      )}
                      {parent.personalEmail && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">{parent.personalEmail} (Personal)</Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                        Linked Students
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getLinkedStudentNames(parent)}
                      </Typography>
                      {parent.linkedStudentIds && parent.linkedStudentIds.length > 0 && (
                        <Button
                          size="small"
                          startIcon={<UnlinkIcon />}
                          onClick={() => handleUnlinkStudents(parent._id, parent.linkedStudentIds)}
                          sx={{ mt: 1 }}
                          color="warning"
                        >
                          Unlink All Students
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create/Link Parent Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Create Parent Account' : 'Link Students to Existing Parent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {dialogType === 'create' ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Parent Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Parent Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <Button onClick={generatePassword} variant="outlined">
                      Generate
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mobile Phone"
                    value={formData.mobilePhone}
                    onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Personal Email (Optional)"
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.emailCredentials}
                        onChange={(e) => setFormData({ ...formData, emailCredentials: e.target.checked })}
                      />
                    }
                    label="Email login credentials to parent"
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={parents}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={selectedParent}
                    onChange={(event, newValue) => setSelectedParent(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Parent" fullWidth required />
                    )}
                  />
                </Grid>
              </Grid>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Select Students to Link
            </Typography>
            <Autocomplete
              multiple
              options={students}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={selectedStudents}
              onChange={(event, newValue) => setSelectedStudents(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select Students" placeholder="Choose students" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option._id}
                  />
                ))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={dialogType === 'create' ? handleCreateParent : handleLinkStudents}
            variant="contained"
            disabled={!selectedStudents.length || (dialogType === 'create' && (!formData.name || !formData.email || !formData.password))}
          >
            {dialogType === 'create' ? 'Create Parent' : 'Link Students'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageParents;
