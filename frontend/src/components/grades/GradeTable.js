import React from 'react';
import { format } from 'date-fns';
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
  IconButton,
  TablePagination,
  Box,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';
import ScheduleIcon from '@mui/icons-material/Schedule';

/**
 * GradeTable Component
 * Displays grades in a table with pagination
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile card layout for grades
  const renderMobileContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="body1">
            Loading grades...
          </Typography>
        </Box>
      );
    }

    if (isError) {
      return (
        <Box py={4} textAlign="center">
          <Typography variant="subtitle1" color="error">
            Error loading grades. Please try again.
          </Typography>
        </Box>
      );
    }

    if (!Array.isArray(filteredGrades) || filteredGrades.length === 0) {
      return (
        <Box py={4} textAlign="center">
          <Typography variant="subtitle1" color="text.secondary">
            {Array.isArray(grades) && grades.length > 0
              ? 'No grades match the filter criteria.'
              : 'No grades found. Add a grade to get started.'}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ px: { xs: 1, sm: 2 } }}>
        {filteredGrades
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((grade) => {
            if (!grade) return null;
            
            return (
              <Card
                key={grade._id}
                sx={{
                  mb: 2,
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: grade.value >= 50 ? 'success.main' : 'error.main',
                      width: 40,
                      height: 40,
                      flexShrink: 0
                    }}>
                      <GradeIcon />
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {grade.value}/10
                        </Typography>
                        <Chip
                          label={grade.value >= 50 ? 'Passed' : 'Failed'}
                          color={grade.value >= 50 ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {grade.student ? (typeof grade.student === 'object' ? grade.student.name : 'Unknown Student') : 'Unknown Student'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BookIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {grade.subject ? (typeof grade.subject === 'object' ? grade.subject.name : 'Unknown Subject') : 'Unknown Subject'}
                        </Typography>
                      </Box>
                      
                      {grade.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.4
                          }}
                        >
                          {grade.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {grade.date ? format(new Date(grade.date), 'PP') : '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditClick(grade)}
                      title="Edit grade"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(grade)}
                      title="Delete grade"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
      </Box>
    );
  };

  // Desktop table layout
  const renderDesktopContent = () => {
    return (
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="grades table">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(filteredGrades) && filteredGrades.length > 0 ? (
                filteredGrades
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((grade) => {
                    if (!grade) return null;
                    return (
                      <TableRow hover key={grade._id}>
                        <TableCell>
                          {grade.student ? (typeof grade.student === 'object' ? grade.student.name : 'Unknown Student') : 'Unknown Student'}
                        </TableCell>
                        <TableCell>
                          {grade.subject ? (typeof grade.subject === 'object' ? grade.subject.name : 'Unknown Subject') : 'Unknown Subject'}
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 'bold',
                              color: grade.value >= 50 ? 'success.main' : 'error.main',
                            }}
                          >
                            {grade.value}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {grade.description 
                            ? (grade.description.length > 30 
                                ? `${grade.description.substring(0, 30)}...` 
                                : grade.description)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {grade.date ? format(new Date(grade.date), 'PP') : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={grade.value >= 50 ? 'Passed' : 'Failed'}
                            color={grade.value >= 50 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            aria-label="edit grade"
                            onClick={() => handleEditClick(grade)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            aria-label="delete grade"
                            onClick={() => handleDeleteClick(grade)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    {isLoading
                      ? 'Loading grades...'
                      : isError
                        ? 'Error loading grades. Please try again.'
                        : Array.isArray(grades) && grades.length > 0
                          ? 'No grades match the filter criteria.'
                          : 'No grades found. Add a grade to get started.'}
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
        />
      </Paper>
    );
  };

  return isMobile ? renderMobileContent() : renderDesktopContent();
};

export default GradeTable;
