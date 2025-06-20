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
const updateSchool = async (id, schoolData, token) => {
  // Validate inputs
  if (!id) {
    console.error('updateSchool: Missing school ID');
    throw new Error('School ID is required');
  }
  
  if (!token) {
    console.error('updateSchool: Missing authorization token');
    throw new Error('Authorization token is required');
  }
  
  console.log(`Updating school with ID: ${id}`, schoolData);
  
  // Create a clean copy of the data without any _id or id fields (will be in URL)
  const cleanData = { ...schoolData };
  delete cleanData._id;
  delete cleanData.id;
  
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  };

  try {
    // Making the API call with proper formatting
    console.log(`PUT ${API_SCHOOLS}/${id}`, cleanData);
    const response = await axios.put(`${API_SCHOOLS}/${id}`, cleanData, config);
    console.log('School update successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('School update failed:', {
      id,
      data: cleanData,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
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
