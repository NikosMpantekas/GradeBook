import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  LineChart, 
  Line, 
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

const GradeProgressionChart = ({ grades = [] }) => {
  // Prepare data for line chart - grade progression
  const prepareLineChartData = () => {
    if (!grades || grades.length === 0) return [];
    
    // Sort grades by date
    const sortedGrades = [...grades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return sortedGrades.map(grade => ({
      date: new Date(grade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      grade: grade.grade,
      subject: grade.subject
    }));
  };
  
  const chartData = prepareLineChartData();

  return (
    <PrintSection>
      <Typography variant="h6" gutterBottom>
        Grade Progression Over Time
      </Typography>
      <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === 'grade') return [`${value} (${props.payload.subject})`, 'Grade'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="grade" 
                name="Grade" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
                dot={{ strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">
              No grades available to show progression
            </Typography>
          </Box>
        )}
      </Paper>
    </PrintSection>
  );
};

export default GradeProgressionChart;
