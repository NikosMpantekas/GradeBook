import React from 'react';
import {
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  FormHelperText,
  Box,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import { 
  Title as TitleIcon,
  Message as MessageIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';

/**
 * NotificationForm component handles the basic notification form fields
 * Simplified to include only title, message, and importance toggle
 * Recipients are handled by the separate NotificationRecipients component
 */
const NotificationForm = ({
  formData,
  errors,
  onChange,
  disabled
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <MessageIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Notification Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Title Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              name="title"
              label="Notification Title"
              value={formData.title}
              onChange={onChange}
              error={!!errors.title}
              helperText={errors.title || 'Enter a clear, descriptive title for your notification'}
              disabled={disabled}
              InputProps={{
                startAdornment: <TitleIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
              placeholder="e.g., Important Class Update, Assignment Reminder..."
            />
          </Grid>

          {/* Message Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={4}
              name="message"
              label="Notification Message"
              value={formData.message}
              onChange={onChange}
              error={!!errors.message}
              helperText={errors.message || 'Write your notification message. Be clear and concise.'}
              disabled={disabled}
              placeholder="Enter your notification message here..."
            />
          </Grid>

          {/* Important Notification Switch */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 2,
              bgcolor: formData.isImportant ? 'error.light' : 'grey.50',
              borderRadius: 1,
              border: formData.isImportant ? '1px solid' : 'none',
              borderColor: 'error.main'
            }}>
              <PriorityHighIcon 
                sx={{ 
                  mr: 1, 
                  color: formData.isImportant ? 'error.main' : 'action.active' 
                }} 
              />
              <Box sx={{ flexGrow: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isImportant}
                      onChange={onChange}
                      name="isImportant"
                      color="error"
                      disabled={disabled}
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight={formData.isImportant ? 'bold' : 'normal'}>
                      Mark as Important
                    </Typography>
                  }
                />
                <FormHelperText sx={{ ml: 0, mt: 0.5 }}>
                  {formData.isImportant 
                    ? 'This notification will be highlighted and prioritized for recipients' 
                    : 'Important notifications receive special highlighting and may send additional alerts'}
                </FormHelperText>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default NotificationForm;
