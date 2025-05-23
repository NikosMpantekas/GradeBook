import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

/**
 * Error Boundary component to catch and display React rendering errors
 * Prevents the entire application from crashing when a component fails
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Capture the error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log the error to console with component stack
    console.error('=== REACT COMPONENT ERROR ===');
    console.error(`Error occurred in component: ${this.props.componentName || 'Unknown'}`);
    console.error(`Message: ${error.message}`);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Error:', error);
    
    // In production, you could send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to logging service if available
      // Example: logErrorToService({ error, errorInfo, component: this.props.componentName });
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto', mt: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorOutline color="error" sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5" component="h2" color="error">
                Something went wrong
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              An error occurred in the {this.props.componentName || 'application'}.
            </Typography>
            
            {this.state.error && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="error">
                  Error: {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="body2" component="pre" sx={{ mt: 2, overflow: 'auto', maxHeight: '200px' }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
