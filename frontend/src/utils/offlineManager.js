// Global offline state manager
class OfflineManager {
  constructor() {
    this.isOffline = false;
    this.isBackendOffline = false;
    this.listeners = [];
    this.backendListeners = [];
    this.axiosFailureCount = 0;
    this.backendFailureCount = 0;
    this.lastFailureTime = 0;
  }

  // Add a listener for offline state changes
  addListener(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.isOffline);
  }

  // Remove a listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Add a listener for backend offline state changes
  addBackendListener(callback) {
    this.backendListeners.push(callback);
    // Immediately call with current state
    callback(this.isBackendOffline);
  }

  // Remove a backend listener
  removeBackendListener(callback) {
    this.backendListeners = this.backendListeners.filter(listener => listener !== callback);
  }

  // Set offline state and notify listeners
  setOfflineState(isOffline) {
    if (this.isOffline !== isOffline) {
      this.isOffline = isOffline;
      console.log(`OfflineManager: State changed to ${isOffline ? 'offline' : 'online'}`);
      this.listeners.forEach(listener => listener(isOffline));
    }
  }

  // Set backend offline state and notify listeners
  setBackendOfflineState(isBackendOffline) {
    if (this.isBackendOffline !== isBackendOffline) {
      this.isBackendOffline = isBackendOffline;
      console.log(`OfflineManager: Backend state changed to ${isBackendOffline ? 'offline' : 'online'}`);
      this.backendListeners.forEach(listener => listener(isBackendOffline));
    }
  }

  // Handle axios request failure
  handleRequestFailure(error) {
    const now = Date.now();
    
    console.log('OfflineManager: Request failure detected:', {
      hasResponse: !!error.response,
      status: error.response?.status,
      message: error.message,
      code: error.code,
      url: error.config?.url
    });
    
    // Check if it's a network error (no response) - this could be backend down OR network down
    if (!error.response) {
      this.axiosFailureCount++;
      this.lastFailureTime = now;
      
      console.log(`OfflineManager: Network failure detected (count: ${this.axiosFailureCount})`);
      
      // If we have multiple failures in a short time, check if it's backend-specific
      if (this.axiosFailureCount >= 2) {
        // Check if the failure is to our backend endpoints specifically
        const isBackendEndpoint = error.config?.url?.includes('/api/');
        
        if (isBackendEndpoint) {
          console.log('OfflineManager: Backend-specific network failure - treating as backend offline');
          this.setBackendOfflineState(true);
          this.setOfflineState(false);
          // Reset network failure count since we're treating this as backend issue
          this.axiosFailureCount = 0;
        } else {
          console.log('OfflineManager: General network failure - treating as network offline');
          this.setOfflineState(true);
          this.setBackendOfflineState(false);
        }
      }
    } else {
      // Check if it's a server error (5xx) - backend maintenance
      if (error.response.status >= 500) {
        this.backendFailureCount++;
        console.log(`OfflineManager: Backend server error detected (count: ${this.backendFailureCount})`);
        
        // If we have multiple 5xx errors, consider backend offline
        if (this.backendFailureCount >= 2) {
          console.log('OfflineManager: Setting backend offline state');
          this.setBackendOfflineState(true);
          this.setOfflineState(false);
        }
      } else {
        // Reset failure count for client errors (4xx)
        this.axiosFailureCount = 0;
        this.backendFailureCount = 0;
      }
    }
  }

  // Handle successful request
  handleRequestSuccess() {
    this.axiosFailureCount = 0;
    this.backendFailureCount = 0;
    this.lastFailureTime = 0;
    this.setOfflineState(false);
    this.setBackendOfflineState(false);
  }

  // Check if we should consider the app offline
  shouldBeOffline() {
    return this.isOffline || this.axiosFailureCount >= 2;
  }

  // Reset offline state (for manual retry)
  reset() {
    this.axiosFailureCount = 0;
    this.backendFailureCount = 0;
    this.lastFailureTime = 0;
    this.setOfflineState(false);
    this.setBackendOfflineState(false);
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager; 