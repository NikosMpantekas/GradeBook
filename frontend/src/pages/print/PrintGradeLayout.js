import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Divider, 
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Print as PrintIcon, 
  SaveAlt as SaveIcon, 
  Close as CloseIcon 
} from '@mui/icons-material';

// Styled components for print-specific elements
const PrintableContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
  color: theme.palette.text.primary,
  padding: theme.spacing(4),
  margin: 'auto',
  maxWidth: '1000px',
  '@media print': {
    margin: 0,
    padding: theme.spacing(1),
    width: '100%',
    boxShadow: 'none',
    pageBreakInside: 'avoid',
    backgroundColor: '#ffffff',
    color: '#000000'
  }
}));

const PrintHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  '@media print': {
    marginBottom: theme.spacing(2)
  }
}));

const PrintFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  '@media print': {
    fontSize: '0.7rem'
  }
}));

const PrintControls = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  color: 'white',
  '@media print': {
    display: 'none'
  }
}));

const PrintGradeLayout = ({ 
  studentName, 
  studentEmail, 
  startDate, 
  endDate, 
  children, 
  onClose 
}) => {
  const theme = useTheme();
  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Handle print action
  const handlePrint = () => {
    window.print();
  };

  // Handle save as PDF
  const handleSaveAsPDF = () => {
    // Modern browsers have PDF saving built into the print dialog
    window.print();
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Print Controls - visible only on screen */}
      <PrintControls>
        <Typography variant="h6">Grade Report</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<SaveIcon />} 
            onClick={handleSaveAsPDF}
            sx={{ mr: 1 }}
          >
            Save as PDF
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<CloseIcon />} 
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </PrintControls>

      {/* Main Printable Content */}
      <PrintableContainer>
        <PrintHeader>
          <Typography variant="h4" gutterBottom>
            Academic Grade Report
          </Typography>
          <Typography variant="h5" gutterBottom>
            {studentName || 'Student Name'}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            {studentEmail || 'Student Email'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Period: {formatDate(startDate)} - {formatDate(endDate)}
          </Typography>
        </PrintHeader>
      
        <Divider sx={{ my: 3 }} />
        
        {/* Child components will be rendered here */}
        {children}
        
        <Divider sx={{ my: 3 }} />

        <PrintFooter>
          <Typography variant="body2">
            This report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </Typography>
          <Typography variant="caption">
            GradeBook Report System | Academic Year 2025
          </Typography>
        </PrintFooter>
      </PrintableContainer>
    </Box>
  );
};

export default PrintGradeLayout;
