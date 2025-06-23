import React from 'react';
import { 
  Typography, 
  Paper, 
  Table, 
  TableContainer, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Box 
} from '@mui/material';
import { styled } from '@mui/material/styles';

const PrintSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  pageBreakInside: 'avoid',
  '@media print': {
    marginBottom: theme.spacing(2)
  }
}));

const DetailedGradeList = ({ grades = [] }) => {
  return (
    <PrintSection>
      <Typography variant="h6" gutterBottom>
        Detailed Grade List
      </Typography>
      <Paper elevation={0} variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Subject</strong></TableCell>
                <TableCell align="center"><strong>Grade</strong></TableCell>
                <TableCell><strong>Comment</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(grades || []).map((grade) => (
                <TableRow key={grade._id}>
                  <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                  <TableCell>{grade.subject}</TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      fontWeight: 'bold',
                      color: grade.grade >= 70 ? 'success.main' : grade.grade >= 50 ? 'warning.main' : 'error.main'
                    }}
                  >
                    {grade.grade}
                  </TableCell>
                  <TableCell>{grade.comment || '-'}</TableCell>
                </TableRow>
              ))}
              {(!grades || grades.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No grades found for the selected period</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PrintSection>
  );
};

export default DetailedGradeList;
