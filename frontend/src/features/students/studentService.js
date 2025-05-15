import axios from 'axios';

const API_URL = '/api/users/students/';

// Get all students
const getStudents = async (token) => {
  try {
    console.log('Fetching all students');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const url = API_URL;
    console.log(`Making API request to: ${url}`);
    
    const response = await axios.get(url, config);
    console.log(`Received ${response.data.length} students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error.response?.data || error.message);
    throw error;
  }
};

// Get students by subject
const getStudentsBySubject = async (subjectId, token) => {
  try {
    console.log(`Fetching students for subject ID: ${subjectId}`);
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Ensure the URL is correct with proper slashes
    const url = `${API_URL}subject/${subjectId}`;
    console.log(`Making API request to: ${url}`);
    
    const response = await axios.get(url, config);
    console.log(`Received ${response.data.length} students for subject`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching students for subject ${subjectId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Get students by direction
const getStudentsByDirection = async (directionId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_URL}direction/${directionId}`, config);
  return response.data;
};

const studentService = {
  getStudents,
  getStudentsBySubject,
  getStudentsByDirection,
};

export default studentService;
