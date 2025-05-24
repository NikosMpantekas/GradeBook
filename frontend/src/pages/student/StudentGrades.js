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
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { getStudentGrades } from '../../features/grades/gradeSlice';
import { getSubjects } from '../../features/subjects/subjectSlice';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const StudentGrades = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user } = useSelector((state) => state.auth);
  const { grades, isLoading } = useSelector((state) => state.grades);
  const { subjects } = useSelector((state) => state.subjects);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [displayedGrades, setDisplayedGrades] = useState([]);
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
    if (!grades) return;
    
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
        (grade.subject && grade.subject.name && grade.subject.name.toLowerCase().includes(search)) ||
        (grade.description && grade.description.toLowerCase().includes(search)) ||
        (grade.teacher && grade.teacher.name && grade.teacher.name.toLowerCase().includes(search))
      );
    }
    
    setFilteredGrades(filtered);
    setDisplayedGrades(filtered);
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
    labels: Object.keys(gradeStats.gradeDistribution || {}),
    datasets: [
      {
        label: 'Grade Distribution',
        data: Object.values(gradeStats.gradeDistribution || {}),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Line chart
  const lineData = {
    labels: gradeStats.progressOverTime ? gradeStats.progressOverTime.map(item => item.month) : [],
    datasets: [
      {
        label: 'Average Grade',
        data: gradeStats.progressOverTime ? gradeStats.progressOverTime.map(item => item.average) : [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
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
        display: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        My Grades
      </Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : displayedGrades.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No grades found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            There are no grades available for your account or with the current filters.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Grade Stats Summary Cards - MOBILE OPTIMIZED */}
          {grades && grades.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  p: { xs: 1, sm: 2 }, // Smaller padding on mobile
                }}>
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Average
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' } 
                      }}
                    >
                      {gradeStats.average}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  height: '100%', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  p: { xs: 1, sm: 2 }, // Smaller padding on mobile
                }}>
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Highest
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'success.main',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}
                    >
                      {gradeStats.highestGrade}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  p: { xs: 1, sm: 2 }, // Smaller padding on mobile
                }}>
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Lowest
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'error.main',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}
                    >
                      {gradeStats.lowestGrade}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  p: { xs: 1, sm: 2 }, // Smaller padding on mobile
                }}>
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Passing Rate
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'info.main',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}
                    >
                      {gradeStats.passingRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          
          {/* Charts Section - MOBILE OPTIMIZED */}
          {grades && grades.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: { xs: 1, sm: 2 }, 
                    borderRadius: 2, 
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 1, 
                      fontWeight: 'bold',
                      fontSize: { xs: '0.9rem', sm: '1.25rem' }
                    }}
                  >
                    Grade Distribution
                  </Typography>
                  <Box sx={{ 
                    height: { xs: 200, sm: 300 }, 
                    display: 'flex', 
                    justifyContent: 'center',
                    width: '100%',
                    margin: '0 auto'
                  }}>
                    <Pie data={pieData} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: { xs: 1, sm: 2 }, 
                    borderRadius: 2, 
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 1, 
                      fontWeight: 'bold',
                      fontSize: { xs: '0.9rem', sm: '1.25rem' }
                    }}
                  >
                    Progress Over Time
                  </Typography>
                  <Box sx={{ 
                    height: { xs: 200, sm: 300 },
                    width: '100%'
                  }}>
                    <Line options={lineOptions} data={lineData} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* Filters Section - MOBILE OPTIMIZED */}
          <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by subject or description"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" size={isMobile ? "small" : "medium"}>
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
          
          {/* Grades Table - COMPLETELY REDESIGNED MOBILE VIEW */}
          <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
            {/* Mobile View */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {displayedGrades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((grade) => (
                <Card 
                  key={grade._id} 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'visible',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-2px)', 
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
                      cursor: 'pointer' 
                    }
                  }}
                  onClick={() => handleViewGrade(grade._id)}
                >
                  <Box sx={{ 
                    p: 1, 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {grade.subject && typeof grade.subject === 'object' ? grade.subject.name : 'Unknown Subject'}
                    </Typography>
                    <Chip 
                      label={grade.value} 
                      sx={{
                        bgcolor: 
                          grade.value >= 90 ? 'success.main' : 
                          grade.value >= 50 ? 'warning.main' : 
                          'error.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        height: 24
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1, 
                            lineHeight: 1.3,
                            fontSize: '0.8rem',
                            color: 'text.secondary'
                          }}
                        >
                          {grade.description || 'No description provided'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ fontSize: '0.8rem', mr: 0.5, color: 'text.secondary' }} />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {grade.date ? format(new Date(grade.date), 'MM/dd/yyyy') : 'No date'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ fontSize: '0.8rem', mr: 0.5, color: 'text.secondary' }} />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {grade.teacher?.name || 'Unknown'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sx={{ mt: 1 }}>
                        <Chip 
                          icon={<VisibilityIcon sx={{ fontSize: '0.8rem' }} />}
                          label="View Details" 
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 24 }}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              ))}
            </Box>
            
            {/* Desktop Table Layout */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedGrades.length > 0 ? (
                    displayedGrades
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((grade) => (
                        <TableRow 
                          key={grade._id}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            {grade.subject && typeof grade.subject === 'object' ? grade.subject.name : 'Unknown Subject'}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: 
                                    grade.value >= 90 ? 'success.main' : 
                                    grade.value < 50 ? 'error.main' : 
                                    'text.primary'
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
                              icon={<VisibilityIcon />}
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
                      <TableCell colSpan={7} align="center">
                        No grades found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredGrades.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ 
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: { xs: '0.7rem', sm: '0.875rem' }
                },
                '.MuiTablePagination-select': {
                  fontSize: { xs: '0.7rem', sm: '0.875rem' }
                }
              }}
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default StudentGrades;
