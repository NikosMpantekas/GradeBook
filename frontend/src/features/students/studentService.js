import axios from 'axios';

const API_URL = '/api/users/students/';

// Get all students
const getStudents = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

// Get students by subject
const getStudentsBySubject = async (subjectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_URL}subject/${subjectId}`, config);
  return response.data;
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
