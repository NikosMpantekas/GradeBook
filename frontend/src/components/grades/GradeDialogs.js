import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

/**
 * Edit Grade Dialog Component
 */
export const EditGradeDialog = ({
  open,
  handleClose,
  editGradeData,
  handleEditChange,
  handleEditSave,
  subjects,
  user
}) => {
  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>Edit Grade</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Update the grade information below.
        </DialogContentText>
        
        {/* Value input - everyone can edit */}
        <TextField
          margin="dense"
          id="value"
          name="value"
          label="Grade Value"
          type="number"
          fullWidth
          variant="outlined"
          value={editGradeData.value || ''}
          onChange={handleEditChange}
          inputProps={{ min: 0, max: 100 }}
          sx={{ mb: 2 }}
        />
        
        {/* Description - only if teacher has permission */}
        {user?.canAddGradeDescriptions !== false && (
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={editGradeData.description || ''}
            onChange={handleEditChange}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
        )}
        
        {/* Date input */}
        <TextField
          margin="dense"
          id="date"
          name="date"
          label="Date"
          type="date"
          fullWidth
          variant="outlined"
          value={editGradeData.date ? new Date(editGradeData.date).toISOString().split('T')[0] : ''}
          onChange={handleEditChange}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        
        {/* Subject dropdown - readonly for visual reference */}
        <FormControl fullWidth sx={{ mb: 2 }} disabled>
          <InputLabel id="subject-label">Subject</InputLabel>
          <Select
            labelId="subject-label"
            id="subject"
            name="subject"
            value={editGradeData.subject || ''}
            label="Subject"
          >
            {(subjects || []).map((subject) => (
              subject && subject._id ? (
                <MenuItem key={subject._id} value={subject._id}>
                  {subject.name}
                </MenuItem>
              ) : null
            ))}
          </Select>
        </FormControl>
        
        {/* Student - readonly for visual reference */}
        <TextField
          margin="dense"
          id="student-name"
          name="student-name"
          label="Student"
          type="text"
          fullWidth
          variant="outlined"
          value={editGradeData.studentName || ''}
          disabled
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleEditSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Delete Grade Dialog Component
 */
export const DeleteGradeDialog = ({
  open,
  handleClose,
  handleConfirm,
  gradeToDelete
}) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this grade? This action cannot be undone.
        </DialogContentText>
        {gradeToDelete && (
          <DialogContentText sx={{ mt: 2 }}>
            <strong>Student:</strong> {gradeToDelete.student?.name || 'Unknown'}<br />
            <strong>Subject:</strong> {gradeToDelete.subject?.name || 'Unknown'}<br />
            <strong>Value:</strong> {gradeToDelete.value || 'N/A'}<br />
            <strong>Date:</strong> {gradeToDelete.date ? new Date(gradeToDelete.date).toLocaleDateString() : 'N/A'}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Reusable DateInput component
 */
export const DateInput = ({ value, onChange, label, disabled }) => {
  return (
    <TextField
      fullWidth
      margin="dense"
      id="date"
      label={label || "Date"}
      type="date"
      value={value ? new Date(value).toISOString().split('T')[0] : ''}
      onChange={onChange}
      disabled={disabled}
      InputLabelProps={{
        shrink: true,
      }}
    />
  );
};
