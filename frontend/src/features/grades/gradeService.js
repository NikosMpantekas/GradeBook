import axios from 'axios';

const API_URL = '/api/grades/';

// Create new grade
const createGrade = async (gradeData, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // Make sure value is properly parsed as number
  if (gradeData.value && typeof gradeData.value === 'string') {
    gradeData.value = parseInt(gradeData.value, 10);
  }

  // Add timestamp to ensure fresh request
  const timestamp = new Date().getTime();
  const url = `${API_URL}?_t=${timestamp}`;
  
  console.log(`Attempting to save grade with data to ${url}:`, JSON.stringify(gradeData));
  
  try {
    const response = await axios.post(url, gradeData, config);
    console.log('Grade saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving grade:', error.response?.data?.message || error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.error('Permission denied - this might be an authentication issue');
      throw new Error('Permission denied - you may not have rights to create grades');
    } else if (error.response?.status === 400) {
      const errorMsg = error.response.data.message || 'Validation error creating grade';
      console.error('Validation error:', errorMsg);
      throw new Error(errorMsg);
    } else if (error.response?.status === 500) {
      console.error('Server error saving grade');
      throw new Error('Server error - please try again later');
    }
    throw error;
  }
};

// Get all grades (admin only)
const getAllGrades = async (token) => {
  try {
    console.log('Admin fetching all grades');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const response = await axios.get(`${API_URL}?_t=${timestamp}`, config);

    console.log(`API returned ${response.data?.length || 0} total grades for admin`);
    
    // Ensure we always return an array
    if (!Array.isArray(response.data)) {
      console.warn('API did not return an array for admin grades, defaulting to empty array');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in getAllGrades:', error?.response?.status || 'No status', 
      error?.response?.data?.message || error.message);
    throw error; // Let the slice handle the error
  }
};

// Get student grades
const getStudentGrades = async (studentId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'student/' + studentId, config);

  return response.data;
};

// Get grades by subject
const getGradesBySubject = async (subjectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'subject/' + subjectId, config);

  return response.data;
};

// Get grades by teacher
const getGradesByTeacher = async (teacherId, token) => {
  try {
    console.log('Fetching grades for teacher ID:', teacherId);
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const response = await axios.get(`${API_URL}teacher/${teacherId}?_t=${timestamp}`, config);

    console.log(`API returned ${response.data?.length || 0} grades for teacher`);
    
    // Ensure we always return an array
    if (!Array.isArray(response.data)) {
      console.warn('API did not return an array for grades, defaulting to empty array');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in getGradesByTeacher:', error?.response?.status || 'No status', 
      error?.response?.data?.message || error.message);
    throw error; // Let the slice handle the error
  }
};

// Get a specific grade
const getGrade = async (gradeId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + gradeId, config);

  return response.data;
};

// Update grade
const updateGrade = async (gradeId, gradeData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(API_URL + gradeId, gradeData, config);

  return response.data;
};

// Delete grade
const deleteGrade = async (gradeId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + gradeId, config);

  return response.data;
};

const gradeService = {
  createGrade,
  getAllGrades,
  getStudentGrades,
  getGradesBySubject,
  getGradesByTeacher,
  getGrade,
  updateGrade,
  deleteGrade,
};

export default gradeService;
