import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const API_RATINGS = `${API_URL}/api/ratings/`;

// Create a new rating period
const createRatingPeriod = async (periodData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(API_RATINGS + 'periods', periodData, config);
  return response.data;
};

// Get all rating periods (admin)
const getRatingPeriods = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_RATINGS + 'periods', config);
  return response.data;
};

// Get a single rating period
const getRatingPeriod = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_RATINGS + 'periods/' + id, config);
  return response.data;
};

// Update a rating period
const updateRatingPeriod = async (id, periodData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(API_RATINGS + 'periods/' + id, periodData, config);
  return response.data;
};

// Delete a rating period
const deleteRatingPeriod = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.delete(API_RATINGS + 'periods/' + id, config);
  return response.data;
};

// Create a new rating question
const createRatingQuestion = async (questionData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // Debug logs
  console.log('Creating rating question with data:', JSON.stringify(questionData));
  
  try {
    const response = await axios.post(API_RATINGS + 'questions', questionData, config);
    console.log('Rating question created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating rating question:', error.response?.data || error.message);
    throw error;
  }
};

// Get questions for a rating period (admin version)
const getRatingQuestions = async (periodId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  console.log('Admin getting questions for period:', periodId);
  const response = await axios.get(API_RATINGS + 'questions/' + periodId, config);
  return response.data;
};

// Get questions for a rating period (student version)
const getStudentRatingQuestions = async (periodId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  console.log('Student getting questions for period:', periodId);
  const response = await axios.get(API_RATINGS + 'period/' + periodId + '/questions', config);
  return response.data;
};

// Update a rating question
const updateRatingQuestion = async (id, questionData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(API_RATINGS + 'questions/' + id, questionData, config);
  return response.data;
};

// Delete a rating question
const deleteRatingQuestion = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.delete(API_RATINGS + 'questions/' + id, config);
  return response.data;
};

// Submit a rating (student)
const submitRating = async (ratingData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(API_RATINGS + 'submit', ratingData, config);
  return response.data;
};

// Get active rating periods (student)
const getActiveRatingPeriods = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_RATINGS + 'active', config);
  return response.data;
};

// Get ratable teachers and subjects (student)
const getRatingTargets = async (periodId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_RATINGS + 'targets?periodId=' + periodId, config);
  return response.data;
};

// Get rating statistics
const getRatingStats = async (targetType, targetId, periodId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  let url = API_RATINGS + 'stats/' + targetType + '/' + targetId;
  if (periodId) {
    url += '?periodId=' + periodId;
  }

  const response = await axios.get(url, config);
  return response.data;
};

// Check if student has rated a target
const checkStudentRating = async (periodId, targetType, targetId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_RATINGS + 'check/' + periodId + '/' + targetType + '/' + targetId, config);
  return response.data;
};

const ratingService = {
  createRatingPeriod,
  getRatingPeriods,
  getRatingPeriod,
  updateRatingPeriod,
  deleteRatingPeriod,
  createRatingQuestion,
  getRatingQuestions,
  getStudentRatingQuestions,
  updateRatingQuestion,
  deleteRatingQuestion,
  submitRating,
  getActiveRatingPeriods,
  getRatingTargets,
  getRatingStats,
  checkStudentRating
};

export default ratingService;
