import axios from 'axios';

const API_URL = '/api/directions/';

// Create new direction (admin only)
const createDirection = async (directionData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, directionData, config);

  return response.data;
};

// Get all directions - FIXED to include token
const getDirections = async (token) => {
  // CRITICAL FIX: Always include the token in the request
  const config = token ? {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  } : {};

  try {
    const response = await axios.get(API_URL, config);
    
    // CRITICAL FIX: Validate the response data
    if (!response.data) {
      console.error('Direction API returned no data');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('Direction API returned non-array data:', typeof response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching directions:', error.message);
    // Return empty array to prevent UI errors
    return [];
  }
};

// Get direction by ID - FIXED to include token
const getDirection = async (directionId, token) => {
  // CRITICAL FIX: Always include the token in the request
  const config = token ? {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  } : {};

  try {
    const response = await axios.get(API_URL + directionId, config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching direction ${directionId}:`, error.message);
    return null;
  }
};

// Update direction (admin only)
const updateDirection = async (directionId, directionData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(API_URL + directionId, directionData, config);

  return response.data;
};

// Delete direction (admin only)
const deleteDirection = async (directionId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + directionId, config);

  return response.data;
};

const directionService = {
  createDirection,
  getDirections,
  getDirection,
  updateDirection,
  deleteDirection,
};

export default directionService;
