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
    <Card sx={{ mb: { xs: 2, sm: 3 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
          <MessageIcon sx={{ mr: { xs: 0.5, sm: 1 }, color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          <Typography variant="h6" component="h2" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Notification Details
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
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
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } },
                '& .MuiInputBase-input': { fontSize: { xs: '0.875rem', sm: '1rem' } },
                '& .MuiFormHelperText-root': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
              }}
              InputProps={{
                startAdornment: <TitleIcon sx={{ mr: { xs: 0.5, sm: 1 }, color: 'action.active', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
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
              rows={{ xs: 3, sm: 4 }}
              name="message"
              label="Notification Message"
              value={formData.message}
              onChange={onChange}
              error={!!errors.message}
              helperText={errors.message || 'Write your notification message. Be clear and concise.'}
              disabled={disabled}
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } },
                '& .MuiInputBase-input': { fontSize: { xs: '0.875rem', sm: '1rem' } },
                '& .MuiFormHelperText-root': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
              }}
              placeholder="Enter your notification message here..."
            />
          </Grid>

          {/* Important Notification Switch */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: { xs: 1.5, sm: 2 },
              bgcolor: formData.isImportant ? 'error.light' : 'background.default',
              borderRadius: 1,
              border: formData.isImportant ? '2px solid' : '1px solid',
              borderColor: formData.isImportant ? 'error.main' : 'divider',
              transition: 'all 0.3s ease',
              boxShadow: formData.isImportant ? '0 2px 8px rgba(211, 47, 47, 0.2)' : 'none'
            }}>
              <PriorityHighIcon 
                sx={{ 
                  mr: { xs: 0.5, sm: 1 }, 
                  color: formData.isImportant ? 'error.main' : 'action.active',
                  fontSize: formData.isImportant ? { xs: '1.2rem', sm: '1.5rem' } : { xs: '1rem', sm: '1.25rem' },
                  transition: 'all 0.3s ease'
                }} 
              />
              <Box sx={{ flexGrow: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isImportant}
                      onChange={onChange}
                      name="isImportant"
                      disabled={disabled}
                    />
                  }
                  label="Mark as Important"
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.875rem', sm: '1rem' } 
                    } 
                  }}
                />
                <FormHelperText sx={{ 
                  color: formData.isImportant ? 'error.main' : 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  mt: 0.5 
                }}>
                  Important notifications receive special highlighting and may send additional alerts
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
