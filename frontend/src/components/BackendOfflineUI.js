import React from 'react';
import { Box, Container, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { RefreshIcon, WarningIcon } from '@mui/icons-material';
import { useBackendHealth } from '../context/BackendHealthContext';

const BackendOfflineUI = ({ 
  children,
  customMaintenancePage,
  showRetryButton = true,
  retryButtonText = "Δοκιμάστε Ξανά",
  offlineMessage = "Η σύνδεση με τον διακομιστή έχει χαθεί. Παρακαλώ περιμένετε...",
  checkingMessage = "Ελέγχουμε τη σύνδεση...",
  className,
  ...props 
}) => {
  const { isBackendOnline, isChecking, performHealthCheck, lastCheckTime } = useBackendHealth();

  // If backend is online, render children normally
  if (isBackendOnline) {
    return children;
  }

  // If custom maintenance page is provided, use it
  if (customMaintenancePage) {
    return customMaintenancePage;
  }

  // Default offline UI
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 3
        }}
        className={className}
        {...props}
      >
        {/* Warning Icon */}
        <WarningIcon 
          sx={{ 
            fontSize: 64, 
            color: 'warning.main',
            mb: 2
          }} 
        />

        {/* Status Message */}
        <Typography variant="h4" component="h1" gutterBottom>
          Συντήρηση Συστήματος
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {isChecking ? checkingMessage : offlineMessage}
        </Typography>

        {/* Last Check Time */}
        {lastCheckTime && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
            Τελευταίος έλεγχος: {lastCheckTime.toLocaleTimeString()}
          </Typography>
        )}

        {/* Checking Indicator */}
        {isChecking && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Ελέγχουμε τη σύνδεση...
            </Typography>
          </Box>
        )}

        {/* Retry Button */}
        {showRetryButton && !isChecking && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={performHealthCheck}
            sx={{ mt: 2 }}
          >
            {retryButtonText}
          </Button>
        )}

        {/* Status Alert */}
        <Alert 
          severity="warning" 
          sx={{ mt: 2, maxWidth: 400 }}
        >
          Το σύστημα είναι προσωρινά μη διαθέσιμο. Παρακαλώ δοκιμάστε ξανά σε λίγο.
        </Alert>
      </Box>
    </Container>
  );
};

export default BackendOfflineUI; 