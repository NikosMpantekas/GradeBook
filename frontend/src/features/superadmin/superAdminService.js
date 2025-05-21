import axios from 'axios';

const API_URL = '/api/superadmin/';

// Create new school owner
const createSchoolOwner = async (schoolOwnerData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(
    API_URL + 'create-school-owner', 
    schoolOwnerData, 
    config
  );

  return response.data;
};

// Get all school owners
const getSchoolOwners = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'school-owners', config);

  return response.data;
};

// Get school owner by ID
const getSchoolOwnerById = async (ownerId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + `school-owners/${ownerId}`, config);

  return response.data;
};

// Update school owner status
const updateSchoolOwnerStatus = async (ownerId, statusData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    API_URL + `school-owners/${ownerId}/status`,
    statusData,
    config
  );

  return response.data;
};

// Create first superadmin (initializing the system)
const createFirstSuperAdmin = async (superAdminData) => {
  const response = await axios.post(
    API_URL + 'create-first-superadmin',
    superAdminData
  );

  return response.data;
};

const superAdminService = {
  createSchoolOwner,
  getSchoolOwners,
  getSchoolOwnerById,
  updateSchoolOwnerStatus,
  createFirstSuperAdmin,
};

export default superAdminService;
