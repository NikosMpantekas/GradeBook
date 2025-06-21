// UI Components for CreateGradeSimple
import React from 'react';

// Material UI components
import { 
  Box, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';

// Material UI icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ClassIcon from '@mui/icons-material/Class';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import GradeIcon from '@mui/icons-material/Grade';
import SubjectIcon from '@mui/icons-material/Subject';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import SaveIcon from '@mui/icons-material/Save';

/**
 * Form Header component
 */
export const FormHeader = ({ isAdmin, teacherClasses }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
      <GradeIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: '2rem' }} />
      Create New Grade
    </Typography>
    
    {isAdmin && (
      <Alert 
        severity="info" 
        variant="outlined"
        icon={<SchoolIcon />}
        sx={{ mb: 2 }}
      >
        <Typography variant="body2">
          Admin Mode: You can add grades for any student in the system
        </Typography>
      </Alert>
    )}
    
    {teacherClasses.length > 0 && !isAdmin && (
      <Alert 
        severity="info" 
        variant="outlined"
        sx={{ mb: 2 }}
      >
        <Typography variant="body2">
          Teacher Mode: You can only grade students from your assigned classes
        </Typography>
      </Alert>
    )}
  </Box>
);

/**
 * Direction Select component
 */
export const DirectionSelect = ({ 
  formData, 
  handleChange, 
  directions, 
  teacherDirections,
  loading,
  formErrors
}) => (
  <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} error={!!formErrors.direction}>
    <InputLabel id="direction-label">Direction</InputLabel>
    <Select
      labelId="direction-label"
      id="direction"
      name="direction"
      value={formData.direction || ''}
      onChange={handleChange}
      label="Direction"
      disabled={loading}
      startAdornment={<SchoolIcon color="primary" sx={{ ml: 1, mr: 1 }} />}
    >
      <MenuItem value="" sx={{ fontWeight: 'bold' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <span>All Directions</span>
          <ArrowDropDownIcon />
        </Box>
      </MenuItem>
      <Divider />
      {directions.length > 0 ? (
        directions.map((direction) => {
          const isTeacherDirection = teacherDirections.some(d => d._id === direction._id);
          return (
            <MenuItem 
              key={direction._id} 
              value={direction._id}
              sx={{
                backgroundColor: isTeacherDirection ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: isTeacherDirection ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                },
                borderLeft: isTeacherDirection ? '4px solid #1976d2' : 'none',
                pl: isTeacherDirection ? 1 : 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Typography variant="body1">{direction.name}</Typography>
                {isTeacherDirection && (
                  <Chip 
                    size="small" 
                    label="Your Class" 
                    color="primary" 
                    icon={<CheckCircleIcon />}
                    sx={{ ml: 1, height: 24, fontWeight: 500 }} 
                  />
                )}
              </Box>
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
            <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> No directions found
          </Box>
        </MenuItem>
      )}
    </Select>
    <FormHelperText>
      {teacherDirections.length > 0 ? 'Directions from your classes are highlighted' : 'Select a direction to filter subjects and students'}
    </FormHelperText>
  </FormControl>
);

/**
 * Subject Select component
 */
export const SubjectSelect = ({ 
  formData, 
  handleChange, 
  filteredSubjects, 
  teacherSubjects,
  loading,
  formErrors
}) => (
  <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} error={!!formErrors.subject}>
    <InputLabel id="subject-label">Subject</InputLabel>
    <Select
      labelId="subject-label"
      id="subject"
      name="subject"
      value={formData.subject || ''}
      onChange={handleChange}
      label="Subject"
      disabled={loading}
      startAdornment={<SubjectIcon color="primary" sx={{ ml: 1, mr: 1 }} />}
    >
      <MenuItem value="" disabled>
        <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
          <span>Select a subject</span>
        </Box>
      </MenuItem>
      <Divider />
      {filteredSubjects.length > 0 ? (
        filteredSubjects.map((subject) => {
          const isTeacherSubject = teacherSubjects.some(s => s._id === subject._id);
          return (
            <MenuItem 
              key={subject._id} 
              value={subject._id}
              sx={{
                backgroundColor: isTeacherSubject ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: isTeacherSubject ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                },
                borderLeft: isTeacherSubject ? '4px solid #1976d2' : 'none',
                pl: isTeacherSubject ? 1 : 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Typography variant="body1">{subject.name}</Typography>
                {isTeacherSubject && (
                  <Chip 
                    size="small" 
                    label="Your Class" 
                    color="primary" 
                    icon={<CheckCircleIcon />}
                    sx={{ ml: 1, height: 24, fontWeight: 500 }} 
                  />
                )}
              </Box>
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
            <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> No subjects available
          </Box>
        </MenuItem>
      )}
    </Select>
    <FormHelperText>
      {formData.direction ? 'Select a subject to continue' : 'Please select a direction first'}
    </FormHelperText>
  </FormControl>
);

/**
 * Student Select component
 */
export const StudentSelect = ({ 
  formData, 
  handleChange, 
  filteredStudents, 
  teacherStudents,
  loading,
  formErrors
}) => (
  <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} error={!!formErrors.student}>
    <InputLabel id="student-label">Student</InputLabel>
    <Select
      labelId="student-label"
      id="student"
      name="student"
      value={formData.student || ''}
      onChange={handleChange}
      label="Student"
      disabled={loading || !formData.subject}
      startAdornment={<PersonIcon color="primary" sx={{ ml: 1, mr: 1 }} />}
    >
      <MenuItem value="" disabled>
        <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
          <span>Select a student</span>
        </Box>
      </MenuItem>
      <Divider />
      {filteredStudents.length > 0 ? (
        filteredStudents.map((student) => {
          const isTeacherStudent = teacherStudents.some(s => s._id === student._id);
          return (
            <MenuItem 
              key={student._id} 
              value={student._id}
              sx={{
                backgroundColor: isTeacherStudent ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: isTeacherStudent ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                },
                borderLeft: isTeacherStudent ? '4px solid #1976d2' : 'none',
                pl: isTeacherStudent ? 1 : 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Typography variant="body1">{`${student.lastname} ${student.firstname}`}</Typography>
                {isTeacherStudent && (
                  <Chip 
                    size="small" 
                    label="Your Student" 
                    color="primary" 
                    icon={<CheckCircleIcon />}
                    sx={{ ml: 1, height: 24, fontWeight: 500 }} 
                  />
                )}
              </Box>
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
            <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> {formData.subject ? 'No students available' : 'Please select a subject first'}
          </Box>
        </MenuItem>
      )}
    </Select>
    <FormHelperText>
      {formData.subject ? 'Select a student to grade' : 'Please select a subject first'}
    </FormHelperText>
  </FormControl>
);

/**
 * Grade Value component
 */
export const GradeValueField = ({ formData, handleChange, loading, formErrors }) => (
  <TextField
    fullWidth
    id="value"
    name="value"
    label="Grade Value"
    value={formData.value}
    onChange={handleChange}
    variant="outlined"
    disabled={loading}
    error={!!formErrors.value}
    helperText={formErrors.value || 'Enter a grade value (e.g. A, B, C or 1-10)'}
    InputProps={{
      startAdornment: <GradeIcon color="primary" sx={{ mr: 1 }} />,
    }}
    sx={{ mb: 2 }}
  />
);

/**
 * Date Field component
 */
export const DateField = ({ formData, handleChange, loading, formErrors }) => (
  <TextField
    fullWidth
    id="date"
    name="date"
    label="Date"
    type="date"
    value={formData.date}
    onChange={handleChange}
    variant="outlined"
    disabled={loading}
    error={!!formErrors.date}
    helperText={formErrors.date || 'Select the date for this grade'}
    InputProps={{
      startAdornment: <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />,
    }}
    sx={{ mb: 2 }}
  />
);

/**
 * Description Field component
 */
export const DescriptionField = ({ formData, handleChange, loading, formErrors, isAdmin }) => (
  <TextField
    fullWidth
    id="description"
    name="description"
    label="Description (Optional)"
    value={formData.description}
    onChange={handleChange}
    variant="outlined"
    multiline
    rows={3}
    disabled={loading}
    error={!!formErrors.description}
    helperText={formErrors.description || 'Add optional notes or comments about this grade'}
    InputProps={{
      startAdornment: <DescriptionIcon color="primary" sx={{ mr: 1, alignSelf: 'flex-start', mt: 1 }} />,
    }}
    sx={{ mb: 3 }}
  />
);

/**
 * Form Actions (buttons) component
 */
export const FormActions = ({ isLoading, loading, handleReset, isSuccess }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
    <Button
      variant="outlined"
      color="secondary"
      onClick={handleReset}
      disabled={isLoading || loading}
      startIcon={<ArrowBackIcon />}
      sx={{ 
        px: 3,
        py: 1,
        borderRadius: 2,
        borderWidth: 2,
        '&:hover': {
          borderWidth: 2
        }
      }}
    >
      Reset Form
    </Button>
    
    <Button
      type="submit"
      variant="contained"
      color="primary"
      size="large"
      startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
      disabled={isLoading || loading}
      sx={{ 
        px: 5, 
        py: 1.5, 
        borderRadius: 2,
        boxShadow: 3,
        fontWeight: 'bold',
        '&:hover': {
          boxShadow: 6,
          backgroundColor: 'primary.dark'
        }
      }}
    >
      {isLoading ? 'Saving Grade...' : 'Save Grade'}
    </Button>
  </Box>
);

/**
 * Role Info component shown at the bottom of the form
 */
export const RoleInfo = ({ isAdmin, teacherClasses }) => (
  <>
    {teacherClasses.length > 0 && !isAdmin && (
      <Alert 
        severity="info" 
        variant="outlined"
        sx={{ mt: 3 }}
      >
        <Typography variant="subtitle2">
          Teacher Mode: You can only grade students from your assigned classes.
        </Typography>
      </Alert>
    )}
    
    {isAdmin && (
      <Alert 
        severity="info" 
        variant="outlined"
        sx={{ mt: 3 }}
        icon={<SchoolIcon />}
      >
        <Typography variant="subtitle2">
          Admin Mode: You can grade any student in the system.
        </Typography>
      </Alert>
    )}
  </>
);
