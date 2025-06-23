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

const GradeSummarySection = ({ 
  subjectBreakdown = {},
  classAverages = {} 
}) => {
  return (
    <PrintSection>
      <Typography variant="h6" gutterBottom>
        Grade Summary
      </Typography>
      <Paper elevation={0} variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Subject</strong></TableCell>
                <TableCell align="center"><strong>Average Grade</strong></TableCell>
                <TableCell align="center"><strong>Class Average</strong></TableCell>
                <TableCell align="center"><strong>Difference</strong></TableCell>
                <TableCell align="center"><strong>Grade Count</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(subjectBreakdown || {}).map(([subject, stats]) => {
                const classAvg = classAverages[subject] || 0;
                const difference = stats.average - classAvg;
                
                return (
                  <TableRow key={subject}>
                    <TableCell>{subject}</TableCell>
                    <TableCell 
                      align="center"
                      sx={{ fontWeight: 'medium' }}
                    >
                      {stats.average.toFixed(1)}
                    </TableCell>
                    <TableCell align="center">{classAvg.toFixed(1)}</TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
                        color: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'text.primary',
                        fontWeight: Math.abs(difference) > 10 ? 'bold' : 'normal'
                      }}
                    >
                      {difference > 0 ? '+' : ''}{difference.toFixed(1)}
                    </TableCell>
                    <TableCell align="center">{stats.count}</TableCell>
                  </TableRow>
                );
              })}
              {Object.keys(subjectBreakdown || {}).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No subject data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PrintSection>
  );
};

export default GradeSummarySection;
