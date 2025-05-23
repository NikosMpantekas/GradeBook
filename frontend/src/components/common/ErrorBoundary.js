import React from 'react';
import { Box, Typography, Button, Paper, Accordion, AccordionSummary, AccordionDetails, Alert } from '@mui/material';
import { ErrorOutline, ExpandMore, BugReport, FindInPage, RestartAlt } from '@mui/icons-material';

/**
 * ENHANCED ERROR BOUNDARY
 * Comprehensive error catching and detailed logging for easier debugging
 * Provides detailed error reports in both development and production
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null,
      errorLocation: null,
      errorTime: null,
      stackParsed: false,
      errorType: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  // Parse the minified stack trace to find useful information
  parseMinifiedStack(error, errorInfo) {
    try {
      const errorStack = error.stack || '';
      const componentStack = errorInfo.componentStack || '';
      
      // Try to identify the error type
      let errorType = 'Unknown Error';
      if (error.name) {
        errorType = error.name;
      }
      
      // Check for common error patterns
      if (errorStack.includes('TypeError') && errorStack.includes('undefined')) {
        if (errorStack.includes('is not a function')) {
          errorType = 'Function Not Found Error';
        } else {
          errorType = 'Undefined Value Error';
        }
      }
      
      // Try to find the function name where the error occurred
      let errorLocation = 'Unknown';
      const functionMatch = errorStack.match(/at ([\w.<>]+)/);
      if (functionMatch && functionMatch[1]) {
        errorLocation = functionMatch[1];
      }
      
      // Extract React component information
      let componentInfo = [];
      const componentLines = componentStack.split('\n').filter(line => line.trim() !== '');
      componentInfo = componentLines.map(line => {
        const match = line.match(/in ([\w]+)/); 
        return match ? match[1] : line.trim();
      }).filter(Boolean);
      
      // Look for a possible undefined function call
      let possibleUndefinedCall = '';
      if (error.message && error.message.includes('undefined')) {
        const matches = error.message.match(/([\w.]+)\(\.\.\.[\s\S]*is undefined/i);
        if (matches && matches[1]) {
          possibleUndefinedCall = matches[1];
        } else if (error.message.includes('x(...) is undefined') || error.message.includes('y(...) is undefined')) {
          possibleUndefinedCall = 'Minified function call (likely a Redux action or selector)';
        }
      }
      
      return {
        errorType,
        errorLocation,
        componentPath: componentInfo.join(' → '),
        possibleUndefinedCall,
        isReduxError: errorStack.includes('dispatch') || componentStack.includes('Provider') || possibleUndefinedCall.includes('Redux')
      };
    } catch (parsingError) {
      console.error('Error while parsing error stack:', parsingError);
      return { 
        errorType: 'Error Parsing Failed',
        errorLocation: 'Unknown',
        componentPath: 'Unknown',
        possibleUndefinedCall: 'Unknown',
        isReduxError: false
      };
    }
  }

  componentDidCatch(error, errorInfo) {
    // Get current time for the error
    const errorTime = new Date().toISOString();
    
    // Parse the stack trace for better debugging
    const parsedError = this.parseMinifiedStack(error, errorInfo);
    
    // Capture the error details
    this.setState({
      error,
      errorInfo,
      errorTime,
      errorType: parsedError.errorType,
      errorLocation: parsedError.errorLocation,
      errorDetails: parsedError,
      stackParsed: true
    });
    
    // Create a clean error ID for easier tracking
    const errorId = `ERR_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
    
    // Log the error with a distinctive pattern that's easy to find in logs
    console.error(`\n🔴 ====== ERROR BOUNDARY CAUGHT ERROR (${errorId}) ====== 🔴`);
    console.error(`⏰ Time: ${errorTime}`);
    console.error(`🏷️ Type: ${parsedError.errorType}`);
    console.error(`📍 Location: ${parsedError.errorLocation}`);
    console.error(`⚛️ Component: ${this.props.componentName || 'Unknown'}`);
    console.error(`⚛️ Component Path: ${parsedError.componentPath}`);
    
    if (parsedError.possibleUndefinedCall) {
      console.error(`❓ Possible undefined call: ${parsedError.possibleUndefinedCall}`);
    }
    
    if (parsedError.isReduxError) {
      console.error(`🔄 REDUX ERROR DETECTED - Likely a missing action or selector`);
    }
    
    // Technical details for developers
    console.error('\n📋 Technical Details:');
    console.error(`Message: ${error.message}`);
    console.error('Full Error Object:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // Suggestions based on error type
    console.error('\n🔧 Potential Fixes:');
    if (parsedError.isReduxError) {
      console.error('1. Check if all actions are properly exported from their slice files');
      console.error('2. Ensure all reducers in createSlice have matching exports');
      console.error('3. Verify no direct imports from slice.actions are being used in component body');
      console.error('4. Look for dynamic imports or requires that might fail in production');
    } else if (parsedError.errorType.includes('Undefined')) {
      console.error('1. Check for null/undefined objects before accessing their properties');
      console.error('2. Verify that all imported functions exist and are exported correctly');
      console.error('3. Check for typos in function or variable names');
    }
    
    console.error(`🔴 ====== END OF ERROR ${errorId} ====== 🔴\n`);
    
    // Save error to localStorage for debugging across refreshes
    try {
      const existingErrors = JSON.parse(localStorage.getItem('gradebook_errors') || '[]');
      existingErrors.push({
        id: errorId,
        time: errorTime,
        type: parsedError.errorType,
        location: parsedError.errorLocation,
        component: this.props.componentName || 'Unknown',
        message: error.message,
        isReduxError: parsedError.isReduxError,
        componentPath: parsedError.componentPath
      });
      // Keep only the last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      localStorage.setItem('gradebook_errors', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to save error to localStorage:', e);
    }
  }

  // Add method to copy error details to clipboard for support
  copyErrorDetailsToClipboard = () => {
    try {
      const { error, errorInfo, errorType, errorLocation, errorTime, errorDetails } = this.state;
      
      // Create a formatted text report
      const errorReport = [
        `ERROR REPORT - ${errorTime}`,
        `Type: ${errorType || error?.name || 'Unknown Error'}`,
        `Location: ${errorLocation || 'Unknown'}`,
        `Component: ${this.props.componentName || 'Unknown'}`,
        errorDetails?.componentPath ? `Component Path: ${errorDetails.componentPath}` : '',
        `Message: ${error?.message || 'No message available'}`,
        '',
        'Technical Details:',
        errorInfo?.componentStack || 'No stack trace available',
        '',
        'Browser Info:',
        `User Agent: ${navigator.userAgent}`,
        `App Version: ${localStorage.getItem('app_version') || 'Unknown'}`,
      ].filter(Boolean).join('\n');
      
      navigator.clipboard.writeText(errorReport);
      alert('Error details copied to clipboard!');
    } catch (e) {
      console.error('Failed to copy error details:', e);
      alert('Failed to copy error details. Please check console logs.');
    }
  };
  
  render() {
    if (this.state.hasError) {
      const { errorType, errorLocation, errorDetails } = this.state;
      const isReduxError = errorDetails?.isReduxError;
      const errorId = `ERR_${Date.now().toString(36)}`;
      
      // Enhanced fallback UI with debugging tools
      return (
        <Box sx={{ p: 2, maxWidth: '800px', mx: 'auto', mt: 2 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            {/* Error Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorOutline color="error" sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5" component="h2" color="error">
                Something went wrong
              </Typography>
            </Box>
            
            <Alert severity="error" sx={{ mb: 3 }}>
              An error occurred in the App Root.
              {errorType && <strong> Error: {errorType}</strong>}
            </Alert>
            
            {/* Error Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                <strong>Error ID:</strong> {errorId}
              </Typography>
              
              {errorLocation && (
                <Typography variant="body1" paragraph>
                  <strong>Error Location:</strong> {errorLocation}
                </Typography>
              )}
              
              {errorDetails?.componentPath && (
                <Typography variant="body1" paragraph>
                  <strong>Component Path:</strong> {errorDetails.componentPath}
                </Typography>
              )}
              
              {isReduxError && (
                <Alert severity="warning" sx={{ my: 2 }}>
                  <Typography variant="body2">
                    <strong>Redux Error Detected:</strong> This appears to be an issue with Redux state management.
                    Likely causes include missing action exports or selectors.
                  </Typography>
                </Alert>
              )}
            </Box>
            
            {/* Technical Details (collapsible) */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BugReport sx={{ mr: 1 }} />
                  <Typography>Technical Details</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {this.state.error && (
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="error">
                      Error: {this.state.error.toString()}
                    </Typography>
                    {this.state.errorInfo && (
                      <Typography variant="body2" component="pre" sx={{ mt: 2, overflow: 'auto', maxHeight: '200px', fontSize: '0.75rem' }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
            
            {/* Suggestions for fixing */}
            {isReduxError && (
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FindInPage sx={{ mr: 1 }} />
                    <Typography>Suggested Fixes</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" component="div">
                    <ol>
                      <li>Check if all reducers in Redux slices are properly exported</li>
                      <li>Verify that <code>ensureValidData</code> action is exported from directionSlice.js</li>
                      <li>Ensure no dynamic imports or requires are used in component code</li>
                      <li>Look for typos in imported action names</li>
                    </ol>
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}
            
            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.href = '/'}
                startIcon={<RestartAlt />}
              >
                Go to Home
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={this.copyErrorDetailsToClipboard}
              >
                Copy Error Details
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
