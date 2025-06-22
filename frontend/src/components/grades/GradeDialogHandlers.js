import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Redux actions
import { updateGrade, deleteGrade } from '../../features/grades/gradeSlice';

// Utilities
import { resolveGradeEntities } from '../../utils/gradeFilterUtils';

/**
 * Custom hook for handling grade dialog operations
 * @param {Object} params - Configuration parameters
 * @returns {Object} Dialog state and handlers
 */
const useGradeDialogs = ({ students, subjects }) => {
  const dispatch = useDispatch();
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGradeData, setEditGradeData] = useState({
    id: '',
    value: 0,
    description: '',
    student: '',
    subject: '',
    date: new Date(),
    studentName: '',
    subjectName: ''
  });
  
  // Alert state for notifications
  const [alertState, setAlertState] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  /**
   * Open delete dialog for a grade
   * @param {Object} grade - Grade to delete
   */
  const handleDeleteClick = (grade) => {
    console.log('[GradeDialogHandlers] Opening delete dialog for grade:', grade?._id);
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };
  
  /**
   * Confirm grade deletion
   */
  const handleDeleteConfirm = () => {
    if (gradeToDelete && gradeToDelete._id) {
      console.log(`[GradeDialogHandlers] Deleting grade with ID: ${gradeToDelete._id}`);
      
      dispatch(deleteGrade(gradeToDelete._id))
        .unwrap()
        .then(() => {
          console.log('[GradeDialogHandlers] Grade deleted successfully');
          setAlertState({
            open: true,
            message: 'Grade successfully deleted',
            severity: 'success',
          });
        })
        .catch((error) => {
          console.error('[GradeDialogHandlers] Error deleting grade:', error);
          setAlertState({
            open: true,
            message: 'Failed to delete grade. Please try again.',
            severity: 'error',
          });
        });
    }
    setDeleteDialogOpen(false);
    setGradeToDelete(null);
  };
  
  /**
   * Cancel grade deletion
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setGradeToDelete(null);
  };
  
  /**
   * Open edit dialog for a grade
   * @param {Object} grade - Grade to edit
   */
  const handleEditClick = (grade) => {
    console.log(`[GradeDialogHandlers] Opening edit dialog for grade:`, grade);
    
    if (!grade) return;
    
    // Resolve student and subject information
    const { studentId, studentName, subjectId, subjectName } = resolveGradeEntities(grade, students, subjects);
    
    // Set the edit data with all necessary information
    setEditGradeData({
      id: grade._id,
      value: grade.value || 0,
      description: grade.description || '',
      student: studentId,
      subject: subjectId,
      date: grade.date ? new Date(grade.date) : new Date(),
      studentName,
      subjectName,
    });
    
    setEditDialogOpen(true);
  };
  
  /**
   * Handle edit form field changes
   * @param {Object} e - Event object
   */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // Handle different data types appropriately
    let processedValue = value;
    if (name === 'value') {
      // Ensure value is a number between 0 and 100
      const numValue = value === '' ? '' : Math.min(Math.max(parseInt(value, 10) || 0, 0), 100);
      processedValue = numValue;
    } else if (name === 'date') {
      // Handle date picker change
      processedValue = value ? new Date(value) : new Date();
    }
    
    setEditGradeData({
      ...editGradeData,
      [name]: processedValue,
    });
  };
  
  /**
   * Save edited grade
   */
  const handleEditSave = () => {
    if (!editGradeData.id) {
      console.error('[GradeDialogHandlers] Cannot save edit - no grade ID provided');
      return;
    }
    
    // Validate grade value
    if (editGradeData.value === '' || editGradeData.value === null) {
      toast.error('Grade value cannot be empty');
      return;
    }
    
    console.log(`[GradeDialogHandlers] Saving edited grade with ID: ${editGradeData.id}`);
    
    // Prepare the update data
    const gradeUpdateData = {
      id: editGradeData.id,
      gradeData: {
        value: editGradeData.value,
        description: editGradeData.description,
        date: editGradeData.date,
      },
    };
    
    console.log('[GradeDialogHandlers] Grade update data:', gradeUpdateData);
    
    dispatch(updateGrade(gradeUpdateData))
      .unwrap()
      .then(() => {
        console.log('[GradeDialogHandlers] Grade updated successfully');
        setAlertState({
          open: true,
          message: 'Grade updated successfully',
          severity: 'success',
        });
        setEditDialogOpen(false);
      })
      .catch((error) => {
        console.error('[GradeDialogHandlers] Error updating grade:', error);
        setAlertState({
          open: true,
          message: 'Error updating grade. Please try again.',
          severity: 'error',
        });
      });
  };
  
  /**
   * Cancel grade editing
   */
  const handleEditCancel = () => {
    setEditDialogOpen(false);
  };
  
  /**
   * Close alert notification
   */
  const handleAlertClose = () => {
    setAlertState({
      ...alertState,
      open: false,
    });
  };
  
  return {
    // State
    deleteDialogOpen,
    gradeToDelete,
    editDialogOpen,
    editGradeData,
    alertState,
    
    // Handlers
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleEditClick,
    handleEditChange,
    handleEditSave,
    handleEditCancel,
    handleAlertClose
  };
};

export default useGradeDialogs;
