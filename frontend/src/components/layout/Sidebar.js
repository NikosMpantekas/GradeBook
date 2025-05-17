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
  Business as TenantIcon,
  Settings as SettingsIcon,
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
      {
        text: 'My Notifications',
        icon: <NotificationsIcon />,
        path: '/app/notifications',
        roles: ['student'],
      },
      // Teacher specific notifications below

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
        checkPermission: (user) => user.role === 'admin' || user.canSendNotifications !== false
      },
      {
        text: 'Send Notification',
        icon: <AddIcon />,
        path: '/app/teacher/notifications/create',
        roles: ['teacher', 'admin'],
        checkPermission: (user) => user.role === 'admin' || user.canSendNotifications !== false
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
      // Tenant management for superadmin
      {
        text: 'School Tenants',
        icon: <TenantIcon />,
        path: '/app/tenants',
        roles: ['superadmin'],
      },
      // School Owner menu items
      {
        text: 'School Dashboard',
        icon: <DashboardIcon />,
        path: '/app/school-owner',
        roles: ['school_owner'],
      },
      {
        text: 'Manage Users',
        icon: <UsersIcon />,
        path: '/app/school-owner/users',
        roles: ['school_owner'],
      },
      {
        text: 'Manage Schools',
        icon: <SchoolIcon />,
        path: '/app/school-owner/schools',
        roles: ['school_owner'],
      },
      {
        text: 'Manage Subjects',
        icon: <MenuBookIcon />,
        path: '/app/school-owner/subjects',
        roles: ['school_owner'],
      },
      {
        text: 'School Announcements',
        icon: <NotificationsIcon />,
        path: '/app/school-owner/notifications',
        roles: ['school_owner'],
      },
      {
        text: 'School Settings',
        icon: <SettingsIcon />,
        path: '/app/tenant/profile',
        roles: ['school_owner'],
      },
      // Profile is available to all users
      {
        text: 'Profile',
        icon: <PersonIcon />,
        path: '/app/profile',
        roles: ['student', 'teacher', 'admin', 'superadmin', 'school_owner'],
      },
    ];

    // Filter menu items based on user role and permissions
    return menuItems.filter((item) => {
      // First check if user has the required role
      const hasRole = user && item.roles.includes(user.role);
      
      // If there's a permission check function, apply it
      if (hasRole && item.checkPermission) {
        return item.checkPermission(user);
      }
      
      // Otherwise just return based on role
      return hasRole;
    });
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
