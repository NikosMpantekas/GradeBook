import { createSlice } from '@reduxjs/toolkit';

// Check if dark mode is saved in localStorage or use system preference
const getInitialDarkMode = () => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode !== null) {
    return JSON.parse(savedMode);
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Get initial theme color from localStorage or use default blue
const getInitialThemeColor = () => {
  return localStorage.getItem('themeColor') || 'blue';
};

const initialState = {
  darkMode: getInitialDarkMode(),
  themeColor: getInitialThemeColor(),
  sidebarOpen: false,
  loading: false,
  error: null,
  success: false,
  message: '',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
    },
    setThemeColor: (state, action) => {
      state.themeColor = action.payload;
      localStorage.setItem('themeColor', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setSuccess: (state, action) => {
      state.success = action.payload;
      state.loading = false;
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    resetUIState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
  },
});

export const { toggleDarkMode, toggleSidebar, setLoading, setError, setSuccess, setMessage, resetUIState, setThemeColor } = uiSlice.actions;

export default uiSlice.reducer;
