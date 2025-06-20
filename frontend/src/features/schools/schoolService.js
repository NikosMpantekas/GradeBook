import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const API_SCHOOLS = `${API_URL}/api/schools`;

// Create new school (admin only)
const createSchool = async (schoolData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_SCHOOLS, schoolData, config);

  return response.data;
};

// Get all schools
const getSchools = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_SCHOOLS, config);
  return response.data;
};

// Get school by ID
const getSchool = async (schoolId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_SCHOOLS}/${schoolId}`, config);
  return response.data;
};

// Update school (admin only)
const updateSchool = async (schoolId, schoolData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(`${API_SCHOOLS}/${schoolId}`, schoolData, config);

  return response.data;
};

// Delete school (admin only)
const deleteSchool = async (schoolId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(`${API_SCHOOLS}/${schoolId}`, config);

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
