import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  AssignmentTurnedIn as AssignmentIcon,
  PeopleAlt as StudentsIcon,
  MenuBook as SubjectsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { getGradesByTeacher } from '../../features/grades/gradeSlice';
import { getSubjectsByTeacher } from '../../features/subjects/subjectSlice';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const TeacherGrades = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { grades, isLoading: gradesLoading } = useSelector((state) => state.grades);
  const { subjects, isLoading: subjectsLoading } = useSelector((state) => state.subjects);
  
  const [stats, setStats] = useState({
    totalGrades: 0,
    totalStudents: 0,
    totalSubjects: 0,
    averageGrade: 0,
    passingRate: 0,
    gradeDistribution: {},
    subjectAverages: {},
  });

  useEffect(() => {
    dispatch(getGradesByTeacher(user._id));
    dispatch(getSubjectsByTeacher(user._id));
  }, [dispatch, user._id]);

  useEffect(() => {
    if (grades && grades.length > 0) {
      calculateStats();
    }
  }, [grades, subjects]);

  const calculateStats = () => {
    // Total grades
    const totalGrades = grades.length;
    
    // Total unique students
    const uniqueStudents = new Set(grades.map(grade => grade.student?._id));
    const totalStudents = uniqueStudents.size;
    
    // Total subjects
    const totalSubjects = subjects ? subjects.length : 0;
    
    // Average grade
    const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
    const averageGrade = sum / totalGrades;
    
    // Passing rate
    const passingGrades = grades.filter(grade => grade.value >= 50).length;
    const passingRate = (passingGrades / totalGrades) * 100;
    
    // Grade distribution
    const distribution = {
      'A (90-100)': grades.filter(grade => grade.value >= 90).length,
      'B (80-89)': grades.filter(grade => grade.value >= 80 && grade.value < 90).length,
      'C (70-79)': grades.filter(grade => grade.value >= 70 && grade.value < 80).length,
      'D (60-69)': grades.filter(grade => grade.value >= 60 && grade.value < 70).length,
      'E (50-59)': grades.filter(grade => grade.value >= 50 && grade.value < 60).length,
      'F (0-49)': grades.filter(grade => grade.value < 50).length,
    };
    
    // Subject averages
    const subjectGrades = {};
    const subjectAverages = {};
    
    grades.forEach(grade => {
      const subjectId = grade.subject?._id;
      const subjectName = grade.subject?.name || 'Unknown';
      
      if (!subjectGrades[subjectId]) {
        subjectGrades[subjectId] = {
          name: subjectName,
          grades: [],
        };
      }
      
      subjectGrades[subjectId].grades.push(grade.value);
    });
    
    Object.keys(subjectGrades).forEach(subjectId => {
      const subject = subjectGrades[subjectId];
      const sum = subject.grades.reduce((acc, value) => acc + value, 0);
      const average = sum / subject.grades.length;
      
      subjectAverages[subject.name] = average;
    });
    
    setStats({
      totalGrades,
      totalStudents,
      totalSubjects,
      averageGrade: averageGrade.toFixed(2),
      passingRate: passingRate.toFixed(2),
      gradeDistribution: distribution,
      subjectAverages,
    });
  };

  // Prepare data for Pie chart
  const pieData = {
    labels: Object.keys(stats.gradeDistribution),
    datasets: [
      {
        label: 'Grade Distribution',
        data: Object.values(stats.gradeDistribution),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Bar chart
  const barData = {
    labels: Object.keys(stats.subjectAverages),
    datasets: [
      {
        label: 'Average Grade by Subject',
        data: Object.values(stats.subjectAverages),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Average Grades by Subject',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
      },
    },
  };

  const handleManageGrades = () => {
    navigate('/app/teacher/grades/manage');
  };

  const handleCreateGrade = () => {
    navigate('/app/teacher/grades/create');
  };

  const handleManageNotifications = () => {
    navigate('/app/teacher/notifications');
  };

  const handleCreateNotification = () => {
    navigate('/app/teacher/notifications/create');
  };

  if (gradesLoading || subjectsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Teacher Dashboard
      </Typography>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateGrade}
            sx={{ py: 1.5 }}
          >
            Add New Grade
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={handleManageGrades}
            sx={{ py: 1.5 }}
          >
            Manage Grades
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateNotification}
            sx={{ py: 1.5 }}
          >
            Create Notification
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={handleManageNotifications}
            sx={{ py: 1.5 }}
          >
            View Notifications
          </Button>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Total Grades
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.totalGrades}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StudentsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Students
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.totalStudents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SubjectsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Subjects
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.totalSubjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Average Grade
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.averageGrade}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      {grades && grades.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Grade Distribution
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Pie data={pieData} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Subject Performance
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ height: 300 }}>
                <Bar options={barOptions} data={barData} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No grades have been recorded yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateGrade}
          >
            Add Your First Grade
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default TeacherGrades;
