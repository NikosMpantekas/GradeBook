import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';

// Redux Actions
import {
  getGradesByTeacher,
  getAllGrades,
  reset,
} from '../features/grades/gradeSlice';

import {
  getSubjectsByTeacher,
  getSubjects,
} from '../features/subjects/subjectSlice';

// We keep these imports for initial data loading but will use direct API calls for class-based filtering
import {
  getStudentsForTeacher,
  getStudents,
} from '../features/students/studentSlice';

/**
 * Custom hook for managing grade data fetching
 * @param {Object} user - Current user object from auth state
 * @returns {Object} Loading states for subjects and students
 */
const useGradeData = (user) => {
  const dispatch = useDispatch();
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  /**
   * Fetch subjects using the class-based system directly from API
   */
  const fetchClassBasedSubjects = async () => {
    console.log('[useGradeData] Fetching subjects using class-based API');
    setIsLoadingSubjects(true);
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      // Use the same endpoint as CreateGradeSimple to get filter options including subjects
      const response = await axios.get('/api/students/teacher/filters', config);
      
      const subjects = response.data.subjects || [];
      console.log(`[useGradeData] Loaded ${subjects.length} subjects with class-based API:`, subjects);
      
      // Update Redux state with the received subjects
      dispatch({
        type: user.role === 'admin' ? 'subjects/getAll/fulfilled' : 'subjects/getByTeacher/fulfilled',
        payload: subjects
      });
      
      setIsLoadingSubjects(false);
      return subjects;
      
    } catch (error) {
      setIsLoadingSubjects(false);
      console.error('[useGradeData] Error loading subjects using class-based API:', error);
      toast.error('Error loading subjects');
      return [];
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (user && user._id) {
        try {
          console.log('[useGradeData] Fetching initial grades data');
          // Clear grades first to prevent stale data
          dispatch(reset());
          
          // If user is admin, fetch all grades, otherwise fetch only teacher's grades
          if (user.role === 'admin') {
            console.log('[useGradeData] Admin user - fetching ALL grades');
            dispatch(getAllGrades());
          } else {
            // For teachers, fetch only their assigned grades
            console.log('[useGradeData] Teacher user - fetching teacher grades');
            dispatch(getGradesByTeacher());
          }
          
          // Fetch subjects using the class-based system
          await fetchClassBasedSubjects();
          
          // Fetch initial students
          await fetchAllStudents();
          
        } catch (error) {
          console.error('[useGradeData] Error fetching data:', error);
          toast.error('Failed to load grades data. Please try again.');
        }
      }
    };

    fetchData();
  }, [dispatch, user]);

  /**
   * Fetch students by subject ID using direct API call to support class-based system
   * @param {String} subjectId - Subject ID to filter students by
   */
  const fetchStudentsBySubject = async (subjectId) => {
    if (!subjectId) {
      console.log('[useGradeData] No subject ID provided for student fetch');
      return;
    }

    console.log(`[useGradeData] Fetching students for subject: ${subjectId} using class-based API`);
    setIsLoadingStudents(true);
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      const params = new URLSearchParams({
        subject: subjectId
      });
      
      // Use the new filtered API endpoint that supports the class-based system
      const response = await axios.get(`/api/students/teacher/filtered?${params}`, config);
      
      console.log(`[useGradeData] Loaded ${response.data.length} students with class information:`, response.data);
      
      // Update Redux state with the received students data
      dispatch({
        type: user.role === 'admin' ? 'students/getBySubject/fulfilled' : 'students/getBySubjectForTeacher/fulfilled',
        payload: response.data
      });
      
      setIsLoadingStudents(false);
      
    } catch (error) {
      setIsLoadingStudents(false);
      console.error('[useGradeData] Error loading students for subject using class-based API:', error);
      toast.error('Failed to load students for this subject');
    }
  };

  /**
   * Fetch all available students using direct API call to support class-based system
   */
  const fetchAllStudents = async () => {
    console.log('[useGradeData] Fetching all available students using class-based API');
    setIsLoadingStudents(true);
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      // Use the teacher/filtered API without specific filters to get all available students with class info
      const response = await axios.get('/api/students/teacher/filtered', config);
      
      console.log(`[useGradeData] Loaded ${response.data.length} students with class information:`, response.data);
      
      // Update Redux state with the received students data
      dispatch({
        type: user.role === 'admin' ? 'students/getAll/fulfilled' : 'students/getForTeacher/fulfilled', 
        payload: response.data
      });
      
      setIsLoadingStudents(false);
      
    } catch (error) {
      setIsLoadingStudents(false);
      console.error('[useGradeData] Error loading all students using class-based API:', error);
      toast.error('Error loading students');
    }
  };

  return {
    isLoadingSubjects,
    isLoadingStudents,
    fetchStudentsBySubject,
    fetchAllStudents,
    fetchClassBasedSubjects
  };
};

export default useGradeData;
