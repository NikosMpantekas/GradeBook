import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error boundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper 
          elevation={3} 
          sx={{
            p: 4,
            m: 2,
            borderRadius: 2,
            textAlign: 'center',
            backgroundColor: '#fff8f8',
            border: '1px solid #ffeeee'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ErrorIcon color="error" fontSize="large" />
          </Box>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            There was an error in the {this.props.componentName || 'component'}.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 3, color: 'text.secondary' }}>
            {this.state.error && this.state.error.toString()}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.href = '/app/admin/dashboard'}
          >
            Return to Dashboard
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
