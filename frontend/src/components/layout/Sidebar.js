import React, { useEffect, useState } from 'react';
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
  Assessment as AssessmentIcon,
  Email as EmailIcon,
  AdminPanelSettings as SuperAdminIcon,
  PersonAdd as AddUserIcon,
  Event as CalendarIcon,
  Star as RatingIcon,
  RateReview as RateReviewIcon,
  Class as ClassIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useFeatureToggles } from '../../context/FeatureToggleContext';

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle, permanent = false }) => {
  console.log('Sidebar rendering with props:', { drawerWidth, mobileOpen, permanent });
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Enhanced sidebar state management
  const isSuperAdmin = user && user.role === 'superadmin';
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
  const isSuperAdminRoute = location.pathname.includes('/superadmin/');
  const isAdminRoute = location.pathname.includes('/admin/') || isSuperAdminRoute;
  
  // Track if current section is superadmin or admin
  useEffect(() => {
    if (isSuperAdminRoute) {
      localStorage.setItem('currentSection', 'superadmin');
    } else if (isAdminRoute) {
      localStorage.setItem('currentSection', 'admin');
    }
  }, [isSuperAdminRoute, isAdminRoute]);
  
  // Make sidebar permanent for admin users or if specified in props
  const isActuallyPermanent = permanent || isAdmin;
  
  // Debug sidebar state on route changes
  useEffect(() => {
    console.log(`Sidebar state - Route: ${location.pathname} | Permanent: ${isActuallyPermanent} | Open: ${mobileOpen}`);
  }, [location.pathname, isActuallyPermanent, mobileOpen]);

  // Get feature toggles from context
  const { features } = useFeatureToggles();

  // Helper function to check if a school feature is enabled
  const isFeatureEnabled = (featureName) => {
    // For superadmin, all features are enabled
    if (user?.role === 'superadmin') {
      return true;
    }
    
    // Always enable grades and notifications regardless of context
    if (featureName === 'enableGrades' || featureName === 'enableNotifications') {
      console.log(`Forcing ${featureName} to be enabled for user ${user?.name}`);
      return true;
    }
    
    // Check if the feature exists in the context
    if (features && featureName in features) {
      return features[featureName] === true;
    }
    
    // Default to false for safety
    return false;
  };

  // Generate menu items based on user role and school permissions
  const getMenuItems = () => {
    const menuItems = [
      // SuperAdmin menu items
      {
        text: 'SuperAdmin Dashboard',
        icon: <SuperAdminIcon />,
        path: '/superadmin/dashboard',
        roles: ['superadmin'],
      },
      {
        text: 'Create School Owner',
        icon: <AddUserIcon />,
        path: '/superadmin/new-school-owner',
        roles: ['superadmin'],
      },
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/app/dashboard',
        roles: ['student', 'teacher', 'admin'],
      },
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/admin/grades',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => isFeatureEnabled('enableGrades'),
      },

      {
        text: 'My Grades',
        icon: <GradesIcon />,
        path: '/app/grades',
        roles: ['student'],
        checkPermission: (user) => isFeatureEnabled('enableGrades'),
      },
      {
        text: 'Submit Ratings',
        icon: <RateReviewIcon />,
        path: '/app/ratings',
        roles: ['student'],
        checkPermission: (user) => isFeatureEnabled('enableRatingSystem'),
      },
      {
        text: 'My Notifications',
        icon: <NotificationsIcon />,
        path: '/app/notifications',
        roles: ['student', 'teacher', 'admin'],
        checkPermission: (user) => isFeatureEnabled('enableNotifications'),
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
        text: 'Student Ratings',
        icon: <RatingIcon />,
        path: '/app/teacher/ratings',
        roles: ['teacher', 'admin'],
        checkPermission: (user) => (user.role === 'admin' || user.role === 'teacher') && 
                               isFeatureEnabled('enableRatingSystem'),
      },
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/teacher/grades/manage',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => (user.role === 'admin' || user.role === 'teacher' || 
                               (user.role === 'secretary' && user.secretaryPermissions?.canManageGrades)) && 
                               isFeatureEnabled('enableGrades'),
      },
      {
        text: 'Add Grade',
        icon: <AddIcon />,
        path: '/app/teacher/grades/create',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => (user.role === 'admin' || user.role === 'teacher' || 
                               (user.role === 'secretary' && user.secretaryPermissions?.canManageGrades)) && 
                               isFeatureEnabled('enableGrades'),
      },
      {
        text: 'Send Notifications',
        icon: <NotificationsIcon />,
        path: '/app/teacher/notifications',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => (user.role === 'admin' || user.role === 'teacher' || 
                               (user.role === 'secretary' && user.secretaryPermissions?.canSendNotifications)) && 
                               isFeatureEnabled('enableNotifications'),
      },
      // Admin and Secretary menu items
      {
        text: 'Admin Dashboard',
        icon: <AdminIcon />,
        path: '/app/admin',
        roles: ['admin', 'secretary'],
      },
      {
        text: 'Manage Users',
        icon: <UsersIcon />,
        path: '/app/admin/users',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageUsers),
      },
      {
        text: 'Manage Schools',
        icon: <SchoolsIcon />,
        path: '/app/admin/schools',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageSchools),
      },
      {
        text: 'Manage Classes',
        icon: <ClassIcon />,
        path: '/app/admin/classes',
        roles: ['admin', 'secretary'],
        // Always allow admins to access, for secretary require school management permission
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageSchools === true),
      },
      // Keep legacy Directions option for backward compatibility during migration
      {
        text: 'Manage Directions (Legacy)',
        icon: <DirectionsIcon />,
        path: '/app/admin/directions',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => {
          return user.role === 'admin' ? 
            user.adminPermissions?.canManageDirections !== false : 
            user.secretaryPermissions?.canManageDirections === true;
        },
      },
      // Manage Subjects menu item removed as requested

      {
        text: 'Student Progress',
        icon: <AssessmentIcon />,
        path: '/app/admin/progress',
        roles: ['admin', 'teacher', 'secretary'],
        checkPermission: (user) => {
          return (user.role === 'admin' || user.role === 'teacher' || 
                 (user.role === 'secretary' && user.secretaryPermissions?.canAccessStudentProgress)) && 
                 isFeatureEnabled('enableStudentProgress');
        },
      },
      {
        text: 'Rating System',
        icon: <RatingIcon />,
        path: '/app/admin/ratings',
        roles: ['admin'],
        checkPermission: (user) => user.role === 'admin' && isFeatureEnabled('enableRatingSystem'),
      },
      {
        text: 'Rating Statistics',
        icon: <AssessmentIcon />,
        path: '/app/admin/rating-statistics',
        roles: ['admin'],
        checkPermission: (user) => user.role === 'admin' && isFeatureEnabled('enableRatingSystem'),
      },
      {
        text: 'Contact Messages',
        icon: <EmailIcon />,
        path: '/superadmin/contact',
        roles: ['superadmin'],
      },
      // Calendar is available to all users with the feature enabled
      {
        text: 'Calendar',
        icon: <CalendarIcon />,
        path: '/app/calendar',
        roles: ['admin', 'teacher', 'student', 'secretary'],
        checkPermission: (user) => isFeatureEnabled('enableCalendar'),
      },
      // Superadmin School Features menu item
      {
        text: 'School Features',
        icon: <AdminIcon />,
        path: '/superadmin/school-features',
        roles: ['superadmin'],
      },
      // Profile is available to all users
      {
        text: 'Profile',
        icon: <PersonIcon />,
        path: '/app/profile',
        roles: ['student', 'teacher', 'admin', 'superadmin'],
      },
      // My Contact Messages is available to all users
      {
        text: 'My Messages & Bug Reports',
        icon: <EmailIcon />,
        path: '/app/contact-messages',
        roles: ['student', 'teacher', 'admin', 'superadmin'],
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
    console.log('Navigation to path:', path);
    console.log('Navigation state before:', { isAdmin, isSuperAdmin, isActuallyPermanent });
    
    // Check if we're navigating to a special route
    const isNavigatingToSuperAdmin = path.includes('/superadmin/');
    const isNavigatingToAdmin = path.includes('/admin/') || isNavigatingToSuperAdmin;
    
    // Store current section in localStorage for persistence across refreshes
    if (isNavigatingToSuperAdmin) {
      localStorage.setItem('currentSection', 'superadmin');
    } else if (isNavigatingToAdmin) {
      localStorage.setItem('currentSection', 'admin');
    }
    
    // First navigate to the path
    navigate(path);
    
    // IMPORTANT: NEVER close the drawer for admin/superadmin users or admin routes
    if (isAdmin || isNavigatingToAdmin || isActuallyPermanent) {
      console.log('✅ Keeping sidebar open for admin/superadmin navigation');
      return;
    }
    
    // Only close drawer for regular users on mobile
    if (window.innerWidth < 600 && mobileOpen && handleDrawerToggle) {
      console.log('Closing sidebar for mobile navigation');
      handleDrawerToggle();
    }
  };

  // Enhanced item selection logic to handle nested routes
  const isPathSelected = (itemPath) => {
    // Exact match
    if (location.pathname === itemPath) return true;
    
    // Special case for superadmin dashboard
    if (itemPath === '/superadmin/dashboard' && location.pathname.startsWith('/superadmin') && 
        !location.pathname.includes('/new-school-owner') && 
        !location.pathname.includes('/contact')) {
      return true;
    }
    
    // Special case for admin dashboard
    if (itemPath === '/app/admin' && location.pathname === '/app/admin') {
      return true;
    }
    
    // For nested paths, only highlight the most specific matching path
    if (itemPath !== '/' && 
        itemPath !== '/app/dashboard' && 
        itemPath !== '/superadmin/dashboard' && 
        itemPath !== '/app/admin' && 
        location.pathname.startsWith(itemPath)) {
      
      // Get all menu items
      const allMenuItems = getMenuItems();
      // Find if there's a more specific path that matches
      const moreSpecificPathExists = allMenuItems.some(item => 
        item.path !== itemPath && 
        item.path.startsWith(itemPath) && 
        location.pathname.startsWith(item.path)
      );
      
      // Only return true if this is the most specific path
      return !moreSpecificPathExists;
    }
    
    return false;
  };

  // Create the drawer content
  const drawer = (
    <div>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          {isSuperAdminRoute ? 'Super Admin' : 'GradeBook'}
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {user.name} ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})
          </Typography>
        )}
      </Box>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              onClick={() => handleNavigate(item.path)}
              selected={isPathSelected(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  borderRight: '4px solid',
                  borderColor: 'primary.main',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'primary.light', 
                }
              }}
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
      aria-label="navigation sidebar"
    >
      {/* Mobile drawer */}
      <Drawer
        container={window.document.body}
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)' 
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        open={true}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)' 
          },
        }}
        PaperProps={{
          elevation: 1, // Add subtle shadow for better visual separation
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
