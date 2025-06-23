import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  Teaching as TeachingIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { getStudentStats, getStudentDetailedStats, exportStudentStatsToCSV } from '../../api/studentStatsAPI';

// Simple debounce function implementation
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const StudentStats = () => {
  const { user } = useSelector((state) => state.auth);
  const [studentStats, setStudentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      fetchStudentStats(searchValue);
    }, 500),
    []
  );

  // Fetch student statistics
  const fetchStudentStats = async (search = '') => {
    try {
      setSearchLoading(!!search);
      if (!search) setLoading(true);
      setError('');

      console.log('[StudentStats] Fetching student stats with search:', search);
      const data = await getStudentStats(search);
      
      console.log('[StudentStats] Received student stats:', data);
      setStudentStats(data.students || []);
    } catch (error) {
      console.error('[StudentStats] Error fetching student stats:', error);
      setError(error.message || 'Failed to load student statistics');
      setStudentStats([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Fetch detailed student statistics
  const fetchStudentDetails = async (studentId) => {
    try {
      setDetailsLoading(true);
      setDetailsError('');
      
      console.log('[StudentStats] Fetching detailed stats for student:', studentId);
      const data = await getStudentDetailedStats(studentId);
      
      console.log('[StudentStats] Received detailed student stats:', data);
      setStudentDetails(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('[StudentStats] Error fetching detailed student stats:', error);
      setDetailsError(error.message || 'Failed to load detailed student statistics');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle view details
  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    fetchStudentDetails(student.student._id);
  };

  // Handle close details dialog
  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedStudent(null);
    setStudentDetails(null);
    setDetailsError('');
  };

  // Handle export to CSV
  const handleExport = () => {
    try {
      const filename = `student_statistics_${new Date().toISOString().split('T')[0]}.csv`;
      exportStudentStatsToCSV(studentStats, filename);
    } catch (error) {
      console.error('[StudentStats] Export error:', error);
      setError('Failed to export student statistics');
    }
  };

  // Initial load
  useEffect(() => {
    fetchStudentStats();
  }, []);

  // Get role-specific header info
  const getRoleInfo = () => {
    if (user?.role === 'admin') {
      return {
        icon: <AdminIcon color="primary" />,
        title: 'Student Statistics - Admin View',
        subtitle: 'Complete overview of all students in your school',
        color: 'primary'
      };
    } else {
      return {
        icon: <PersonIcon color="secondary" />,
        title: 'Student Statistics - Teacher View', 
        subtitle: 'Statistics for students in your assigned classes',
        color: 'secondary'
      };
    }
  };

  const roleInfo = getRoleInfo();

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            {roleInfo.icon}
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {roleInfo.title}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {roleInfo.subtitle}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Search and Export */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 300 }}
            />
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              disabled={studentStats.length === 0}
            >
              Export CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Summary */}
      {studentStats.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Statistics Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {studentStats.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {Math.round((studentStats.reduce((sum, s) => sum + s.statistics.averageGrade, 0) / studentStats.length) * 100) / 100}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    School Average
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {studentStats.reduce((sum, s) => sum + s.statistics.gradeCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Grades
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {Math.max(...studentStats.map(s => s.statistics.highestGrade))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Best Grade
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Student Statistics Grid */}
      {studentStats.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm ? 'No students found matching your search' : 'No student statistics available'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try adjusting your search criteria' : 'Students will appear here once they have grades assigned'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {studentStats.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.student._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  {/* Student Header */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ bgcolor: roleInfo.color }}>
                      <PersonIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" noWrap>
                        {stat.student.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {stat.student.email}
                      </Typography>
                    </Box>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(stat)}
                        disabled={detailsLoading}
                      >
                        {detailsLoading && selectedStudent?.student._id === stat.student._id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <ViewIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Statistics */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Average Grade
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {stat.statistics.averageGrade || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stat.statistics.averageGrade || 0}
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  {/* Quick Stats */}
                  <Grid container spacing={1} mb={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="info.main">
                          {stat.statistics.gradeCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Grades
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="success.main">
                          {stat.statistics.highestGrade}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Highest
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="error.main">
                          {stat.statistics.lowestGrade}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Lowest
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Subjects */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Subjects ({Object.keys(stat.statistics.subjectStats || {}).length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {Object.entries(stat.statistics.subjectStats || {}).slice(0, 3).map(([subject, stats]) => (
                        <Chip
                          key={subject}
                          label={`${subject}: ${stats.average}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {Object.keys(stat.statistics.subjectStats || {}).length > 3 && (
                        <Chip
                          label={`+${Object.keys(stat.statistics.subjectStats).length - 3} more`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Student Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedStudent?.student.name} - Detailed Statistics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedStudent?.student.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : detailsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : studentDetails ? (
            <Grid container spacing={3}>
              {/* Overview */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={1}>
                      <Typography variant="h4" color="white">
                        {studentDetails.overview.gradeCount}
                      </Typography>
                      <Typography variant="body2" color="white">
                        Total Grades
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={1}>
                      <Typography variant="h4" color="white">
                        {studentDetails.overview.averageGrade}
                      </Typography>
                      <Typography variant="body2" color="white">
                        Average
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Subject Breakdown */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Subject Performance
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell align="center">Grades</TableCell>
                        <TableCell align="center">Average</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(studentDetails.subjectBreakdown || {}).map(([subject, stats]) => (
                        <TableRow key={subject}>
                          <TableCell>{subject}</TableCell>
                          <TableCell align="center">{stats.count}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={stats.average}
                              size="small"
                              color={stats.average >= 70 ? 'success' : stats.average >= 50 ? 'warning' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentStats;
