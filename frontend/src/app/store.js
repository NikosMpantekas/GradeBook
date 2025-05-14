import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import gradeReducer from '../features/grades/gradeSlice';
import notificationReducer from '../features/notifications/notificationSlice';
import schoolReducer from '../features/schools/schoolSlice';
import directionReducer from '../features/directions/directionSlice';
import subjectReducer from '../features/subjects/subjectSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    grades: gradeReducer,
    notifications: notificationReducer,
    schools: schoolReducer,
    directions: directionReducer,
    subjects: subjectReducer,
    ui: uiReducer,
  },
});
