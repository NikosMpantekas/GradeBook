// Utility functions and data processing for CreateGradeSimple
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Handle axios errors consistently across the application
 * @param {Error} error - The axios error object
 * @param {string} source - Source function name for better error tracking
 */
export const handleAxiosError = (error, source = 'unknown') => {
  console.error(`[${source}] API Error:`, error);
  
  if (error.response) {
    // Server responded with error status
    console.error(`Status: ${error.response.status}`);
    console.error('Data:', error.response.data);
    console.error('Headers:', error.response.headers);
    
    // Show appropriate message based on status
    if (error.response.status === 401) {
      toast.error('Authentication error. Please log in again.');
    } else if (error.response.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response.data && error.response.data.message) {
      toast.error(`Error: ${error.response.data.message}`);
    } else {
      toast.error(`Server error (${error.response.status}). Please try again later.`);
    }
  } else if (error.request) {
    // Request made but no response received
    console.error('No response received');
    toast.error('Server not responding. Please check your connection and try again.');
  } else {
    // Error in request setup
    console.error('Error message:', error.message);
    toast.error('Error preparing request. Please try again.');
  }
};

/**
 * Filter subjects by direction ID
 * @param {Array} subjects - Array of subject objects
 * @param {string} directionId - Direction ID to filter by
 * @returns {Array} - Filtered subjects
 */
export const filterSubjectsByDirection = (subjects, directionId) => {
  if (!subjects || !Array.isArray(subjects) || !directionId) {
    return [];
  }
  
  return subjects.filter(subject => {
    return subject.directions && 
           Array.isArray(subject.directions) && 
           subject.directions.some(dir => {
             const dirId = typeof dir === 'object' ? dir._id : dir;
             return dirId === directionId;
           });
  });
};

/**
 * Filter students by subject ID
 * @param {Array} students - Array of student objects
 * @param {string} subjectId - Subject ID to filter by
 * @returns {Array} - Filtered students
 */
export const filterStudentsBySubject = (students, subjectId) => {
  if (!students || !Array.isArray(students) || !subjectId) {
    return [];
  }
  
  return students.filter(student => {
    return student.subjects && 
           Array.isArray(student.subjects) && 
           student.subjects.some(sub => {
             const sId = typeof sub === 'object' ? sub._id : sub;
             return sId === subjectId;
           });
  });
};

/**
 * Extract unique items from teacher classes
 * @param {Array} classes - Array of class objects
 * @returns {Object} - Object containing extracted subjects, directions, and students
 */
export const extractTeacherData = (classes) => {
  if (!classes || !Array.isArray(classes)) {
    console.log('[extractTeacherData] No classes or invalid format provided');
    return { subjects: [], directions: [], students: [] };
  }
  
  console.log('[extractTeacherData] Processing', classes.length, 'classes');
  console.log('[extractTeacherData] Sample class structure:', JSON.stringify(classes[0]));
  
  const subjectsSet = new Set();
  const directionsSet = new Set();
  const studentsSet = new Set();
  const teacherSubjects = [];
  const teacherDirections = [];
  const teacherStudents = [];
  
  classes.forEach(cls => {
    // Extract subject - in new schema, subject might be a string directly
    if (cls.subject) {
      const subjectValue = cls.subject;
      // In the new schema, subject might just be a string like "A"
      const subjectId = typeof subjectValue === 'object' ? subjectValue._id : subjectValue;
      const subjectName = typeof subjectValue === 'object' ? subjectValue.name : subjectValue;
      
      if (!subjectsSet.has(subjectId || subjectName)) {
        subjectsSet.add(subjectId || subjectName);
        teacherSubjects.push({ 
          _id: subjectId || subjectName, 
          name: subjectName 
        });
      }
    }
    
    // Extract direction - in new schema, direction might be a string directly
    if (cls.direction) {
      const directionValue = cls.direction;
      // In the new schema, direction might just be a string like "A"
      const directionId = typeof directionValue === 'object' ? directionValue._id : directionValue;
      const directionName = typeof directionValue === 'object' ? directionValue.name : directionValue;
      
      if (!directionsSet.has(directionId || directionName)) {
        directionsSet.add(directionId || directionName);
        teacherDirections.push({ 
          _id: directionId || directionName, 
          name: directionName 
        });
      }
    }
    
    // Extract students
    if (cls.students && Array.isArray(cls.students)) {
      cls.students.forEach(student => {
        // Student might be just an ID or a full object
        const studentId = typeof student === 'object' ? student._id : student;
        
        if (!studentsSet.has(studentId)) {
          studentsSet.add(studentId);
          
          // If we have a full student object, use it; otherwise create a placeholder
          // The actual student details will need to be fetched separately if needed
          if (typeof student === 'object') {
            teacherStudents.push(student);
          } else {
            // In this case we only have the ID and may need to fetch details later
            teacherStudents.push({ _id: studentId, name: 'Student ' + studentId.substring(0, 5) });
          }
        }
      });
    }
  });
  
  console.log('[extractTeacherData] Extracted:', {
    subjects: teacherSubjects.length,
    directions: teacherDirections.length, 
    students: teacherStudents.length
  });
  
  return {
    subjects: teacherSubjects,
    directions: teacherDirections,
    students: teacherStudents
  };
};
