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
  TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

export default GradeTable;
