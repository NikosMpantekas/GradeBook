import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Divider
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Email as EmailIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const UserMessagesList = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          You haven't sent any messages yet.
        </Typography>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'primary';
      case 'in-progress':
        return 'warning';
      case 'replied':
        return 'success';
      case 'closed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'in-progress':
        return 'In Progress';
      case 'replied':
        return 'Replied';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {messages.map((message) => (
        <Accordion key={message._id} sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`message-${message._id}-content`}
            id={`message-${message._id}-header`}
          >
            <Grid container alignItems="center" spacing={1}>
              <Grid item>
                {message.isBugReport ? (
                  <BugReportIcon color="error" />
                ) : (
                  <EmailIcon color="primary" />
                )}
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1">{message.subject}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </Typography>
              </Grid>
              <Grid item>
                <Chip 
                  label={getStatusLabel(message.status)} 
                  color={getStatusColor(message.status)} 
                  size="small" 
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.message}
              </Typography>
              
              {message.adminReply && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item>
                      <QuestionAnswerIcon color="secondary" />
                    </Grid>
                    <Grid item>
                      <Typography variant="subtitle2">
                        Admin Response
                      </Typography>
                    </Grid>
                  </Grid>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.adminReply}
                    </Typography>
                    {message.adminReplyDate && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Replied {formatDistanceToNow(new Date(message.adminReplyDate), { addSuffix: true })}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default UserMessagesList;
