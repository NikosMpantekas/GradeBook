import React from 'react';
import { format } from 'date-fns';
import {
  Typography,
  Chip,
  IconButton,
  Card,
  CardContent,
  Box,
  Pagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * GradeTable Component
 * Displays grades in a mobile-friendly card layout with pagination
 */
const GradeTable = ({
  filteredGrades,
  isLoading,
  isError,
  grades,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  handleEditClick,
  handleDeleteClick
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {Array.isArray(filteredGrades) && filteredGrades.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredGrades
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((grade) => {
              if (!grade) return null;
              return (
                <Card key={grade._id} sx={{ mb: 2 }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* Header with student and grade */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        lineHeight: 1.2
                      }}>
                        {grade.student ? (typeof grade.student === 'object' ? grade.student.name : 'Unknown Student') : 'Unknown Student'}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 'bold',
                          color: grade.value >= 50 ? 'success.main' : 'error.main',
                          fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}
                      >
                        {grade.value}
                      </Typography>
                    </Box>

                    {/* Subject and Date */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {grade.subject ? (typeof grade.subject === 'object' ? grade.subject.name : 'Unknown Subject') : 'Unknown Subject'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {grade.date ? format(new Date(grade.date), 'PP') : '-'}
                      </Typography>
                    </Box>

                    {/* Description */}
                    {grade.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        lineHeight: 1.4
                      }}>
                        {grade.description}
                      </Typography>
                    )}

                    {/* Status and Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={grade.value >= 50 ? 'Passed' : 'Failed'}
                        color={grade.value >= 50 ? 'success' : 'error'}
                        size="small"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="primary"
                          aria-label="edit grade"
                          onClick={() => handleEditClick(grade)}
                          size="small"
                          sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                          <EditIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                        </IconButton>
                        <IconButton
                          color="error"
                          aria-label="delete grade"
                          onClick={() => handleDeleteClick(grade)}
                          size="small"
                          sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                          <DeleteIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
        </Box>
      ) : (
        <Card sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              No grades found
            </Typography>
          </Box>
        </Card>
      )}
      
      {/* Pagination */}
      {filteredGrades && filteredGrades.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(filteredGrades.length / rowsPerPage)}
            page={page + 1}
            onChange={(event, value) => handleChangePage(event, value - 1)}
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default GradeTable;
