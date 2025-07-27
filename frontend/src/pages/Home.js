import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Login as LoginIcon,
  School as SchoolIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { appConfig } from '../config/appConfig';

/**
 * Home Page Component
 * Landing page for gradebook.pro with welcome message and login button
 */
const Home = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Box sx={{ color: 'white', mb: 4 }}>
              <Typography variant="h2" fontWeight="bold" gutterBottom>
                This is the GradeBook App
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
                Modern school management system for students, teachers, and administrators
              </Typography>
              
              {/* Login Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                onClick={handleLoginClick}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Login to Continue
              </Button>
            </Box>

            {/* App Version Info */}
            <Box sx={{ mt: 4 }}>
              <Chip
                label={`Version ${appConfig.version}`}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Grid>

          {/* Features Card */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                Features
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {[
                  { icon: <DashboardIcon />, title: 'Dashboard Analytics', desc: 'Real-time insights' },
                  { icon: <GroupIcon />, title: 'User Management', desc: 'Students & Teachers' },
                  { icon: <AssessmentIcon />, title: 'Grade Tracking', desc: 'Comprehensive reports' },
                  { icon: <SchoolIcon />, title: 'Multi-School Support', desc: 'Enterprise ready' }
                ].map((feature, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2, p: 1 }}>
                    <CardContent sx={{ p: '8px !important' }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: 'primary.main' }}>
                          {feature.icon}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {feature.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {feature.desc}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © 2025 {appConfig.author}. Modern school management made simple.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
