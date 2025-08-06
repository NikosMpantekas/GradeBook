// Global offline state manager
class OfflineManager {
  constructor() {
    this.isOffline = false;
    this.listeners = [];
    this.axiosFailureCount = 0;
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

  // Set offline state and notify listeners
  setOfflineState(isOffline) {
    if (this.isOffline !== isOffline) {
      this.isOffline = isOffline;
      console.log(`OfflineManager: State changed to ${isOffline ? 'offline' : 'online'}`);
      this.listeners.forEach(listener => listener(isOffline));
    }
  }

  // Handle axios request failure
  handleRequestFailure(error) {
    const now = Date.now();
    
    // Check if it's a network error (no response)
    if (!error.response) {
      this.axiosFailureCount++;
      this.lastFailureTime = now;
      
      console.log(`OfflineManager: Network failure detected (count: ${this.axiosFailureCount})`);
      
      // If we have multiple failures in a short time, go offline
      if (this.axiosFailureCount >= 2) {
        this.setOfflineState(true);
      }
    } else {
      // Reset failure count for server errors (4xx, 5xx)
      this.axiosFailureCount = 0;
    }
  }

  // Handle successful request
  handleRequestSuccess() {
    this.axiosFailureCount = 0;
    this.lastFailureTime = 0;
    this.setOfflineState(false);
  }

  // Check if we should consider the app offline
  shouldBeOffline() {
    return this.isOffline || this.axiosFailureCount >= 2;
  }

  // Reset offline state (for manual retry)
  reset() {
    this.axiosFailureCount = 0;
    this.lastFailureTime = 0;
    this.setOfflineState(false);
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager; 