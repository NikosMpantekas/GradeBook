import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  TextField, 
  Button, 
  Divider,
  InputAdornment,
  FormHelperText,
  FormControl,
  IconButton
} from '@mui/material';
import { 
  Person, 
  School, 
  Email, 
  Key, 
  Language, 
  LocationOn,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { createSchoolOwner, reset } from '../../features/superadmin/superAdminSlice';
import LoadingState from '../../components/common/LoadingState';

function CreateSchoolOwner() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    schoolName: '',
    schoolAddress: '',
    schoolEmail: '',
    emailDomain: '',
  });

  const { name, email, password, password2, schoolName, schoolAddress, schoolEmail, emailDomain } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.superAdmin);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    // Redirect if not a superadmin
    if (!user || user.role !== 'superadmin') {
      navigate('/');
      return;
    }

    if (isSuccess || user) {
      console.log('School owner created successfully, redirecting to dashboard...');
      // Use setTimeout to ensure all state updates have completed before navigation
      setTimeout(() => {
        navigate('/superadmin/dashboard');
      }, 100);
    }

    return () => {
      dispatch(reset());
    };
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // CRITICAL FIX: Modified form submission to ensure sidebar remains visible
  const onSubmit = (e) => {
    e.preventDefault();
    console.log('CreateSchoolOwner form submitted');

    // Validate form
    if (!name || !email || !password || !schoolName || !schoolAddress || !emailDomain) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== password2) {
      toast.error('Passwords do not match');
      return;
    }

    // Email domain validation (simple check)
    if (!emailDomain.includes('.')) {
      toast.error('Please enter a valid email domain (e.g., school.com)');
      return;
    }

    // Check that admin email uses the domain
    if (!email.endsWith('@' + emailDomain)) {
      toast.error(`Admin email must use the school domain (@${emailDomain})`);
      return;
    }

    const schoolOwnerData = {
      name,
      email,
      password,
      schoolName,
      schoolAddress,
      schoolEmail: schoolEmail || email, // Use the school email if provided, otherwise use the admin email
      emailDomain,
    };
    
    try {
      // Display success message before dispatch to improve user experience
      toast.success('Creating school owner account...');
      
      // Store that we're currently in the superadmin section to ensure sidebar stays open
      localStorage.setItem('currentSection', 'superadmin');
      
      // Dispatch action to create school owner
      dispatch(createSchoolOwner(schoolOwnerData));
      
      // Handle navigation directly here instead of in useEffect
      console.log('Will redirect to superadmin dashboard after processing...');
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingState fullPage={true} message="Creating school owner..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          color="primary" 
          onClick={() => navigate('/superadmin/dashboard')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <div>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <School sx={{ mr: 1 }} /> Create New School Owner
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create a school and its administrator account
          </Typography>
        </div>
      </Box>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
            School Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="schoolName"
                label="School Name"
                name="schoolName"
                value={schoolName}
                onChange={onChange}
                placeholder="Enter school name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="schoolAddress"
                label="School Address"
                name="schoolAddress"
                value={schoolAddress}
                onChange={onChange}
                placeholder="Enter school address"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="emailDomain"
                label="Email Domain (e.g., school.com)"
                name="emailDomain"
                value={emailDomain}
                onChange={onChange}
                placeholder="Enter email domain (e.g., school.com)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Language />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                fullWidth
                id="schoolEmail"
                label="School Email (Optional)"
                name="schoolEmail"
                value={schoolEmail}
                onChange={onChange}
                placeholder="Enter school contact email (optional)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
            School Owner (Admin) Account
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Name"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Enter school owner name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" error={email && emailDomain && !email.endsWith('@' + emailDomain)}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder={`Enter admin email (must use @${emailDomain || 'domain.com'})`}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  error={email && emailDomain && !email.endsWith('@' + emailDomain)}
                />
                {email && emailDomain && !email.endsWith('@' + emailDomain) && (
                  <FormHelperText error>
                    Email must end with @{emailDomain}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={onChange}
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password2"
                label="Confirm Password"
                type="password"
                id="password2"
                value={password2}
                onChange={onChange}
                autoComplete="new-password"
                error={password !== password2 && password2 !== ''}
                helperText={password !== password2 && password2 !== '' ? 'Passwords do not match' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/superadmin/dashboard')}
              startIcon={<ArrowBackIcon />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
            >
              Create School Owner
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default CreateSchoolOwner;
