import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  NewReleases as NewReleasesIcon,
  BugReport as BugReportIcon,
  CodeRounded as CodeIcon,
  AutoFixHigh as FixIcon,
  PriorityHigh as CriticalIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Import ReactMarkdown safely
import ReactMarkdown from 'react-markdown';

const PatchNotesList = ({ patchNotes, user, onEdit, onDelete }) => {
  if (!patchNotes || patchNotes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No patch notes available yet.
        </Typography>
      </Box>
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'release':
        return <NewReleasesIcon color="primary" />;
      case 'bugfix':
        return <BugReportIcon color="warning" />;
      case 'feature':
        return <CodeIcon color="success" />;
      case 'improvement':
        return <FixIcon color="info" />;
      case 'critical':
        return <CriticalIcon color="error" />;
      default:
        return <NewReleasesIcon />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'release':
        return 'primary';
      case 'bugfix':
        return 'warning';
      case 'feature':
        return 'success';
      case 'improvement':
        return 'info';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'release':
        return 'Release';
      case 'bugfix':
        return 'Bug Fix';
      case 'feature':
        return 'New Feature';
      case 'improvement':
        return 'Improvement';
      case 'critical':
        return 'Critical Update';
      default:
        return type;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {patchNotes.map((note) => (
        <Accordion key={note._id} sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`note-${note._id}-content`}
            id={`note-${note._id}-header`}
          >
            <Grid container alignItems="center" spacing={1}>
              <Grid item>
                {getTypeIcon(note.type)}
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1">
                  {note.title} <Typography component="span" variant="caption" color="text.secondary">v{note.version}</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </Typography>
              </Grid>
              <Grid item>
                <Chip 
                  label={getTypeLabel(note.type)} 
                  color={getTypeColor(note.type)} 
                  size="small" 
                  variant="outlined"
                />
              </Grid>
              
              {/* Edit/Delete buttons for superadmin */}
              {user?.role === 'superadmin' && (
                <Grid item>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit patch note">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEdit) onEdit(note);
                        }}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete patch note">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDelete) onDelete(note);
                        }}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'error.light',
                            color: 'error.contrastText'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              )}
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                {/* Using ReactMarkdown to support markdown in patch notes */}
                <ReactMarkdown>
                  {note.content}
                </ReactMarkdown>
                
                <Divider sx={{ my: 1 }} />
                
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Typography variant="caption" color="text.secondary">
                      Version {note.version}
                    </Typography>
                  </Grid>
                  {note.publishedBy && (
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">
                        Published by {note.publishedBy.name || 'Admin'}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default PatchNotesList;
