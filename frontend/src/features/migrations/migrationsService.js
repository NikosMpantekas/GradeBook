import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { getAuthConfig } from '../../utils/authConfig';

// Migrations service
const API_MIGRATIONS = `${API_URL}/api/admin/migrations`;

// Get all available migrations
const getMigrations = async () => {
  const config = getAuthConfig();
  const response = await axios.get(API_MIGRATIONS, config);
  return response.data;
};

// Run a specific migration
const runMigration = async (migrationType) => {
  const config = getAuthConfig();
  const response = await axios.post(`${API_URL}/run`, { migrationType }, config);
  return response.data;
};

const migrationsService = {
  getMigrations,
  runMigration
};

export default migrationsService;
