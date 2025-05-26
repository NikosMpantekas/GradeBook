import axios from 'axios';

const API_URL = '/api/ratings/';

// Create a new rating period
const createRatingPeriod = async (periodData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(API_URL + 'periods', periodData, config);
  return response.data;
};

// Get all rating periods (admin)
const getRatingPeriods = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_URL + 'periods', config);
  return response.data;
};

// Get a single rating period
const getRatingPeriod = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_URL + 'periods/' + id, config);
  return response.data;
};

// Update a rating period
const updateRatingPeriod = async (id, periodData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(API_URL + 'periods/' + id, periodData, config);
  return response.data;
};

// Delete a rating period
const deleteRatingPeriod = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.delete(API_URL + 'periods/' + id, config);
  return response.data;
};

// Create a new rating question
const createRatingQuestion = async (questionData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(API_URL + 'questions', questionData, config);
  return response.data;
};

// Get questions for a rating period
const getRatingQuestions = async (periodId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_URL + 'questions/' + periodId, config);
  return response.data;
};

// Update a rating question
const updateRatingQuestion = async (id, questionData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(API_URL + 'questions/' + id, questionData, config);
  return response.data;
};

// Delete a rating question
const deleteRatingQuestion = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.delete(API_URL + 'questions/' + id, config);
  return response.data;
};

// Submit a rating (student)
const submitRating = async (ratingData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(API_URL + 'submit', ratingData, config);
  return response.data;
};

// Get active rating periods (student)
const getActiveRatingPeriods = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_URL + 'active', config);
  return response.data;
};

// Get ratable teachers and subjects (student)
const getRatingTargets = async (periodId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(API_URL + 'targets?periodId=' + periodId, config);
  return response.data;
};

// Get rating statistics
const getRatingStats = async (targetType, targetId, periodId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  let url = API_URL + 'stats/' + targetType + '/' + targetId;
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

  const response = await axios.get(API_URL + 'check/' + periodId + '/' + targetType + '/' + targetId, config);
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
  updateRatingQuestion,
  deleteRatingQuestion,
  submitRating,
  getActiveRatingPeriods,
  getRatingTargets,
  getRatingStats,
  checkStudentRating
};

export default ratingService;
