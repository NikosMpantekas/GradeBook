import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { SentimentDissatisfied as SadIcon } from '@mui/icons-material';

/**
 * EmptyState component to display when there's no data available
 * @param {Object} props Component props
 * @param {string} props.title Title to display
 * @param {string} props.description Description text
 * @param {React.ReactNode} props.icon Icon to display (optional)
 * @param {string} props.actionText Text for action button (optional)
 * @param {Function} props.onAction Callback for action button (optional)
 */
const EmptyState = ({ 
  title = 'No Data Available', 
  description = 'There is no data to display at this time.', 
  icon, 
  actionText, 
  onAction 
}) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 4, 
        textAlign: 'center',
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px dashed',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ mb: 2 }}>
        {icon || <SadIcon sx={{ fontSize: 60, color: 'text.secondary' }} />}
      </Box>
      
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        {description}
      </Typography>
      
      {actionText && onAction && (
        <Button 
          variant="outlined" 
          onClick={onAction}
          sx={{ mt: 2 }}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;
