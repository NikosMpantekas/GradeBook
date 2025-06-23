import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { getStudentStats } from '../../api/studentStatsAPI';
import StudentGradeDetails from './StudentGradeDetails';

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
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      fetchStudents(searchValue);
    }, 500),
    []
  );

  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch students list
  const fetchStudents = async (search = '') => {
    try {
      setLoading(true);
      setError('');

      console.log('[StudentStats] Fetching students with search:', search);
      const data = await getStudentStats(search);
      
      console.log('[StudentStats] Received students data:', data);
      setStudents(data.students || []);
    } catch (error) {
      console.error('[StudentStats] Error fetching students:', error);
      setError(error.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setDetailsOpen(true);
  };

  // Handle close details dialog
  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedStudent(null);
  };

  // Get role-specific header info
  const getRoleInfo = () => {
    if (user?.role === 'admin') {
      return {
        icon: <AdminIcon fontSize="large" />,
        title: 'Admin Student Statistics',
        description: 'View detailed statistics and progress for all students'
      };
    } else {
      return {
        icon: <SchoolIcon fontSize="large" />,
        title: 'Teacher Student Statistics',
        description: 'View detailed statistics and progress for your students'
      };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
          {roleInfo.icon}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {roleInfo.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {roleInfo.description}
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search students by name or email..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={24} />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && !searchTerm && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Student List */}
      {!loading && students.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No students found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or check if students are assigned to your classes
          </Typography>
        </Box>
      ) : (
        <Paper elevation={3}>
          <List sx={{ bgcolor: 'background.paper' }}>
            {students.map((item, index) => (
              <React.Fragment key={item.student._id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleStudentSelect(item)}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.student.name}
                      secondary={item.student.email || 'No email'}
                    />
                  </ListItemButton>
                </ListItem>
                {index < students.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Student Details Dialog */}
      <StudentGradeDetails
        open={detailsOpen}
        onClose={handleCloseDetails}
        student={selectedStudent}
      />
    </Container>
  );
};

export default StudentStats;
