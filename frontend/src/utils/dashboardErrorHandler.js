/**
 * Dashboard Error Handler
 * Provides comprehensive error protection and null-safe DOM operations
 */
import React from 'react';

/**
 * Safe event handler wrapper to prevent null access errors
 */
export const safeEventHandler = (handler, fallback = () => {}) => {
  return (event) => {
    try {
      // Defensive checks for event and event.target
      if (!event || event === null || event === undefined) {
        console.warn('[SAFE_EVENT] Event is null/undefined, using fallback');
        return fallback(event);
      }

      // Check for scrollTop access specifically
      if (event.target && typeof event.target === 'object') {
        // Add scrollTop protection if accessed
        const originalTarget = event.target;
        if (originalTarget.scrollTop !== undefined && originalTarget.scrollTop === null) {
          console.warn('[SAFE_EVENT] ScrollTop is null, setting to 0');
          originalTarget.scrollTop = 0;
        }
      }

      return handler(event);
    } catch (error) {
      console.error('[SAFE_EVENT] Error in event handler:', error);
      console.error('[SAFE_EVENT] Event object:', event);
      console.error('[SAFE_EVENT] Stack trace:', error.stack);
      return fallback(event);
    }
  };
};

/**
 * Safe DOM element access with null checks
 */
export const safeDOMAccess = (element, property, defaultValue = null) => {
  try {
    if (!element || element === null || element === undefined) {
      console.warn(`[SAFE_DOM] Element is null, returning default for property: ${property}`);
      return defaultValue;
    }

    if (!(property in element)) {
      console.warn(`[SAFE_DOM] Property '${property}' not found in element, returning default`);
      return defaultValue;
    }

    const value = element[property];
    if (value === null || value === undefined) {
      console.warn(`[SAFE_DOM] Property '${property}' is null/undefined, returning default`);
      return defaultValue;
    }

    return value;
  } catch (error) {
    console.error(`[SAFE_DOM] Error accessing property '${property}':`, error);
    return defaultValue;
  }
};

/**
 * Safe scroll position getter
 */
export const getSafeScrollTop = (element) => {
  return safeDOMAccess(element, 'scrollTop', 0);
};

/**
 * Safe scroll position setter
 */
export const setSafeScrollTop = (element, value) => {
  try {
    if (!element || element === null || element === undefined) {
      console.warn('[SAFE_SCROLL] Cannot set scrollTop on null element');
      return false;
    }

    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('[SAFE_SCROLL] Invalid scrollTop value, using 0');
      value = 0;
    }

    element.scrollTop = value;
    return true;
  } catch (error) {
    console.error('[SAFE_SCROLL] Error setting scrollTop:', error);
    return false;
  }
};

/**
 * Enhanced error boundary for dashboard components
 */
export class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Safe logging with null checks
    console.error('[DASHBOARD_ERROR_BOUNDARY] Caught error:', error || 'Unknown error');
    console.error('[DASHBOARD_ERROR_BOUNDARY] Error info:', errorInfo || 'No error info');
    
    // Log specific scrollTop errors
    if (error && error.message && error.message.includes('scrollTop')) {
      console.error('[DASHBOARD_ERROR_BOUNDARY] ScrollTop error detected!');
      console.error('[DASHBOARD_ERROR_BOUNDARY] Error message:', error.message);
      console.error('[DASHBOARD_ERROR_BOUNDARY] Stack trace:', error.stack || 'No stack trace');
    }

    // Safely set state with null checks
    this.setState({
      error: error || new Error('Unknown error'),
      errorInfo: errorInfo || { componentStack: 'No component stack available' }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          border: '1px solid #ff5252',
          borderRadius: '8px',
          backgroundColor: '#ffebee'
        }}>
          <h3 style={{ color: '#d32f2f', marginBottom: '10px' }}>
            Dashboard Component Error
          </h3>
          <p style={{ color: '#666', marginBottom: '10px' }}>
            An error occurred in the dashboard component. This has been logged for debugging.
          </p>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', color: '#1976d2' }}>
              Error Details (for developers)
            </summary>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              marginTop: '10px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// React import is now at the top of the file
