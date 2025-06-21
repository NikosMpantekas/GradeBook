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
  Card,
  CardContent,
  Tooltip,
  Slider,
  Rating,
  LinearProgress
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
  <Box sx={{ mb: 4 }}>
    <Typography 
      variant="h4" 
      component="h1" 
      gutterBottom 
      sx={{ 
        fontWeight: 700, 
        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '1px 1px 2px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        pb: 1
      }}
    >
      <GradeIcon sx={{ mr: 1.5, fontSize: '2.2rem', color: '#1976d2' }} />
      Create New Grade
    </Typography>
    
    <Card sx={{ mb: 3, border: isAdmin ? '1px solid rgba(25, 118, 210, 0.2)' : 'none' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        {isAdmin && (
          <Alert 
            severity="info" 
            variant="filled"
            icon={<SchoolIcon />}
            sx={{ mb: 0, fontWeight: 500 }}
          >
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Admin Mode Active: You can add grades for any student in the system
            </Typography>
          </Alert>
        )}
        
        {teacherClasses.length > 0 && !isAdmin && (
          <Alert 
            severity="info" 
            variant="outlined"
            sx={{ mb: 0 }}
          >
            <Typography variant="body1">
              Teacher Mode: You can only grade students from your assigned classes
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
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
  <FormControl fullWidth variant="outlined" sx={{ mb: 3 }} error={!!formErrors.student}>
    <InputLabel id="student-label">Student</InputLabel>
    <Select
      labelId="student-label"
      id="student"
      name="student"
      value={formData.student || ''}
      onChange={handleChange}
      label="Student"
      disabled={!formData.subject || loading}
      startAdornment={<PersonIcon color="primary" sx={{ ml: 1, mr: 1 }} />}
      sx={{
        '.MuiOutlinedInput-notchedOutline': {
          borderColor: formData.student ? 'rgba(25, 118, 210, 0.5)' : undefined
        }
      }}
    >
      <MenuItem value="" disabled>
        <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
          <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> {formData.subject ? 'Select a student' : 'Please select a subject first'}
        </Box>
      </MenuItem>
      
      {loading && (
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            <Typography>Loading students...</Typography>
          </Box>
        </MenuItem>
      )}
      
      {!loading && filteredStudents.length === 0 && formData.subject && (
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7, py: 1 }}>
            <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> No students available for this subject
          </Box>
        </MenuItem>
      )}
      
      {!loading && filteredStudents.length > 0 ? (
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
                <Typography variant="body1">
                  {student.lastName}, {student.firstName}
                </Typography>
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
        !loading && !formData.subject && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
              <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> Please select a subject first
            </Box>
          </MenuItem>
        )
      )}
    </Select>
    <FormHelperText>
      {formErrors.student || (formData.subject ? 'Select a student to grade' : 'Please select a subject first')}
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
    type="number"
    value={formData.value}
    onChange={handleChange}
    variant="outlined"
    disabled={loading}
    error={!!formErrors.value}
    inputProps={{ min: 0, max: 100 }}
    helperText={formErrors.value || 'Enter a grade value between 0-100'}
    InputProps={{
      startAdornment: <GradeIcon color="primary" sx={{ mr: 1 }} />,
      endAdornment: (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          / 100
        </Typography>
      ),
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
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
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
    
    <Tooltip title="Save this grade to the database" arrow placement="top">
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
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(66, 165, 245, 0.3)',
            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
          }
        }}
      >
        {isLoading ? 'Saving Grade...' : 'Save Grade'}
      </Button>
    </Tooltip>
  </Box>
);

/**
 * Role Info component shown at the bottom of the form
 */
export const RoleInfo = ({ isAdmin, teacherClasses }) => (
  <>
    {teacherClasses.length > 0 && !isAdmin && (
      <Card sx={{ mt: 4, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary" fontWeight={500}>
              Teacher Grading Mode
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            As a teacher, you can only grade students from your assigned classes. The system automatically filters
            the available directions, subjects and students based on your teaching assignments.
          </Typography>
        </CardContent>
      </Card>
    )}
    
    {isAdmin && (
      <Card sx={{ mt: 4, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SchoolIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary" fontWeight={500}>
              Administrator Grading Mode
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            As an administrator, you have full access to grade any student in the system across all directions and subjects.
            There are no restrictions on which students you can grade.
          </Typography>
        </CardContent>
      </Card>
    )}
  </>
);
