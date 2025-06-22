// Test script to verify the new class-based student endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test the new endpoints (you'll need to replace with actual teacher token)
const testClassBasedEndpoints = async () => {
  console.log('🧪 Testing Class-Based Student Endpoints\n');
  
  // You'll need to get a valid teacher token first
  const teacherToken = 'YOUR_TEACHER_TOKEN_HERE';
  
  if (teacherToken === 'YOUR_TEACHER_TOKEN_HERE') {
    console.log('❌ Please update this script with a valid teacher token');
    console.log('   1. Login as a teacher in the frontend');
    console.log('   2. Copy the token from localStorage or browser dev tools');
    console.log('   3. Replace YOUR_TEACHER_TOKEN_HERE with the actual token');
    return;
  }
  
  const config = {
    headers: {
      'Authorization': `Bearer ${teacherToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Test 1: Get all students for teacher's classes
    console.log('📚 Test 1: Getting all students for teacher classes...');
    const studentsResponse = await axios.get(`${API_BASE}/api/students/teacher/classes`, config);
    console.log(`✅ Success: Found ${studentsResponse.data.length} students`);
    
    if (studentsResponse.data.length > 0) {
      const firstStudent = studentsResponse.data[0];
      console.log(`   First student: ${firstStudent.name}`);
      console.log(`   Classes: ${firstStudent.classes?.map(c => `${c.className} (${c.subject})`).join(', ') || 'No class info'}`);
    }
    
    // Test 2: Get students by subject for teacher's classes
    console.log('\n📖 Test 2: Getting students for teacher classes by subject...');
    
    // You'll need to replace with an actual subject ID
    const subjectId = 'YOUR_SUBJECT_ID_HERE';
    
    if (subjectId === 'YOUR_SUBJECT_ID_HERE') {
      console.log('⚠️  Skipping subject test - please provide a valid subject ID');
    } else {
      const subjectStudentsResponse = await axios.get(`${API_BASE}/api/students/teacher/subject/${subjectId}`, config);
      console.log(`✅ Success: Found ${subjectStudentsResponse.data.length} students for subject`);
      
      if (subjectStudentsResponse.data.length > 0) {
        const firstStudent = subjectStudentsResponse.data[0];
        console.log(`   First student: ${firstStudent.name}`);
        console.log(`   Classes: ${firstStudent.classes?.map(c => `${c.className} (${c.subject})`).join(', ') || 'No class info'}`);
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

// Run the test
testClassBasedEndpoints();
