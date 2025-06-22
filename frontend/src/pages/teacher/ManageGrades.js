import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Snackbar, Alert, Paper, Grid, CircularProgress, Chip } from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';

// Components
import GradeTable from '../../components/grades/GradeTable';
import { EditGradeDialog, DeleteGradeDialog } from '../../components/grades/GradeDialogs';
import ClassBasedFilter from '../../components/grades/ClassBasedFilter';

// Custom hooks
import useGradeData from '../../hooks/useGradeData';
import useGradeDialogs from '../../components/grades/GradeDialogHandlers';

// Utils
import { filterGrades } from '../../utils/gradeFilterUtils';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import DirectionsIcon from '@mui/icons-material/Directions';
import BookIcon from '@mui/icons-material/Book';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * ManageGrades Component
 * Shows a paginated table of grades with class-based filtering options
 */
const ManageGrades = () => {
  console.log('[ManageGrades] Component rendering');
  
  // Redux state
  const { grades, isLoading: isGradesLoading, isError: isGradesError } = useSelector(state => state.grades);
  const { user } = useSelector(state => state.auth);

  // Local state for class-based filtering
  const [filterOptions, setFilterOptions] = useState({
    schoolBranches: [],
    directions: [],
    subjects: []
  });
  const [filters, setFilters] = useState({
    schoolBranch: '',
    direction: '',
    subject: '',
    student: ''
  });
  const [students, setStudents] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Existing state
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Custom hooks
  const {
    isLoadingSubjects,
    isLoadingStudents,
    fetchStudentsBySubject,
    fetchAllStudents
  } = useGradeData(user);

  // Dialog handlers
  const dialogHandlers = useGradeDialogs({ students, subjects: filterOptions.subjects });
  const {
    alertState,
    deleteDialogOpen, 
    gradeToDelete,
    editDialogOpen,
    editGradeData,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleEditClick,
    handleEditChange,
    handleEditSave,
    handleEditCancel,
    handleAlertClose
  } = dialogHandlers;

  // Load filter options when component mounts
  useEffect(() => {
    if (user?.token) {
      loadFilterOptions();
    }
  }, [user]);

  // Load students when filters change
  useEffect(() => {
    if (filters.schoolBranch && filters.direction && filters.subject && user?.token) {
      loadFilteredStudents();
    } else {
      setStudents([]);
      setFilters(prev => ({ ...prev, student: '' }));
    }
  }, [filters.schoolBranch, filters.direction, filters.subject, user]);

  // Set up filtered grades when source data changes
  useEffect(() => {
    console.log('[ManageGrades] Updating filtered grades with class-based filtering');
    console.log('[ManageGrades] Current grades:', grades?.length || 0);
    console.log('[ManageGrades] Current filters:', filters);
    
    if (!grades || !Array.isArray(grades)) {
      console.log('[ManageGrades] No grades available, setting empty array');
      setFilteredGrades([]);
      return;
    }
    
    // Start with all grades - show everything by default
    let filtered = [...grades];
    console.log('[ManageGrades] Starting with all grades:', filtered.length);
    
    // Apply filtering only if filters are actually set
    if (filters.schoolBranch) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(grade => {
        // Check if grade has class information with schoolBranch
        const hasMatchingBranch = grade.class?.schoolBranch === filters.schoolBranch ||
                                  grade.schoolBranch === filters.schoolBranch;
        return hasMatchingBranch;
      });
      console.log(`[ManageGrades] After schoolBranch filter (${filters.schoolBranch}): ${beforeCount} -> ${filtered.length}`);
    }
    
    if (filters.direction) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(grade => {
        const hasMatchingDirection = grade.class?.direction === filters.direction ||
                                     grade.direction === filters.direction;
        return hasMatchingDirection;
      });
      console.log(`[ManageGrades] After direction filter (${filters.direction}): ${beforeCount} -> ${filtered.length}`);
    }
    
    if (filters.subject) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(grade => {
        const hasMatchingSubject = grade.subject === filters.subject ||
                                   grade.class?.subject === filters.subject;
        return hasMatchingSubject;
      });
      console.log(`[ManageGrades] After subject filter (${filters.subject}): ${beforeCount} -> ${filtered.length}`);
    }
    
    if (filters.student) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(grade => grade.student?._id === filters.student);
      console.log(`[ManageGrades] After student filter (${filters.student}): ${beforeCount} -> ${filtered.length}`);
    }
    
    console.log(`[ManageGrades] Final filtered grades count: ${filtered.length}`);
    setFilteredGrades(filtered);
    
    // Reset to first page when filters change
    setPage(0);
  }, [grades, filters]);

  // Load available filter options (school branches, directions, subjects) for the teacher/admin
  const loadFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      const response = await axios.get('/api/students/teacher/filters', config);
      setFilterOptions(response.data);
      console.log(`[ManageGrades] Loaded filter options for ${user.role}:`, response.data);
    } catch (error) {
      console.error('[ManageGrades] Error loading filter options:', error);
      toast.error('Failed to load filter options');
      setFilterOptions({ schoolBranches: [], directions: [], subjects: [] });
    } finally {
      setLoadingFilters(false);
    }
  };

  // Load students based on selected filters using class-based filtering
  const loadFilteredStudents = async () => {
    setLoadingStudents(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      const params = new URLSearchParams({
        schoolBranch: filters.schoolBranch,
        direction: filters.direction,
        subject: filters.subject
      });
      
      const response = await axios.get(`/api/students/teacher/filtered?${params}`, config);
      setStudents(response.data);
      console.log(`[ManageGrades] Loaded ${response.data.length} students for filters:`, filters);
    } catch (error) {
      console.error('[ManageGrades] Error loading filtered students:', error);
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    console.log(`[ManageGrades] ${filterType} filter changed to: ${value}`);
    
    setFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };
      
      // Reset dependent filters when parent filter changes
      if (filterType === 'schoolBranch') {
        newFilters.direction = '';
        newFilters.subject = '';
        newFilters.student = '';
      } else if (filterType === 'direction') {
        newFilters.subject = '';
        newFilters.student = '';
      } else if (filterType === 'subject') {
        newFilters.student = '';
      }
      
      return newFilters;
    });
  };

  // Get available directions based on selected branch
  const getAvailableDirections = () => {
    if (!filters.schoolBranch || !filterOptions.directions) return [];
    return filterOptions.directions.filter(direction => 
      filterOptions.directions.some(dir => dir.value === direction.value)
    );
  };

  // Get available subjects based on selected direction  
  const getAvailableSubjects = () => {
    if (!filters.direction || !filterOptions.subjects) return [];
    return filterOptions.subjects.filter(subject => 
      filterOptions.subjects.some(subj => subj.value === subject.value)
    );
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {user?.role === 'admin' ? (
            <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 40 }} />
          ) : (
            <BookIcon color="primary" sx={{ fontSize: 40 }} />
          )}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Manage Grades
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.role === 'admin' 
                ? 'View, filter, edit, and delete all grades in your school'
                : 'View, filter, edit, and delete grades for your assigned classes'
              }
            </Typography>
          </Box>
        </Box>

        {/* Filter Chips Display */}
        {(filters.schoolBranch || filters.direction || filters.subject || filters.student) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {filters.schoolBranch && (
              <Chip
                icon={<SchoolIcon />}
                label={`Branch: ${filterOptions.schoolBranches?.find(branch => branch.value === filters.schoolBranch)?.label || filters.schoolBranch}`}
                onDelete={() => handleFilterChange('schoolBranch', '')}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.direction && (
              <Chip
                icon={<DirectionsIcon />}
                label={`Direction: ${filterOptions.directions?.find(dir => dir.value === filters.direction)?.label || filters.direction}`}
                onDelete={() => handleFilterChange('direction', '')}
                color="secondary"
                variant="outlined"
              />
            )}
            {filters.subject && (
              <Chip
                icon={<BookIcon />}
                label={`Subject: ${filterOptions.subjects?.find(subj => subj.value === filters.subject)?.label || filters.subject}`}
                onDelete={() => handleFilterChange('subject', '')}
                color="info"
                variant="outlined"
              />
            )}
            {filters.student && (
              <Chip
                icon={<PersonIcon />}
                label={`Student: ${students.find(student => student._id === filters.student)?.name || 'Selected Student'}`}
                onDelete={() => handleFilterChange('student', '')}
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>
      
      {/* Filter Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon /> Class-Based Filters
        </Typography>
        
        <Grid container spacing={3}>
          {/* School Branch Filter */}
          <Grid item xs={12} md={6} lg={3}>
            <ClassBasedFilter
              filterType="schoolBranch"
              value={filters.schoolBranch}
              options={filterOptions.schoolBranches}
              loading={loadingFilters}
              onChange={(value) => handleFilterChange('schoolBranch', value)}
              label="School Branch"
              disabled={loadingFilters}
            />
          </Grid>
          
          {/* Direction Filter */}
          <Grid item xs={12} md={6} lg={3}>
            <ClassBasedFilter
              filterType="direction"
              value={filters.direction}
              options={getAvailableDirections()}
              loading={loadingFilters}
              onChange={(value) => handleFilterChange('direction', value)}
              label="Direction"
              disabled={!filters.schoolBranch || loadingFilters}
            />
          </Grid>
          
          {/* Subject Filter */}
          <Grid item xs={12} md={6} lg={3}>
            <ClassBasedFilter
              filterType="subject"
              value={filters.subject}
              options={getAvailableSubjects()}
              loading={loadingFilters}
              onChange={(value) => handleFilterChange('subject', value)}
              label="Subject"
              disabled={!filters.direction || loadingFilters}
            />
          </Grid>
          
          {/* Student Filter */}
          <Grid item xs={12} md={6} lg={3}>
            <ClassBasedFilter
              filterType="student"
              value={filters.student}
              options={students.map(student => ({ value: student._id, label: student.name }))}
              loading={loadingStudents}
              onChange={(value) => handleFilterChange('student', value)}
              label="Student"
              disabled={!filters.subject || loadingStudents}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Grades Table */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <GradeTable
          filteredGrades={filteredGrades}
          isLoading={isGradesLoading}
          isError={isGradesError}
          grades={grades}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
        />
      </Box>
      
      {/* Dialogs */}
      <EditGradeDialog
        open={editDialogOpen}
        handleClose={handleEditCancel}
        editGradeData={editGradeData}
        handleEditChange={handleEditChange}
        handleEditSave={handleEditSave}
        subjects={filterOptions.subjects}
        user={user}
      />
      
      <DeleteGradeDialog
        open={deleteDialogOpen}
        handleClose={handleDeleteCancel}
        handleConfirm={handleDeleteConfirm}
        gradeToDelete={gradeToDelete}
      />
      
      {/* Alert Snackbar */}
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alertState.severity} 
          elevation={6} 
          variant="filled"
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManageGrades;
