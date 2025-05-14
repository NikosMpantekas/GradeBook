import axios from 'axios';

const API_URL = '/api/schools/';

// Create new school (admin only)
const createSchool = async (schoolData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, schoolData, config);

  return response.data;
};

// Get all schools
const getSchools = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

// Get school by ID
const getSchool = async (schoolId) => {
  const response = await axios.get(API_URL + schoolId);

  return response.data;
};

// Update school (admin only)
const updateSchool = async (schoolId, schoolData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(API_URL + schoolId, schoolData, config);

  return response.data;
};

// Delete school (admin only)
const deleteSchool = async (schoolId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + schoolId, config);

  return response.data;
};

const schoolService = {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
};

export default schoolService;
