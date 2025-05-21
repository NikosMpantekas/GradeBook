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

// Get all directions
const getDirections = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

// Get direction by ID
const getDirection = async (directionId) => {
  const response = await axios.get(API_URL + directionId);

  return response.data;
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
