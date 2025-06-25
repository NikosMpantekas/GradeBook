import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControlLabel,
  Switch,
  Button,
} from '@mui/material';

const NotificationEditDialog = ({
  open,
  onClose,
  notification,
  editForm,
  onFormChange,
  onSave,
  isLoading
}) => {
  
  const handleInputChange = (field) => (event) => {
    const value = field === 'isImportant' ? event.target.checked : event.target.value;
    onFormChange(field, value);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        Edit Notification
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Title"
          fullWidth
          variant="outlined"
          value={editForm.title}
          onChange={handleInputChange('title')}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Message"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={editForm.message}
          onChange={handleInputChange('message')}
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={editForm.isImportant}
              onChange={handleInputChange('isImportant')}
            />
          }
          label="Mark as Important"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={onSave} 
          variant="contained"
          disabled={!editForm.title || !editForm.message || isLoading}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationEditDialog;
