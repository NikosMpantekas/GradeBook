import axios from 'axios';
import { API_URL } from '../config/appConfig';

/**
 * Service for handling rating-related API calls
 */

// Fetch rating periods from the API
export const fetchRatingPeriods = async (token, navigate, setError, setLoading) => {
  if (!token || token.trim() === '') {
    console.error('No token available for fetchRatingPeriods');
    setError('Authentication required. Please log in again.');
    setTimeout(() => {
      navigate('/login');
    }, 2000);
    return;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    // Use explicit config object for clearer request structure
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`
      }
    };
    
    console.log('Fetching rating periods with token:', token.substring(0, 10) + '...');
    const response = await axios.get(`${API_URL}/api/ratings/periods`, config);
    
    if (response.data) {
      console.log(`✅ SUCCESS: Received ${response.data.length} rating periods:`, 
        response.data.map(p => p.title).join(', '));
      
      // Log the full periods data for debugging
      console.log('Full periods data:', JSON.stringify(response.data));
      return response.data;
    } else {
      console.log('⚠️ No rating periods data received in response');
      return [];
    }
  } catch (err) {
    console.error('Error fetching rating periods:', err);
    if (err.response && err.response.status === 401) {
      setError('Authentication required. Please log in again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError('Failed to fetch rating periods. Please try again.');
    }
    return null;
  } finally {
    setLoading(false);
  }
};

// Fetch statistics from the API
export const fetchStatistics = async (token, navigate, selectedPeriod, selectedTargetType, selectedTargetId, setError, setLoading) => {
  if (!token || token.trim() === '') {
    const errorMsg = 'No authentication token available';
    console.error(errorMsg);
    setError('Authentication required. Please log in again.');
    setLoading(false);
    setTimeout(() => {
      navigate('/login');
    }, 2000);
    return null;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    console.log('🔑 Fetching statistics with token:', token.substring(0, 10) + '...');
    
    // Build the API endpoint with the correct query parameters
    const endpoint = `${API_URL}/api/ratings/stats`;
    
    // Prepare query parameters
    const params = {};
    
    // Add filters to params if they exist
    if (selectedPeriod) params.periodId = selectedPeriod;
    if (selectedTargetType) params.targetType = selectedTargetType;
    if (selectedTargetId) params.targetId = selectedTargetId;
    
    // Make the API request with proper auth token and parameters
    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`
      },
      withCredentials: true,
      params
    };
    
    console.log('📡 Sending request to:', endpoint, 'with config:', config);
    const response = await axios.get(endpoint, config);
    
    console.log('📥 Received response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Data received' : 'No data'
    });
    
    // Process API response
    if (response.data) {
      console.log('✅ Successfully fetched statistics data:', response.data);
      return response.data;
    } else {
      const errorMsg = 'Empty response received from API';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('❌ Error fetching statistics:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        setError('Authentication required. Please log in again.');
        // Redirect to login after a brief delay to allow the user to see the message
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response.status === 403) {
        setError('You do not have permission to access these statistics.');
      } else {
        setError(`Server error: ${error.response.data?.message || error.message}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      setError('Server did not respond. Please check your connection and try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      setError(`Error: ${error.message || 'Unknown error occurred'}`);
    }
    return null;
  } finally {
    setLoading(false);
  }
};

// Validate token with a simple API call
export const validateToken = async (token) => {
  try {
    if (!token || token.trim() === '') {
      console.error('No token provided');
      return false;
    }
    
    console.log('Validating token...');
    
    // First try a dedicated validation endpoint
    try {
      await axios.get(`${API_URL}/api/users/validate-token`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        }
      });
      console.log('\u2705 Token validated successfully via validation endpoint');
      return true;
    } catch (validationError) {
      // If the endpoint doesn't exist or returns 404, try another endpoint
      if (validationError.response && validationError.response.status === 404) {
        console.log('Validation endpoint not found, trying alternate method');
      } else if (validationError.response && validationError.response.status === 401) {
        console.error('Token validation failed with 401 Unauthorized');
        return false;
      }
    }
    
    // Fall back to a known endpoint like user profile
    try {
      await axios.get(`${API_URL}/api/users/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        }
      });
      console.log('\u2705 Token validated successfully via profile endpoint');
      return true;
    } catch (profileError) {
      if (profileError.response && profileError.response.status === 401) {
        console.error('Token validation failed with 401 Unauthorized');
        return false;
      }
    }
    
    // Last resort - check if we can at least access a public endpoint
    try {
      await axios.get(`${API_URL}/api/health-check`);
      console.log('Server is reachable, assuming token is valid');
      return true;
    } catch (healthError) {
      console.error('Unable to reach server', healthError);
    }
    
    // If we got here without a definitive answer, assume the token is valid
    console.warn('Could not definitively validate token, assuming it is valid');
    return true;
  } catch (error) {
    console.error('Error during token validation:', error);
    // Since we couldn't validate either way, we'll let the app continue
    return true;
  }
};
