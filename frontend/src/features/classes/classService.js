import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const API_CLASSES = `${API_URL}/api/classes`;

// Get all classes
const getClasses = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_CLASSES, config);
  return response.data;
};

// Create new class
const createClass = async (classData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_CLASSES, classData, config);
  return response.data;
};

// Get class by ID
const getClass = async (classId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_CLASSES}/${classId}`, config);
  return response.data;
};

// Update class
const updateClass = async (classData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    `${API_CLASSES}/${classData.id}`, 
    classData, 
    config
  );
  return response.data;
};

// Delete class
const deleteClass = async (classId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(`${API_CLASSES}/${classId}`, config);
  return response.data;
};

// Get classes by teacher ID
const getClassesByTeacher = async (teacherId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_CLASSES}/teacher/${teacherId}`, config);
  return response.data;
};

const classService = {
  getClasses,
  createClass,
  getClass,
  updateClass,
  deleteClass,
  getClassesByTeacher,
};

export default classService;
