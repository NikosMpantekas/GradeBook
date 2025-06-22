import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Snackbar, Alert, Paper } from '@mui/material';
import { toast } from 'react-toastify';

// Components
import GradeTable from '../../components/grades/GradeTable';
import { EditGradeDialog, DeleteGradeDialog } from '../../components/grades/GradeDialogs';
import GradeFilters from '../../components/grades/GradeFilters';

// Custom hooks
import useGradeData from '../../hooks/useGradeData';
import useGradeDialogs from '../../components/grades/GradeDialogHandlers';

// Utils
import { filterGrades } from '../../utils/gradeFilterUtils';

/**
 * ManageGrades Component
 * Shows a paginated table of grades with filtering options
 */
const ManageGrades = () => {
  console.log('[ManageGrades] Component rendering');
  
  // Redux state
  const { grades, isLoading: isGradesLoading, isError: isGradesError } = useSelector(state => state.grades);
  const { subjects } = useSelector(state => state.subjects);
  const { students } = useSelector(state => state.students);
  const { user } = useSelector(state => state.auth);

  // Local state
  const [subjectFilter, setSubjectFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
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
  const dialogHandlers = useGradeDialogs({ students, subjects });
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

  // Set up filtered grades when source data changes
  useEffect(() => {
    console.log('[ManageGrades] Updating filtered grades');
    
    if (!grades || !Array.isArray(grades)) {
      setFilteredGrades([]);
      return;
    }
    
    const filtered = filterGrades(grades, subjectFilter, studentFilter);
    setFilteredGrades(filtered);
    
    // Reset to first page when filters change
    setPage(0);
  }, [grades, subjectFilter, studentFilter]);

  // Handle filter changes
  const handleSubjectFilterChange = (event) => {
    const newSubjectId = event.target.value;
    console.log(`[ManageGrades] Subject filter changed to: ${newSubjectId}`);
    setSubjectFilter(newSubjectId);
    
    // When subject changes, fetch related students
    if (newSubjectId) {
      fetchStudentsBySubject(newSubjectId);
    } else {
      // If no subject selected, fetch all available students
      fetchAllStudents();
    }
  };

  const handleStudentFilterChange = (event) => {
    const newStudentId = event.target.value;
    console.log(`[ManageGrades] Student filter changed to: ${newStudentId}`);
    setStudentFilter(newStudentId);
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
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Grades
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View, filter, edit, and delete grades. Use the filters below to find specific grades.
        </Typography>
      </Paper>
      
      {/* Filter Section */}
      <GradeFilters
        subjectFilter={subjectFilter}
        studentFilter={studentFilter}
        subjects={subjects}
        students={students}
        isLoadingSubjects={isLoadingSubjects}
        isLoadingStudents={isLoadingStudents}
        handleSubjectFilterChange={handleSubjectFilterChange}
        handleStudentFilterChange={handleStudentFilterChange}
      />
      
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
        subjects={subjects}
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
