import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const API_SUBJECTS = `${API_URL}/api/subjects/`;

// Create new subject (admin only)
const createSubject = async (subjectData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_SUBJECTS, subjectData, config);

  return response.data;
};

// Get all subjects with proper authentication and error handling
const getSubjects = async (token) => {
  try {
    // CRITICAL FIX: Always include authentication token
    const config = token ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } : {};
    
    const response = await axios.get(API_SUBJECTS, config);
    
    // CRITICAL FIX: Validate response data
    if (!response.data) {
      console.error('Subject API returned no data');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('Subject API returned non-array data:', typeof response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching subjects:', error.message);
    // Return empty array to prevent UI errors
    return [];
  }
};

// Get subject by ID with proper authentication and error handling
const getSubject = async (subjectId, token) => {
  try {
    // CRITICAL FIX: Always include authentication token
    const config = token ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } : {};
    
    const response = await axios.get(API_SUBJECTS + subjectId, config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subject ${subjectId}:`, error.message);
    return null;
  }
};

// Get subjects by teacher ID
const getSubjectsByTeacher = async (teacherId, token) => {
  try {
    console.log(`Fetching subjects for teacher ID: ${teacherId}`);
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Ensure the URL is correct with proper slashes
    const url = `${API_SUBJECTS}teacher/${teacherId}`;
    console.log(`Making API request to: ${url}`);
    
    const response = await axios.get(url, config);
    console.log(`Received ${response.data.length} subjects for teacher`);
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher subjects:', error.response?.data || error.message);
    throw error;
  }
};

// Get subjects by direction ID
const getSubjectsByDirection = async (directionId) => {
  const response = await axios.get(API_URL + 'direction/' + directionId);

  return response.data;
};

// Update subject (admin only)
const updateSubject = async (subjectId, subjectData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(API_SUBJECTS + subjectId, subjectData, config);

  return response.data;
};

// Delete subject (admin only)
const deleteSubject = async (subjectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_SUBJECTS + subjectId, config);

  return response.data;
};

const subjectService = {
  createSubject,
  getSubjects,
  getSubject,
  getSubjectsByTeacher,
  getSubjectsByDirection,
  updateSubject,
  deleteSubject,
};

export default subjectService;
