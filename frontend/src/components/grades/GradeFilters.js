import React from 'react';
import {
  Paper, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  InputAdornment,
  FormHelperText
} from '@mui/material';
import FilterIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import SubjectIcon from '@mui/icons-material/Subject';

/**
 * GradeFilters Component
 * Simple component with just two filter dropdowns - subject and student
 */
const GradeFilters = ({
  subjectFilter,
  studentFilter,
  subjects,
  students,
  isLoadingSubjects,
  isLoadingStudents,
  handleSubjectFilterChange,
  handleStudentFilterChange
}) => {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterIcon />
        Filter Grades
      </Typography>
        
      <Grid container spacing={3}>
        {/* Subject Filter */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="subject-filter-label">Filter by Subject</InputLabel>
            <Select
              labelId="subject-filter-label"
              id="subject-filter"
              value={subjectFilter}
              onChange={handleSubjectFilterChange}
              label="Filter by Subject"
              startAdornment={
                <InputAdornment position="start">
                  <SubjectIcon />
                </InputAdornment>
              }
              disabled={isLoadingSubjects}
            >
              <MenuItem value="">
                <em>All Subjects</em>
              </MenuItem>
              {(subjects || []).map((subject) => (
                subject && subject._id ? (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name ? subject.name : subject.value || 'Unknown Subject'}
                    {subject.className && (
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        ({subject.className})
                      </Typography>
                    )}
                  </MenuItem>
                ) : null
              ))}
            </Select>
            <FormHelperText>
              {isLoadingSubjects ? 'Loading subjects...' : 'Select a subject to filter grades'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Student Filter */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="student-filter-label">Filter by Student</InputLabel>
            <Select
              labelId="student-filter-label"
              id="student-filter"
              value={studentFilter}
              onChange={handleStudentFilterChange}
              label="Filter by Student"
              startAdornment={
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              }
              disabled={isLoadingStudents}
            >
              <MenuItem value="">
                <em>All Students</em>
              </MenuItem>
              {(students || []).map((student) => (
                student && student._id ? (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name}
                    {student.classes && student.classes.length > 0 && (
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        ({student.classes[0].name || 'Unknown Class'})
                      </Typography>
                    )}
                  </MenuItem>
                ) : null
              ))}
            </Select>
            <FormHelperText>
              {isLoadingStudents ? 'Loading students...' : 'Select a student to filter grades'}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GradeFilters;
