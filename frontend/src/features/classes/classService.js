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
      'Content-Type': 'application/json',
    },
  };
  
  // Use correct ID field (could be id or _id)
  const classId = classData.id || classData._id;
  
  if (!classId) {
    console.error('No class ID provided for update:', classData);
    throw new Error('Class ID is required for update');
  }

  console.log(`Updating class with ID: ${classId}`);
  console.log('Class update data:', classData);
  
  // Create a clean data object without the ID field
  const cleanData = { ...classData };
  delete cleanData.id; // Remove id from payload
  delete cleanData._id; // Remove _id from payload
  
  try {
    const response = await axios.put(
      `${API_CLASSES}/${classId}`, 
      cleanData, 
      config
    );
    
    console.log('Class update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Class update error:', error.response?.data || error.message);
    throw error;
  }
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
