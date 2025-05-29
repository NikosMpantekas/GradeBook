import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

/**
 * Dialog to display text responses for a specific question
 */
const TextResponsesDialog = ({ open, handleClose, responses, question }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="text-responses-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="text-responses-title">
        Text Responses for: {question}
      </DialogTitle>
      <DialogContent>
        <List>
          {responses && responses.length > 0 ? (
            responses.map((response, index) => (
              <ListItem key={index} divider={index < responses.length - 1}>
                <ListItemText primary={response} />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No text responses available." />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TextResponsesDialog;
