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
    console.log(`[studentService] Fetching students for subject ID: ${subjectId}`);
    
    if (!subjectId) {
      console.warn('[studentService] No subjectId provided, returning empty array');
      return [];
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: { _t: Date.now() } // Prevent caching
    };

    const url = `/api/users/students/subject/${subjectId}`;
    console.log(`[studentService] Making API request to: ${url}`);
    
    const response = await axios.get(url, config);
    
    // Log response data for debugging
    console.log(`[studentService] Received response for subject ${subjectId}:`, {
      status: response.status,
      dataLength: response.data?.length || 0,
      dataSample: response.data?.[0] || 'No data'
    });
    
    // Ensure we have an array, even if empty
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('[studentService] API returned non-array data for students, defaulting to empty array');
      return [];
    }
    
    // Ensure each student has required fields
    const validStudents = response.data.filter(student => 
      student && 
      student._id && 
      student.name && 
      typeof student.name === 'string'
    );
    
    console.log(`[studentService] Returning ${validStudents.length} valid students`);
    return validStudents;
    
  } catch (error) {
    console.error(`[studentService] Error fetching students for subject ${subjectId}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Return empty array to prevent UI crashes
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
