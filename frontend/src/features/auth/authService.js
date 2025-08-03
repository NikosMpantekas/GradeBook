import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// API base URL
console.log('[authService] Using API_URL from environment:', API_URL);

// Helper function for consistent API endpoint handling
const buildEndpointUrl = (path) => {
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

// Common API endpoint paths
const API_USERS = buildEndpointUrl('/api/users');

// Register user
const register = async (userData) => {
  const url = `${API_USERS}/`;
  console.log(`[authService] Registering at: ${url}`);
  const response = await axios.post(url, userData);

  if (response.data) {
    // If the user wants to save credentials, store in localStorage
    if (userData.saveCredentials) {
      localStorage.setItem('user', JSON.stringify(response.data));
    } else {
      // Store in sessionStorage if they don't want to save credentials
      sessionStorage.setItem('user', JSON.stringify(response.data));
    }
  }

  return response.data;
};

// Login user
const login = async (userData) => {
  console.log('Login attempt with:', { email: userData.email, saveCredentials: userData.saveCredentials });
  
  try {
    // Build proper URL using our utility function
    const loginUrl = `${API_USERS}/login`;
    console.log(`[authService] Login attempting at: ${loginUrl}`);
    
    // Make request with proper headers
    const response = await axios({
      method: 'post',
      url: loginUrl,
      data: userData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[authService] Login successful`);
    console.log('Login successful - received data:', JSON.stringify(response.data));

    // Validate token and refresh token
    if (response.data && response.data.token) {
      console.log('Token received - first 10 chars:', response.data.token.substring(0, 10) + '...');
      if (response.data.refreshToken) {
        console.log('Refresh token received. Session will persist longer.');
      }
    } else {
      console.error('No token received in login response!');
    }

    if (response.data) {
      // Make sure the saveCredentials flag is included in the stored data
      const dataToStore = {
        ...response.data,
        saveCredentials: userData.saveCredentials // Ensure this preference is stored with user data
      };
      
      // If the user wants to save credentials, store in localStorage (persists after browser close)
      if (userData.saveCredentials) {
        console.log('Remember me enabled: Storing user data in localStorage for persistent login');
        localStorage.setItem('user', JSON.stringify(dataToStore));
        // Clean up any session storage to avoid conflicts
        sessionStorage.removeItem('user');
      } else {
        // Store in sessionStorage if they don't want to save credentials (cleared after browser close)
        console.log('Remember me disabled: Storing user data in sessionStorage for temporary login');
        sessionStorage.setItem('user', JSON.stringify(dataToStore));
        // Clean up any local storage to avoid conflicts
        localStorage.removeItem('user');
      }
      
      // Double-check that storage worked
      const storedData = userData.saveCredentials 
        ? localStorage.getItem('user') 
        : sessionStorage.getItem('user');
      
      if (!storedData) {
        console.error('Storage verification failed - user data was not properly saved!');
      }
    } else {
      console.error('Failed to store user data!');
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Logout user - completely clears ALL application state with token revocation
const logout = async () => {
  console.log('[SECURITY] Performing secure logout with token revocation');
  
  // Get user data to retrieve refresh token for revocation
  const localUser = localStorage.getItem('user');
  const sessionUser = sessionStorage.getItem('user');
  
  let refreshToken = null;
  try {
    const userData = localUser ? JSON.parse(localUser) : sessionUser ? JSON.parse(sessionUser) : null;
    refreshToken = userData?.refreshToken;
  } catch (error) {
    console.error('[SECURITY] Error parsing stored user data during logout:', error);
  }
  
  // Call backend logout endpoint to revoke refresh token
  if (refreshToken) {
    try {
      console.log('[SECURITY] Revoking refresh token on server...');
      await axios.post(`${API_USERS}/logout`, {
        refreshToken: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // Short timeout for logout
      });
      console.log('[SECURITY] ✅ Refresh token successfully revoked on server');
    } catch (error) {
      console.error('[SECURITY] ❌ Failed to revoke refresh token (continuing with local logout):', error.response?.data || error.message);
      // Continue with local logout even if server revocation fails
    }
  } else {
    console.log('[SECURITY] No refresh token found for revocation');
  }
  
  // Clear auth data
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  // Clear sidebar state
  localStorage.removeItem('sidebarOpen');
  localStorage.removeItem('currentSection');
  
  // Clear app version data
  localStorage.removeItem('app_version');
  localStorage.removeItem('app_version_updated_at');
  
  // Thorough clearing of ALL localStorage items except critical system settings
  const keysToKeep = ['installPromptDismissed']; // Keep minimal PWA settings for UX
  
  // Clear all localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  }
  
  // Clear all sessionStorage
  sessionStorage.clear();
  
  // Clear any cookies that might be used by the app
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
  
  // Force reload to clear React component state and Redux store
  // Using location.replace prevents back-button navigation to the post-login state
  // Use a random cache busting parameter to prevent browser cache issues
  console.log('[SECURITY] Secure logout completed - redirecting to login page');
  const cacheBuster = new Date().getTime();
  window.location.replace(`/login?logout=secure&cache=${cacheBuster}`);
};

// Get user data for current user (to refresh user details)
const getUserData = async (token) => {
  if (!token) {
    console.error('No token provided to getUserData');
    throw new Error('Authentication token is required');
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: 10000
  };

  // Use proper API path
  const meUrl = `${API_USERS}/me`;
  console.log(`[authService] Getting user profile from: ${meUrl}`);
  const response = await axios.get(meUrl, config);
  
  if (response.data) {
    // Update the stored user data but preserve the token
    const updatedUser = {
      ...response.data,
      token: token // Keep the original token
    };
    
    // Update in both storage locations to ensure it's available
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  }
  
  return response.data;
};

// Update profile
const updateProfile = async (userData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  console.log('Updating profile with data:', userData);
  const profileUrl = `${API_USERS}/profile`;
  console.log(`[authService] Updating profile at: ${profileUrl}`);
  const response = await axios.put(profileUrl, userData, config);
  console.log('Profile update response:', response.data);

  if (response.data) {
    // Make sure we update both storage locations to ensure avatar persists
    // Check if data is in localStorage
    const localData = localStorage.getItem('user');
    if (localData) {
      console.log('Updating user data in localStorage with new profile');
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    // Check if data is in sessionStorage
    const sessionData = sessionStorage.getItem('user');
    if (sessionData) {
      console.log('Updating user data in sessionStorage with new profile');
      sessionStorage.setItem('user', JSON.stringify(response.data));
    }
    
    // If no existing storage, use preference from userData
    if (!localData && !sessionData) {
      if (userData.saveCredentials) {
        localStorage.setItem('user', JSON.stringify(response.data));
      } else {
        sessionStorage.setItem('user', JSON.stringify(response.data));
      }
    }
  }

  return response.data;
};

// Automatic token refresh function
const refreshTokenFunction = async (refreshToken) => {
  console.log('[PWA Token Refresh] Attempting to refresh expired access token');
  
  try {
    const response = await axios.post(`${API_USERS}/refresh-token`, {
      refreshToken: refreshToken
    });
    
    if (response.data && response.data.token) {
      console.log('[PWA Token Refresh] Token refreshed successfully');
      return response.data;
    } else {
      throw new Error('Invalid refresh response');
    }
  } catch (error) {
    console.error('[PWA Token Refresh] Refresh failed:', error.response?.data || error.message);
    throw error;
  }
};

// Setup axios response interceptor for automatic token expiration handling with refresh
axios.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (token expiration)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const errorMessage = error.response.data?.message || '';
          
      // Check if it's specifically a token expiration error
      if (errorMessage.includes('expired') || errorMessage.includes('Token expired') || 
          (error.response.data?.error === 'jwt expired')) {
            
        console.log('[PWA Token Refresh] Access token expired, attempting automatic refresh');
        
        // Mark the request as retried to avoid infinite loops
        originalRequest._retry = true;
        
        // Get stored user data to retrieve refresh token
        const localUser = localStorage.getItem('user');
        const sessionUser = sessionStorage.getItem('user');
        
        let user = null;
        let storageType = null;
        
        try {
          if (localUser) {
            user = JSON.parse(localUser);
            storageType = 'localStorage';
          } else if (sessionUser) {
            user = JSON.parse(sessionUser);
            storageType = 'sessionStorage';
          }
        } catch (parseError) {
          console.error('[PWA Token Refresh] Error parsing stored user data:', parseError);
        }
        
        // If we have a refresh token, try to refresh
        if (user && user.refreshToken) {
          try {
            console.log('[PWA Token Refresh] Found refresh token, attempting refresh...');
            
            // Call refresh endpoint
            const refreshResponse = await refreshTokenFunction(user.refreshToken);
            
            // Update stored user data with new tokens from rotation
            const updatedUser = {
              ...user,
              token: refreshResponse.token,
              refreshToken: refreshResponse.refreshToken // Always use new refresh token from rotation
            };
            
            console.log('[PWA Token Refresh] 🔄 Token rotation completed - both access and refresh tokens updated');
            
            // Store updated user data back to the same storage location
            if (storageType === 'localStorage') {
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } else if (storageType === 'sessionStorage') {
              sessionStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            console.log('[PWA Token Refresh] ✅ Tokens refreshed successfully, retrying original request');
            
            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.token}`;
            
            // Retry the original request with the new token
            return axios(originalRequest);
            
          } catch (refreshError) {
            console.warn('[PWA Token Refresh] ❌ Token refresh failed, refresh token may be expired');
            console.error('[PWA Token Refresh] Refresh error details:', refreshError.response?.data || refreshError.message);
            
            // Refresh token is also expired/invalid, need to logout
            // Clear all stored data
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            localStorage.removeItem('sidebarOpen');
            localStorage.removeItem('currentSection');
            
            // Show user-friendly message for PWA context
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const message = isIOS 
              ? 'Your session has fully expired. Please log in again.' 
              : 'Session expired. Redirecting to login...';
                  
            // For PWA/mobile context, give user a moment to see the message
            if ('serviceWorker' in navigator) {
              console.log('[PWA Token Refresh] PWA detected - showing session expired notification');
                  
              // Try to show a notification or alert
              if (window.Notification && Notification.permission === 'granted') {
                new Notification('Session Fully Expired', {
                  body: 'Your login session has fully expired. Please log in again.',
                  icon: '/favicon-192x192.png'
                });
              } else {
                alert(message);
              }
            }
                
            // Redirect to login after a short delay for PWA UX
            setTimeout(() => {
              const cacheBuster = new Date().getTime();
              window.location.replace(`/login?expired=true&cache=${cacheBuster}`);
            }, 1500);
                
            // Return a rejected promise
            return Promise.reject(new Error('Session fully expired - please log in again'));
          }
        } else {
          console.warn('[PWA Token Refresh] No refresh token found, redirecting to login');
          
          // No refresh token available, clear storage and redirect
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          localStorage.removeItem('sidebarOpen');
          localStorage.removeItem('currentSection');
          
          const cacheBuster = new Date().getTime();
          window.location.replace(`/login?expired=true&cache=${cacheBuster}`);
          
          return Promise.reject(new Error('No refresh token available - please log in again'));
        }
      }
    }
        
    // Return other errors as-is
    return Promise.reject(error);
  }
);

// Setup axios request interceptor to validate token before sending requests
axios.interceptors.request.use(
  (config) => {
    // Get token from storage
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
        
    let user = null;
    try {
      if (localUser) {
        user = JSON.parse(localUser);
      } else if (sessionUser) {
        user = JSON.parse(sessionUser);
      }
    } catch (error) {
      console.error('[PWA Token Validation] Error parsing stored user data:', error);
    }
        
    // If we have a user with a token, validate it's not obviously expired
    if (user && user.token) {
      try {
        // Basic JWT structure validation
        const tokenParts = user.token.split('.');
        if (tokenParts.length === 3) {
          // Decode the payload (middle part)
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
              
          // Check if token is expired
          if (payload.exp && payload.exp < currentTime) {
            console.warn('[PWA Token Validation] Token expired before sending request');
                
            // Clear expired token
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
                
            // Redirect to login
            const cacheBuster = new Date().getTime();
            window.location.replace(`/login?expired=true&cache=${cacheBuster}`);
                
            // Cancel the request
            return Promise.reject(new Error('Token expired - redirecting to login'));
          }
        }
      } catch (error) {
        console.error('[PWA Token Validation] Error validating token:', error);
      }
    }
        
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const authService = {
  register,
  login,
  logout,
  getUserData,
  updateProfile,
};

export default authService;
