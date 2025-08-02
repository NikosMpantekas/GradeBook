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
  CardContent,
  useTheme,
  useMediaQuery
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <MessageIcon sx={{ 
            mr: { xs: 0, sm: 1 }, 
            mb: { xs: 1, sm: 0 },
            color: 'primary.main',
            fontSize: { xs: '1.5rem', sm: '1.75rem' }
          }} />
          <Typography variant="h6" component="h2" sx={{ 
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}>
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
              InputProps={{
                startAdornment: <TitleIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
              placeholder="e.g., Important Class Update, Assignment Reminder..."
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </Grid>

          {/* Message Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={isMobile ? 3 : 4}
              name="message"
              label="Notification Message"
              value={formData.message}
              onChange={onChange}
              error={!!errors.message}
              helperText={errors.message || 'Write your notification message. Be clear and concise.'}
              disabled={disabled}
              placeholder="Enter your notification message here..."
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
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
              boxShadow: formData.isImportant ? '0 2px 8px rgba(211, 47, 47, 0.2)' : 'none',
              flexDirection: { xs: 'column', sm: 'row' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              <PriorityHighIcon 
                sx={{ 
                  mr: { xs: 0, sm: 1 }, 
                  mb: { xs: 1, sm: 0 },
                  color: formData.isImportant ? 'error.main' : 'action.active',
                  fontSize: formData.isImportant ? '1.5rem' : '1.25rem',
                  transition: 'all 0.3s ease'
                }} 
              />
              <Box sx={{ flexGrow: 1, width: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isImportant}
                      onChange={onChange}
                      name="isImportant"
                      color="error"
                      disabled={disabled}
                      size={formData.isImportant ? 'medium' : 'small'}
                    />
                  }
                  label={
                    <Typography 
                      variant="body1" 
                      fontWeight={formData.isImportant ? 'bold' : 'normal'}
                      color={formData.isImportant ? 'error.main' : 'text.primary'}
                      sx={{ 
                        transition: 'all 0.3s ease',
                        fontSize: { xs: '1rem', sm: formData.isImportant ? '1.1rem' : '1rem' }
                      }}
                    >
                      Mark as Important
                    </Typography>
                  }
                  sx={{ 
                    width: '100%',
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}
                />
                <FormHelperText 
                  sx={{ 
                    ml: 0, 
                    mt: 0.5,
                    color: formData.isImportant ? 'error.dark' : 'text.secondary',
                    fontWeight: formData.isImportant ? 'medium' : 'normal',
                    textAlign: { xs: 'center', sm: 'left' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {formData.isImportant 
                    ? '🔥 This notification will be highlighted with priority styling and may send additional alerts' 
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
