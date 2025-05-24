import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Paper, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  RemoveRedEye as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { getStudentGrades } from '../../features/grades/gradeSlice';
import { getSubjects } from '../../features/subjects/subjectSlice';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const StudentGrades = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { grades, isLoading } = useSelector((state) => state.grades);
  const { subjects } = useSelector((state) => state.subjects);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [gradeStats, setGradeStats] = useState({
    average: 0,
    highestGrade: 0,
    lowestGrade: 0,
    passingRate: 0,
    gradeDistribution: {},
    progressOverTime: [],
  });

  useEffect(() => {
    dispatch(getStudentGrades(user._id));
    dispatch(getSubjects());
  }, [dispatch, user._id]);

  useEffect(() => {
    if (grades && grades.length > 0) {
      applyFilters();
      calculateStats();
    }
  }, [grades, searchTerm, subjectFilter]);

  const applyFilters = () => {
    let filtered = [...grades];
    
    // Apply subject filter
    if (subjectFilter) {
      filtered = filtered.filter((grade) => 
        grade.subject && grade.subject._id === subjectFilter
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((grade) => 
        (grade.subject && grade.subject.name.toLowerCase().includes(search)) ||
        (grade.description && grade.description.toLowerCase().includes(search)) ||
        (grade.teacher && grade.teacher.name && grade.teacher.name.toLowerCase().includes(search))
      );
    }
    
    setFilteredGrades(filtered);
  };

  const calculateStats = () => {
    if (!grades || grades.length === 0) return;

    // Calculate average grade
    const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
    const average = sum / grades.length;
    
    // Calculate highest and lowest grades
    const highestGrade = Math.max(...grades.map(grade => grade.value));
    const lowestGrade = Math.min(...grades.map(grade => grade.value));
    
    // Calculate passing rate (grades >= 50)
    const passingGrades = grades.filter(grade => grade.value >= 50).length;
    const passingRate = (passingGrades / grades.length) * 100;
    
    // Calculate grade distribution
    const distribution = {
      'A (90-100)': grades.filter(grade => grade.value >= 90).length,
      'B (80-89)': grades.filter(grade => grade.value >= 80 && grade.value < 90).length,
      'C (70-79)': grades.filter(grade => grade.value >= 70 && grade.value < 80).length,
      'D (60-69)': grades.filter(grade => grade.value >= 60 && grade.value < 70).length,
      'E (50-59)': grades.filter(grade => grade.value >= 50 && grade.value < 60).length,
      'F (0-49)': grades.filter(grade => grade.value < 50).length,
    };
    
    // Calculate progress over time
    // Group grades by month and calculate average
    const sortedGrades = [...grades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const progressData = [];
    
    // Group grades by month for the chart
    const monthlyData = {};
    sortedGrades.forEach(grade => {
      const monthYear = format(new Date(grade.date), 'MMM yyyy');
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          total: grade.value,
          count: 1
        };
      } else {
        monthlyData[monthYear].total += grade.value;
        monthlyData[monthYear].count += 1;
      }
    });
    
    // Calculate monthly averages
    Object.keys(monthlyData).forEach(month => {
      progressData.push({
        month,
        average: monthlyData[month].total / monthlyData[month].count
      });
    });
    
    setGradeStats({
      average: average.toFixed(2),
      highestGrade,
      lowestGrade,
      passingRate: passingRate.toFixed(2),
      gradeDistribution: distribution,
      progressOverTime: progressData,
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSubjectFilterChange = (event) => {
    setSubjectFilter(event.target.value);
    setPage(0);
  };

  const handleViewGrade = (id) => {
    navigate(`/app/grades/${id}`);
  };

  // Prepare data for Pie chart
  const pieData = {
    labels: Object.keys(gradeStats.gradeDistribution),
    datasets: [
      {
        label: 'Grade Distribution',
        data: Object.values(gradeStats.gradeDistribution),
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

  // Prepare data for Line chart
  const lineData = {
    labels: gradeStats.progressOverTime.map(data => data.month),
    datasets: [
      {
        label: 'Average Grade',
        data: gradeStats.progressOverTime.map(data => data.average),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Grade Progress Over Time',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
      },
    },
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        My Grades
      </Typography>
      
      {/* Stats Cards */}
      {grades && grades.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Overall Average
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {gradeStats.average}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Highest Grade
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {gradeStats.highestGrade}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Lowest Grade
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {gradeStats.lowestGrade}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Passing Rate
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {gradeStats.passingRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Charts Section */}
      {grades && grades.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Grade Distribution
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Pie data={pieData} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Progress Over Time
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line options={lineOptions} data={lineData} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by subject or description"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="subject-filter-label">Filter by Subject</InputLabel>
              <Select
                labelId="subject-filter-label"
                id="subject-filter"
                value={subjectFilter}
                onChange={handleSubjectFilterChange}
                label="Filter by Subject"
              >
                <MenuItem value="">
                  <em>All Subjects</em>
                </MenuItem>
                {subjects && subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Grades Table - Responsive Design */}
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {/* Mobile Vertical Card Layout */}
          {displayedGrades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((grade) => (
            <Box 
              key={grade._id} 
              sx={{ 
                p: 2, 
                mb: 2, 
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', cursor: 'pointer' }
              }}
              onClick={() => handleViewGrade(grade._id)}
            >
              <Typography variant="h6" gutterBottom>
                {grade.subject?.name || 'Unknown Subject'}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Grade:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" sx={{
                    fontWeight: 'bold',
                    color: grade.value >= 60 ? 'success.main' : 'error.main'
                  }}>
                    {grade.value}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Date:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    {grade.date ? format(new Date(grade.date), 'dd/MM/yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Teacher:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    {grade.teacher?.name || 'Unknown'}
                  </Typography>
                </Grid>
                
                {grade.description && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Description:</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        {grade.description}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          ))}
        </Box>
        
        {/* Desktop Table Layout */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGrades.length > 0 ? (
                filteredGrades
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((grade) => (
                    <TableRow 
                      hover 
                      key={grade._id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {grade.subject ? grade.subject.name : 'Unknown Subject'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: grade.value >= 50 ? 'success.main' : 'error.main',
                            }}
                          >
                            {grade.value}
                          </Typography>
                          {grade.value >= 90 ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : grade.value < 50 ? (
                            <TrendingDownIcon color="error" fontSize="small" />
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell>{grade.description || '-'}</TableCell>
                      <TableCell>{grade.teacher ? grade.teacher.name : 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(grade.date), 'PP')}</TableCell>
                      <TableCell>
                        <Chip 
                          label={grade.value >= 50 ? 'Passed' : 'Failed'} 
                          color={grade.value >= 50 ? 'success' : 'error'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<ViewIcon />}
                          label="View"
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewGrade(grade._id)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    {grades && grades.length > 0 ? 'No grades match the filter criteria.' : 'No grades found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Unified pagination for both mobile and desktop views */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={displayedGrades.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default StudentGrades;
