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
    
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    const endpointUrl = `/api/users/students/subject/${subjectId}?_t=${timestamp}`;
    
    console.log(`[studentService] Making API request to: ${endpointUrl}`);
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: { _t: timestamp } // Prevent caching
    };

    try {
      const response = await axios.get(endpointUrl, config);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('[studentService] Invalid response format - expected array:', response.data);
        return [];
      }
      
      console.log(`[studentService] Successfully received ${response.data.length} students for subject ${subjectId}`);
      
      // Log first student details for debugging
      if (response.data.length > 0) {
        const firstStudent = response.data[0];
        console.log('[studentService] First student details:', {
          id: firstStudent._id,
          name: firstStudent.name,
          direction: firstStudent.direction,
          subjectCount: firstStudent.subjects?.length || 0
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('[studentService] Error fetching students by subject:', {
        message: error.message,
        status: error.response?.status,
        url: endpointUrl,
        response: error.response?.data
      });
      
      // If we get a 404, try the fallback endpoint
      if (error.response?.status === 404) {
        console.log('[studentService] 404 received, trying fallback endpoint...');
        return getStudents(token); // Fall back to getting all students
      }
      
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
    
    // Don't throw error to prevent UI crashes, return empty array instead
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
