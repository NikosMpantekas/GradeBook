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

    // Use the correct API endpoint
    const url = '/api/users/students';
    console.log(`Making API request to: ${url}`);
    
    const response = await axios.get(url, config);
    console.log(`Received ${response.data.length} students`);
    
    // Ensure we always return an array
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('API returned non-array data for students, defaulting to empty array');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error.response?.data || error.message);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
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

    // Fix URL construction to ensure proper format
    const url = `/api/users/students/subject/${subjectId}`;
    console.log(`Making API request to: ${url}`);
    
    const response = await axios.get(url, config);
    console.log(`Received ${response.data.length} students for subject`);
    
    // Ensure we have an array, even if empty
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('API returned non-array data for students, defaulting to empty array');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching students for subject ${subjectId}:`, error.response?.data || error.message);
    // Instead of throwing, return empty array and let component handle fallback
    return [];
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
