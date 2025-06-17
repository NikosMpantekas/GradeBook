import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import userReducer from '../features/users/userSlice';
import studentReducer from '../features/students/studentSlice';
import gradeReducer from '../features/grades/gradeSlice';
import notificationReducer from '../features/notifications/notificationSlice';
import schoolReducer from '../features/schools/schoolSlice';
import directionReducer from '../features/directions/directionSlice';
import subjectReducer from '../features/subjects/subjectSlice';
import uiReducer from '../features/ui/uiSlice';
import superAdminReducer from '../features/superadmin/superAdminSlice';
import eventReducer from '../features/events/eventSlice';
import ratingReducer from '../features/ratings/ratingSlice';
import migrationsReducer from '../features/migrations/migrationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    students: studentReducer,
    grades: gradeReducer,
    notifications: notificationReducer,
    schools: schoolReducer,
    directions: directionReducer,
    subjects: subjectReducer,
    ui: uiReducer,
    superAdmin: superAdminReducer,
    events: eventReducer,
    ratings: ratingReducer,
    migrations: migrationsReducer,
  },
});
