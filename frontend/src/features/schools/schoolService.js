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

// Get all schools (FIXED to only get branch schools, not main clusters)
const getSchools = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      // Explicitly tell the API to filter out cluster/main schools
      branchesOnly: true,
      filterClusters: true
    }
  };

  try {
    console.log('Requesting schools API with branchesOnly filter');
    const response = await axios.get(API_SCHOOLS, config);
    console.log(`API returned ${response.data.length} schools`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    throw error;
  }
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
