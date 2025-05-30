import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  FormControlLabel,
  Switch,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const PatchNoteEditor = ({ user, onPatchNotesChanged }) => {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: null,
    title: '',
    content: '',
    version: '',
    type: 'release',
    isActive: true
  });
  
  const resetForm = () => {
    setFormData({
      _id: null,
      title: '',
      content: '',
      version: '',
      type: 'release',
      isActive: true
    });
    setIsEditing(false);
    setPreviewMode(false);
  };
  
  const handleOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value
    });
  };
  
  const handleEdit = (patchNote) => {
    setFormData({
      _id: patchNote._id,
      title: patchNote.title,
      content: patchNote.content,
      version: patchNote.version,
      type: patchNote.type,
      isActive: patchNote.isActive
    });
    setIsEditing(true);
    setOpen(true);
  };
  
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };
  
  const handleDeleteConfirm = () => {
    setConfirmDelete(true);
  };
  
  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.version) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      let response;
      
      if (isEditing) {
        // Update existing patch note
        response = await axios.put(
          `/api/patch-notes/${formData._id}`,
          formData,
          config
        );
        toast.success('Patch note updated successfully');
      } else {
        // Create new patch note
        response = await axios.post('/api/patch-notes', formData, config);
        toast.success('Patch note created successfully');
      }
      
      // Close the dialog and reset form
      handleClose();
      
      // Trigger refresh of patch notes list
      if (onPatchNotesChanged) {
        onPatchNotesChanged();
      }
    } catch (error) {
      console.error('Error saving patch note:', error);
      toast.error(error.response?.data?.message || 'Error saving patch note');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!formData._id) return;
    
    setLoading(true);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.delete(`/api/patch-notes/${formData._id}`, config);
      
      toast.success('Patch note deleted successfully');
      
      // Close dialogs and reset form
      setConfirmDelete(false);
      handleClose();
      
      // Trigger refresh of patch notes list
      if (onPatchNotesChanged) {
        onPatchNotesChanged();
      }
    } catch (error) {
      console.error('Error deleting patch note:', error);
      toast.error(error.response?.data?.message || 'Error deleting patch note');
    } finally {
      setLoading(false);
    }
  };
  
  // Only superadmins can manage patch notes
  if (user.role !== 'superadmin') {
    return null;
  }
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Create Patch Note
        </Button>
      </Box>
      
      {/* Patch Note Editor Dialog */}
      <Dialog 
        open={open} 
        onClose={!loading ? handleClose : undefined}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {isEditing ? 'Edit Patch Note' : 'Create Patch Note'}
            </Typography>
            {!loading && (
              <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            {previewMode ? (
              <Box sx={{ mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
                  <Typography variant="h5" gutterBottom>
                    {formData.title || 'Untitled Patch Note'} <Typography component="span" variant="caption" color="text.secondary">v{formData.version || '0.0.0'}</Typography>
                  </Typography>
                  <ReactMarkdown>
                    {formData.content || '*No content provided*'}
                  </ReactMarkdown>
                </Paper>
                <Button
                  variant="outlined"
                  onClick={togglePreviewMode}
                  startIcon={<CloseIcon />}
                >
                  Exit Preview
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    name="title"
                    label="Title"
                    fullWidth
                    variant="outlined"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="version"
                    label="Version"
                    fullWidth
                    variant="outlined"
                    value={formData.version}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    placeholder="e.g. 1.2.3"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      label="Type"
                      disabled={loading}
                    >
                      <MenuItem value="release">Release</MenuItem>
                      <MenuItem value="bugfix">Bug Fix</MenuItem>
                      <MenuItem value="feature">New Feature</MenuItem>
                      <MenuItem value="improvement">Improvement</MenuItem>
                      <MenuItem value="critical">Critical Update</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="content"
                    label="Content (Markdown supported)"
                    fullWidth
                    multiline
                    rows={10}
                    variant="outlined"
                    value={formData.content}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    You can use Markdown formatting for rich text. For example: **bold**, *italic*, ## headings, etc.
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    }
                    label="Active (visible to users)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={togglePreviewMode}
                      startIcon={<PreviewIcon />}
                      sx={{ mr: 1 }}
                    >
                      Preview
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          
          <DialogActions>
            {isEditing && (
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteConfirm}
                disabled={loading}
                sx={{ mr: 'auto' }}
              >
                Delete
              </Button>
            )}
            
            <Button 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading || previewMode}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this patch note? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PatchNoteEditor;
