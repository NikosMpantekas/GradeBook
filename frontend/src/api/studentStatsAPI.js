import axiosInstance from '../app/axios';

/**
 * Get student statistics with grade averages and counts
 * @param {string} search - Optional search term to filter students by name
 * @returns {Promise} - Promise that resolves to student stats data
 */
export const getStudentStats = async (search = '') => {
  try {
    console.log('[StudentStatsAPI] Fetching student stats with search:', search);
    
    // Log HTTP headers for debugging auth issues
    const currentToken = localStorage.getItem('token');
    console.log('[StudentStatsAPI] Auth token exists:', !!currentToken);
    if (currentToken) {
      console.log('[StudentStatsAPI] Token snippet:', currentToken.substring(0, 20) + '...');
    }
    
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    
    const queryString = params.toString();
    const url = `/api/stats/students${queryString ? `?${queryString}` : ''}`;
    
    console.log('[StudentStatsAPI] Request URL:', url);
    
    // Add request with complete config logging
    console.log('[StudentStatsAPI] Making request with headers:', {
      Authorization: currentToken ? 'Bearer [...]' : undefined,
    });
    
    const response = await axiosInstance.get(url);
    
    console.log('[StudentStatsAPI] Student stats response status:', response.status);
    console.log('[StudentStatsAPI] Student stats response data:', response.data);
    console.log('[StudentStatsAPI] Students found:', response.data?.students?.length || 0);
    
    // Inspect students and their grades if any
    if (response.data?.students?.length > 0) {
      console.log('[StudentStatsAPI] First student sample:', response.data.students[0]);
      console.log('[StudentStatsAPI] Grade counts:', response.data.students.map(s => ({
        name: s.student.name,
        grades: s.statistics.gradeCount
      })));
    } else {
      console.log('[StudentStatsAPI] No students found in response');
    }
    
    return response.data;
  } catch (error) {
    console.error('[StudentStatsAPI] Error fetching student stats:', error);
    console.error('[StudentStatsAPI] Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        headers: error.config.headers ? 'Headers present' : 'No headers'
      } : 'No config'
    });
    
    // Extract meaningful error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch student statistics';
    throw new Error(errorMessage);
  }
};

/**
 * Get detailed statistics for a specific student
 * @param {string} studentId - ID of the student to get detailed stats for
 * @returns {Promise} - Promise that resolves to detailed student stats data
 */
export const getStudentDetailedStats = async (studentId) => {
  try {
    console.log('[StudentStatsAPI] Fetching detailed stats for student:', studentId);
    
    if (!studentId || !studentId.trim()) {
      throw new Error('Student ID is required');
    }
    
    const response = await axiosInstance.get(`/api/stats/students/${studentId}`);
    
    console.log('[StudentStatsAPI] Detailed student stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[StudentStatsAPI] Error fetching detailed student stats:', error);
    
    // Extract meaningful error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch detailed student statistics';
    throw new Error(errorMessage);
  }
};

/**
 * Export student statistics data to CSV format
 * @param {Array} studentStats - Array of student statistics to export
 * @param {string} filename - Optional filename for the exported file
 */
export const exportStudentStatsToCSV = (studentStats, filename = 'student_statistics.csv') => {
  try {
    console.log('[StudentStatsAPI] Exporting student stats to CSV:', studentStats.length, 'students');
    
    if (!studentStats || studentStats.length === 0) {
      throw new Error('No student statistics to export');
    }
    
    // Define CSV headers
    const headers = [
      'Student Name',
      'Student Email', 
      'Total Grades',
      'Average Grade',
      'Highest Grade',
      'Lowest Grade',
      'Subjects'
    ];
    
    // Convert student stats to CSV rows
    const csvRows = studentStats.map(stat => [
      stat.student.name || '',
      stat.student.email || '',
      stat.statistics.gradeCount || 0,
      stat.statistics.averageGrade || 0,
      stat.statistics.highestGrade || 0,
      stat.statistics.lowestGrade || 0,
      Object.keys(stat.statistics.subjectStats || {}).join('; ') || 'None'
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('[StudentStatsAPI] CSV export completed successfully');
    } else {
      throw new Error('CSV export not supported in this browser');
    }
  } catch (error) {
    console.error('[StudentStatsAPI] Error exporting student stats to CSV:', error);
    throw error;
  }
};
