import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const PrintSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  pageBreakInside: 'avoid',
  '@media print': {
    marginBottom: theme.spacing(2)
  }
}));

const GradeComparisonChart = ({ 
  grades = [], 
  subjectBreakdown = {},
  classAverages = {} 
}) => {
  // Prepare data for bar chart - grade distribution
  const prepareBarChartData = () => {
    if (!subjectBreakdown || Object.keys(subjectBreakdown).length === 0) return [];
    
    // Group grades by subject
    return Object.entries(subjectBreakdown).map(([subject, stats]) => ({
      subject: subject,
      studentAverage: stats.average,
      classAverage: classAverages[subject] || 0
    }));
  };
  
  const chartData = prepareBarChartData();

  return (
    <PrintSection>
      <Typography variant="h6" gutterBottom>
        Grade Comparison by Subject
      </Typography>
      <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="studentAverage" name="Student Average" fill="#8884d8" />
              <Bar dataKey="classAverage" name="Class Average" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">
              No data available for chart visualization
            </Typography>
          </Box>
        )}
      </Paper>
    </PrintSection>
  );
};

export default GradeComparisonChart;
