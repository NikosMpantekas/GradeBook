import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  Divider, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  MenuBook as GradesIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon,
  AddCircleOutline as AddIcon,
  People as UsersIcon,
  LocationCity as SchoolsIcon,
  Folder as DirectionsIcon,
  Subject as SubjectsIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Generate menu items based on user role
  const getMenuItems = () => {
    const menuItems = [
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/app/dashboard',
        roles: ['student', 'teacher', 'admin'],
      },
      {
        text: 'My Grades',
        icon: <GradesIcon />,
        path: '/app/grades',
        roles: ['student'],
      },
      // Notifications moved to teacher section only

      // Teacher menu items
      {
        text: 'Teacher Dashboard',
        icon: <SchoolIcon />,
        path: '/app/teacher',
        roles: ['teacher', 'admin'],
      },
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/teacher/grades/manage',
        roles: ['teacher', 'admin'],
      },
      {
        text: 'Add Grade',
        icon: <AddIcon />,
        path: '/app/teacher/grades/create',
        roles: ['teacher', 'admin'],
      },
      {
        text: 'Teacher Notifications',
        icon: <NotificationsIcon />,
        path: '/app/teacher/notifications',
        roles: ['teacher', 'admin'],
      },
      {
        text: 'Send Notification',
        icon: <AddIcon />,
        path: '/app/teacher/notifications/create',
        roles: ['teacher', 'admin'],
      },
      // Admin menu items
      {
        text: 'Admin Dashboard',
        icon: <AdminIcon />,
        path: '/app/admin',
        roles: ['admin'],
      },
      {
        text: 'Manage Users',
        icon: <UsersIcon />,
        path: '/app/admin/users',
        roles: ['admin'],
      },
      {
        text: 'Manage Schools',
        icon: <SchoolsIcon />,
        path: '/app/admin/schools',
        roles: ['admin'],
      },
      {
        text: 'Manage Directions',
        icon: <DirectionsIcon />,
        path: '/app/admin/directions',
        roles: ['admin'],
      },
      {
        text: 'Manage Subjects',
        icon: <SubjectsIcon />,
        path: '/app/admin/subjects',
        roles: ['admin'],
      },
      // Profile is available to all users
      {
        text: 'Profile',
        icon: <PersonIcon />,
        path: '/app/profile',
        roles: ['student', 'teacher', 'admin'],
      },
    ];

    // Filter menu items based on user role
    return menuItems.filter((item) => user && item.roles.includes(user.role));
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const drawer = (
    <div>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', my: 2 }}>
          GradeBook
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {user && `Logged in as: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`}
        </Typography>
      </Box>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
