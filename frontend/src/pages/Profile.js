import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Avatar,
  IconButton,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import { PhotoCamera, Save as SaveIcon } from '@mui/icons-material';
import { updateProfile, reset } from '../features/auth/authSlice';

const Profile = () => {
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  const { darkMode } = useSelector((state) => state.ui);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password2: '',
    avatar: user?.avatar || '',
    darkMode: darkMode,
    saveCredentials: user?.saveCredentials || false,
  });

  const { name, email, password, password2, avatar, saveCredentials } = formData;
  
  // Add state for handling image upload
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(avatar || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const dispatch = useDispatch();

  // Track if form has been submitted
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const handleEditSave = () => {
    if (isUploading) {
      toast.info('Please wait for image compression to complete');
      return;
    }
    
    onSubmit();
  };
  
  useEffect(() => {
    if (user?.avatar && user.avatar !== formData.avatar) {
      setPreviewUrl(user.avatar);
      setFormData(prev => ({ ...prev, avatar: user.avatar }));
    }
  }, [user?.avatar]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    // Only show success message if the form was actually submitted
    if (isSuccess && hasSubmitted) {
      toast.success('Profile updated successfully');
      setHasSubmitted(false); // Reset after showing message
    }

    dispatch(reset());
  }, [isError, isSuccess, message, dispatch, hasSubmitted]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  };

  // Handle profile picture selection and compression
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Display preview before compression
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Compression options - targeting very small file size (a few KB)
      const options = {
        maxSizeMB: 0.05, // 50KB max
        maxWidthOrHeight: 400,
        useWebWorker: true,
        onProgress: (percent) => setUploadProgress(Math.round(percent)),
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);
      setUploadProgress(90);
      
      console.log(`Original file size: ${file.size / 1024} KB`);
      console.log(`Compressed file size: ${compressedFile.size / 1024} KB`);

      // Convert compressed image to base64 for preview and storage
      const reader2 = new FileReader();
      reader2.onload = (e) => {
        const base64String = e.target.result;
        setFormData((prevState) => ({
          ...prevState,
          avatar: base64String,
        }));
        setPreviewUrl(base64String);
        setUploadProgress(100);
        
        setTimeout(() => {
          setIsUploading(false);
          toast.success('Image compressed and ready to save with your profile');
        }, 500);
      };
      reader2.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Error processing image. Please try again.');
      setIsUploading(false);
    }
  };

  const onSubmit = (e) => {
    if (e) e.preventDefault();

    if (password !== password2) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Always include the avatar from the form data
    const userData = {
      name,
      email,
      avatar: formData.avatar, // Explicitly use formData.avatar to ensure it's included
      saveCredentials,
    };

    if (password) {
      userData.password = password;
    }

    console.log('Submitting profile update with userData:', userData);
    
    // Set flag to indicate form was submitted to trigger success message
    setHasSubmitted(true);
    dispatch(updateProfile(userData));
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 2,
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          My Profile
        </Typography>
        
        <Grid container spacing={4}>
          {/* Profile Photo Section */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={previewUrl || avatar} 
              alt={name} 
              sx={{ width: 120, height: 120, mb: 2, border: '2px solid #eee' }}
            />
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'center' }}>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </Typography>
            
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isUploading && (
                <Box sx={{ width: '90%', mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                    Compressing image: {uploadProgress}%
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={isUploading}
                sx={{ mb: 2 }}
              >
                Choose Photo
                <input 
                  hidden 
                  accept="image/*" 
                  type="file" 
                  onChange={handleImageChange} 
                />
              </Button>
              
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Images will be compressed to a few KB to save storage
              </Typography>
            </Box>
          </Grid>
          
          {/* Profile Form */}
          <Grid item xs={12} md={8}>
            <Box component="form" onSubmit={onSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={onChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={onChange}
              />
              
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Change Password
              </Typography>
              
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={onChange}
                helperText="Leave blank to keep current password"
              />
              <TextField
                margin="normal"
                fullWidth
                name="password2"
                label="Confirm New Password"
                type="password"
                id="password2"
                value={password2}
                onChange={onChange}
              />
              
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Preferences
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={saveCredentials}
                        onChange={onChange}
                        name="saveCredentials"
                        color="primary"
                      />
                    }
                    label="Remember me on this device"
                  />
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ mt: 3, mb: 2, py: 1.2 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile;
