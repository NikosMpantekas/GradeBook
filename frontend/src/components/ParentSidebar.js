import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Grade as GradeIcon,
  Notifications as NotificationsIcon,
  ContactSupport as ContactSupportIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { logout } from '../features/auth/authSlice';

const ParentSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/app/parent',
      description: 'Overview of student progress'
    },
    {
      text: 'Student Grades',
      icon: <GradeIcon />,
      path: '/app/parent/grades',
      description: 'View student grades and performance'
    },
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/app/parent/notifications',
      description: 'School communications and updates'
    },
    {
      text: 'Contact Support',
      icon: <ContactSupportIcon />,
      path: '/app/parent/contact',
      description: 'Get help and support'
    },
  ];

  const isActive = (path) => {
    if (path === '/app/parent') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Profile Section */}
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            mx: 'auto',
            mb: 1,
            bgcolor: 'primary.main',
            fontSize: '1.5rem'
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'P'}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {user?.name || 'Parent'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Parent Account
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive(item.path) ? 'white' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                secondary={item.description}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: {
                    color: isActive(item.path) ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                    fontSize: '0.7rem',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Profile and Logout */}
      <List sx={{ py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/app/parent/profile')}
            sx={{
              mx: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              mx: 1,
              borderRadius: 2,
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'error.dark',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default ParentSidebar;
