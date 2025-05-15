import axios from 'axios';

const API_URL = '/api/subjects/';

// Create new subject (admin only)
const createSubject = async (subjectData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, subjectData, config);

  return response.data;
};

// Get all subjects
const getSubjects = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

// Get subject by ID
const getSubject = async (subjectId) => {
  const response = await axios.get(API_URL + subjectId);

  return response.data;
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
    const url = `${API_URL}teacher/${teacherId}`;
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

  const response = await axios.put(API_URL + subjectId, subjectData, config);

  return response.data;
};

// Delete subject (admin only)
const deleteSubject = async (subjectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + subjectId, config);

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
