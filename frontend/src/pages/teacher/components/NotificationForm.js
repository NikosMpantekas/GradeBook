import React from 'react';
import {
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography
} from '@mui/material';

/**
 * NotificationForm component handles the notification form fields
 * Includes title, message, and importance toggle
 */
const NotificationForm = ({
  formData,
  formErrors,
  handleChange,
  handleSwitchChange,
  disabled,
  user
}) => {
  return (
    <Grid container spacing={3}>
      {/* Send To All Switch */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.sendToAll}
              onChange={handleSwitchChange}
              name="sendToAll"
              color="primary"
              disabled={disabled}
            />
          }
          label="Send to all recipients"
        />
        <FormHelperText>
          {formData.sendToAll 
            ? 'Notification will be sent to all available users' 
            : 'You can select specific recipients below'}
        </FormHelperText>
      </Grid>
      
      {/* Important Notification Switch */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.isImportant}
              onChange={handleSwitchChange}
              name="isImportant"
              color="error"
              disabled={disabled}
            />
          }
          label="Mark as important notification"
        />
        <FormHelperText>
          Important notifications are highlighted for recipients
        </FormHelperText>
      </Grid>
      
      {/* Role Filter - Always visible */}
      <Grid item xs={12} md={6}>
        {/* For teachers, restrict sending to students only */}
        {user?.role === 'teacher' ? (
          <Box sx={{ my: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Note:</strong> As a teacher, you can only send notifications to students in your classes.
            </Typography>
          </Box>
        ) : (
          <FormControl fullWidth disabled={disabled}>
            <InputLabel>Target Role</InputLabel>
            <Select
              name="filterByRole"
              value={formData.filterByRole}
              label="Target Role"
              onChange={handleChange}
            >
              <MenuItem value="student">Students Only</MenuItem>
              <MenuItem value="teacher">Teachers Only</MenuItem>
              <MenuItem value="parent">Parents Only</MenuItem>
              <MenuItem value="secretary">Secretaries Only</MenuItem>
              {user?.role === 'admin' && (
                <MenuItem value="admin">Admins Only</MenuItem>
              )}
            </Select>
            <FormHelperText>
              Select which type of users should receive this notification
            </FormHelperText>
          </FormControl>
        )}
      </Grid>

      {/* Title Field */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Title *"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={!!formErrors.title}
          helperText={formErrors.title || 'Enter a descriptive title for your notification'}
          inputProps={{ maxLength: 100 }}
          disabled={disabled}
        />
      </Grid>
      
      {/* Message Field */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Message *"
          name="message"
          value={formData.message}
          onChange={handleChange}
          multiline
          rows={6}
          error={!!formErrors.message}
          helperText={
            formErrors.message || 
            `${formData.message.length}/1000 characters. Enter your notification message.`
          }
          inputProps={{ maxLength: 1000 }}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
};

export default NotificationForm;
