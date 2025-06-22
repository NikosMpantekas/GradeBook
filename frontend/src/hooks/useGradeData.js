import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

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

import {
  getStudentsBySubject,
  getStudentsBySubjectForTeacher,
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

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (user && user._id) {
        try {
          console.log('[useGradeData] Fetching initial grades data');
          // Clear grades first to prevent stale data
          dispatch(reset());
          
          // Fetch grades with slight delay to ensure reset takes effect
          setTimeout(() => {
            // If user is admin, fetch all grades, otherwise fetch only teacher's grades
            if (user.role === 'admin') {
              console.log('[useGradeData] Admin user - fetching ALL grades');
              dispatch(getAllGrades());
              
              // Load subjects for admin
              setIsLoadingSubjects(true);
              dispatch(getSubjects())
                .unwrap()
                .then(() => setIsLoadingSubjects(false))
                .catch(() => {
                  setIsLoadingSubjects(false);
                  toast.error('Error loading subjects');
                });
              
              // Load students for admin
              setIsLoadingStudents(true);
              dispatch(getStudents())
                .unwrap()
                .then(() => setIsLoadingStudents(false))
                .catch(() => {
                  setIsLoadingStudents(false);
                  toast.error('Error loading students');
                });
            } else {
              // For teachers, fetch only their assigned grades
              console.log('[useGradeData] Teacher user - fetching teacher grades');
              dispatch(getGradesByTeacher());
              
              // Load subjects for teacher
              setIsLoadingSubjects(true);
              dispatch(getSubjectsByTeacher())
                .unwrap()
                .then(() => setIsLoadingSubjects(false))
                .catch(() => {
                  setIsLoadingSubjects(false);
                  toast.error('Error loading subjects');
                });
              
              // Load students for teacher
              setIsLoadingStudents(true);
              dispatch(getStudentsForTeacher())
                .unwrap()
                .then(() => setIsLoadingStudents(false))
                .catch(() => {
                  setIsLoadingStudents(false);
                  toast.error('Error loading students');
                });
            }
          }, 100);
        } catch (error) {
          console.error('[useGradeData] Error fetching data:', error);
          toast.error('Failed to load grades data. Please try again.');
        }
      }
    };

    fetchData();
  }, [dispatch, user]);

  /**
   * Fetch students by subject ID
   * @param {String} subjectId - Subject ID to filter students by
   */
  const fetchStudentsBySubject = (subjectId) => {
    if (!subjectId) {
      console.log('[useGradeData] No subject ID provided for student fetch');
      return;
    }

    console.log(`[useGradeData] Fetching students for subject: ${subjectId}`);
    setIsLoadingStudents(true);
    
    // Use appropriate action based on user role
    const action = user.role === 'admin'
      ? dispatch(getStudentsBySubject(subjectId))
      : dispatch(getStudentsBySubjectForTeacher(subjectId));
    
    action
      .unwrap()
      .then(() => {
        setIsLoadingStudents(false);
        console.log('[useGradeData] Successfully loaded students for subject');
      })
      .catch((error) => {
        setIsLoadingStudents(false);
        console.error('[useGradeData] Error loading students for subject:', error);
        toast.error('Failed to load students for this subject');
      });
  };

  /**
   * Fetch all available students
   */
  const fetchAllStudents = () => {
    console.log('[useGradeData] Fetching all available students');
    setIsLoadingStudents(true);
    
    // Use appropriate action based on user role
    const action = user.role === 'admin'
      ? dispatch(getStudents())
      : dispatch(getStudentsForTeacher());
    
    action
      .unwrap()
      .then(() => setIsLoadingStudents(false))
      .catch(() => {
        setIsLoadingStudents(false);
        toast.error('Error loading students');
      });
  };

  return {
    isLoadingSubjects,
    isLoadingStudents,
    fetchStudentsBySubject,
    fetchAllStudents
  };
};

export default useGradeData;
