import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';

/**
 * Dialog to configure and initiate report printing
 */
const PrintReportDialog = ({ open, handleClose, onPrint, onFilterChange, filters }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="print-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="print-dialog-title">
        Print Report Settings
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
          <InputLabel>Target Type Filter</InputLabel>
          <Select
            value={filters.targetType}
            onChange={(e) => onFilterChange('targetType', e.target.value)}
            label="Target Type Filter"
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="teacher">Teachers Only</MenuItem>
            <MenuItem value="subject">Subjects Only</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onPrint} color="primary" variant="contained" startIcon={<PrintIcon />}>
          Print Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintReportDialog;
