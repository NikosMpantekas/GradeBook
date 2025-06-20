import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const API_EVENTS = `${API_URL}/api/events/`;

// Get all events (filtered by user role and permissions)
const getEvents = async (token, dateRange = null) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Add date range filtering if provided
  let url = API_EVENTS;
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
  }

  const response = await axios.get(url, config);
  return response.data;
};

// Get event by ID
const getEventById = async (eventId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_EVENTS}${eventId}`, config);
  return response.data;
};

// Create new event
const createEvent = async (eventData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_EVENTS, eventData, config);
  return response.data;
};

// Update event
const updateEvent = async (eventId, eventData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(`${API_EVENTS}${eventId}`, eventData, config);
  return response.data;
};

// Delete event
const deleteEvent = async (eventId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(`${API_EVENTS}${eventId}`, config);
  return response.data;
};

const eventService = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};

export default eventService;
