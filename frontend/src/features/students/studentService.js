import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const API_STUDENTS = `${API_URL}/api/users/students`;

// Get all students
const getStudents = async (token) => {
  try {
    console.log('[studentService] Fetching all students');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        _t: new Date().getTime() // Cache buster
      }
    };

    console.log(`[studentService] Making API request to: ${API_STUDENTS}`);
    const response = await axios.get(API_STUDENTS, config);
    
    if (!response.data) {
      console.warn('[studentService] Empty response received');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('[studentService] Invalid response format - expected array:', response.data);
      return [];
    }
    
    console.log(`[studentService] Received ${response.data.length} students`);
    return response.data;
    
  } catch (error) {
    console.error('[studentService] Error fetching students:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    return [];
  }
};

// Get students by subject
const getStudentsBySubject = async (subjectId, token) => {
  if (!subjectId || !token) {
    console.warn('[studentService] Missing required parameters:', { subjectId, hasToken: !!token });
    return [];
  }

  try {
    console.log(`[studentService] Fetching students for subject: ${subjectId}`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        _t: new Date().getTime() // Cache buster
      }
    };

    const endpointUrl = `${API_STUDENTS}/subject/${subjectId}`;
    console.log(`[studentService] Making API request to: ${endpointUrl}`);
    
    const response = await axios.get(endpointUrl, config);
    
    if (!response.data) {
      console.warn('[studentService] Empty response received');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('[studentService] Invalid response format - expected array:', response.data);
      return [];
    }
    
    // Ensure consistent data structure
    const normalizedStudents = response.data.map(student => ({
      ...student,
      // Ensure direction is an object with _id and name
      direction: student.direction ? {
        _id: student.direction._id || student.direction,
        name: student.direction.name || 'Unknown Direction'
      } : { _id: '', name: 'No Direction' },
      // Ensure subjects is an array of objects with _id and name
      subjects: Array.isArray(student.subjects) 
        ? student.subjects.map(subj => ({
            _id: subj?._id || subj,
            name: subj?.name || `Subject ${subj?._id || subj || 'Unknown'}`
          }))
        : []
    }));
    
    console.log(`[studentService] Normalized ${normalizedStudents.length} students for subject ${subjectId}`);
    
    return normalizedStudents;
    
  } catch (error) {
    console.error('[studentService] Error fetching students by subject:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    
    // If we get a 404, try to fetch all students as fallback
    if (error.response?.status === 404) {
      console.log('[studentService] No students found for subject, trying to fetch all students...');
      return getStudents(token);
    }
    
    return [];
  }
};

// Get students by direction
const getStudentsByDirection = async (directionId, token) => {
  if (!directionId || !token) {
    console.warn('[studentService] Missing required parameters for getStudentsByDirection');
    return [];
  }

  try {
    console.log(`[studentService] Fetching students for direction: ${directionId}`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        _t: new Date().getTime() // Cache buster
      }
    };

    const endpointUrl = `${API_URL}/direction/${directionId}`;
    console.log(`[studentService] Making API request to: ${endpointUrl}`);
    
    const response = await axios.get(endpointUrl, config);
    
    if (!response.data) {
      console.warn('[studentService] Empty response received for direction');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('[studentService] Invalid response format - expected array:', response.data);
      return [];
    }
    
    console.log(`[studentService] Received ${response.data.length} students for direction ${directionId}`);
    return response.data;
    
  } catch (error) {
    console.error('[studentService] Error fetching students by direction:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return [];
  }
};

// Get students for teacher's classes
const getStudentsForTeacher = async (token) => {
  if (!token) {
    console.warn('[studentService] No token provided for getStudentsForTeacher');
    return [];
  }

  try {
    console.log('[studentService] Fetching students for teacher classes');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        _t: new Date().getTime() // Cache buster
      }
    };

    const endpointUrl = `${API_URL}/api/students/teacher/classes`;
    console.log(`[studentService] Making API request to: ${endpointUrl}`);
    
    const response = await axios.get(endpointUrl, config);
    
    if (!response.data) {
      console.warn('[studentService] Empty response received for teacher classes');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('[studentService] Invalid response format - expected array:', response.data);
      return [];
    }
    
    console.log(`[studentService] Received ${response.data.length} students for teacher classes`);
    return response.data;
    
  } catch (error) {
    console.error('[studentService] Error fetching students for teacher:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return [];
  }
};

// Get students by subject for teacher's classes
const getStudentsBySubjectForTeacher = async (subjectId, token) => {
  if (!subjectId || !token) {
    console.warn('[studentService] Missing required parameters for getStudentsBySubjectForTeacher:', { subjectId, hasToken: !!token });
    return [];
  }

  try {
    console.log(`[studentService] Fetching students for teacher classes with subject: ${subjectId}`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        _t: new Date().getTime() // Cache buster
      }
    };

    const endpointUrl = `${API_URL}/api/students/teacher/subject/${subjectId}`;
    console.log(`[studentService] Making API request to: ${endpointUrl}`);
    
    const response = await axios.get(endpointUrl, config);
    
    if (!response.data) {
      console.warn('[studentService] Empty response received for teacher subject');
      return [];
    }
    
    if (!Array.isArray(response.data)) {
      console.error('[studentService] Invalid response format - expected array:', response.data);
      return [];
    }
    
    console.log(`[studentService] Received ${response.data.length} students for teacher with subject ${subjectId}`);
    
    // Log class information for debugging
    if (response.data.length > 0 && response.data[0].classes) {
      console.log('[studentService] Students include class context:', 
        response.data.slice(0, 2).map(s => ({
          name: s.name,
          classCount: s.classes?.length || 0,
          subjects: s.classes?.map(c => c.subject) || []
        }))
      );
    }
    
    return response.data;
    
  } catch (error) {
    console.error('[studentService] Error fetching students by subject for teacher:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return [];
  }
};

const studentService = {
  getStudents,
  getStudentsBySubject,
  getStudentsByDirection,
  getStudentsForTeacher,
  getStudentsBySubjectForTeacher,
};

export default studentService;
