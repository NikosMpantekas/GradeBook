import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  Tooltip,
  ResponsiveContainer 
} from 'recharts';

const PrintSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  pageBreakInside: 'avoid',
  '@media print': {
    marginBottom: theme.spacing(2)
  }
}));

const SubjectPerformanceRadar = ({ 
  subjectBreakdown = {},
  classAverages = {} 
}) => {
  // Prepare data for radar chart - subject coverage
  const prepareRadarChartData = () => {
    if (!subjectBreakdown || Object.keys(subjectBreakdown).length === 0) return [];
    
    return Object.entries(subjectBreakdown).map(([subject, stats]) => ({
      subject,
      studentScore: stats.average,
      classAverage: classAverages[subject] || 0,
      fullMark: 100
    }));
  };
  
  const chartData = prepareRadarChartData();

  return (
    <PrintSection>
      <Typography variant="h6" gutterBottom>
        Subject Performance Overview
      </Typography>
      <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar 
                name="Student Score" 
                dataKey="studentScore" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6} 
              />
              <Radar 
                name="Class Average" 
                dataKey="classAverage" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6} 
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">
              No data available for radar visualization
            </Typography>
          </Box>
        )}
      </Paper>
    </PrintSection>
  );
};

export default SubjectPerformanceRadar;
