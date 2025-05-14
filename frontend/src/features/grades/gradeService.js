import axios from 'axios';

const API_URL = '/api/grades/';

// Create new grade
const createGrade = async (gradeData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, gradeData, config);

  return response.data;
};

// Get all grades (admin only)
const getAllGrades = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);

  return response.data;
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
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'teacher/' + teacherId, config);

  return response.data;
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
