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
  Schedule as ScheduleIcon,
  Star as RatingIcon,
  RateReview as RateReviewIcon,
  Class as ClassIcon,
  Analytics as AnalyticsIcon,
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
      // EXACTLY FOLLOWING THE REQUESTED MENU ORDER
      
      // 1. Admin Dashboard
      {
        text: 'Admin Dashboard',
        icon: <AdminIcon />,
        path: '/app/admin',
        roles: ['admin', 'secretary'],
        section: 'admin',
      },
      
      // 2. Teacher Dashboard
      {
        text: 'Teacher Dashboard',
        icon: <SchoolIcon />,
        path: '/app/teacher',
        roles: ['teacher', 'admin'],
        section: 'teacher',
      },
      
      // 3. Add Grade
      {
        text: 'Add Grade',
        icon: <AddIcon />,
        path: '/app/teacher/grades/create',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => (user.role === 'admin' || user.role === 'teacher' || 
                            (user.role === 'secretary' && user.secretaryPermissions?.canManageGrades)) && 
                            isFeatureEnabled('enableGrades'),
        section: 'teacher',
      },
      
      // 4. Manage Grades
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/teacher/grades/manage',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => (user.role === 'admin' || user.role === 'teacher' || 
                            (user.role === 'secretary' && user.secretaryPermissions?.canManageGrades)) && 
                            isFeatureEnabled('enableGrades'),
        section: 'teacher',
      },
      
      // 5. Add Notifications (Send Notifications)
      {
        text: 'Send Notifications',
        icon: <NotificationsIcon />,
        path: '/app/teacher/notifications/create',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => (user.role === 'admin' || user.role === 'teacher' || 
                            (user.role === 'secretary' && user.secretaryPermissions?.canSendNotifications)) && 
                            isFeatureEnabled('enableNotifications'),
        section: 'teacher',
      },
      
      // 6. Notifications (My Notifications)
      {
        text: 'My Notifications',
        icon: <NotificationsIcon />,
        path: '/app/notifications',
        roles: ['student', 'teacher', 'admin'],
        checkPermission: (user) => isFeatureEnabled('enableNotifications'),
        section: 'common',
      },
      
      // 7. Schedule (Weekly Timetable)
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/schedule',
        roles: ['student', 'teacher', 'admin'],
        section: 'common',
      },
      
      // 8. Messages and Bug Reports
      {
        text: 'My Messages & Bug Reports',
        icon: <EmailIcon />,
        path: '/app/contact-messages',
        roles: ['student', 'teacher', 'admin', 'superadmin'],
        section: 'common',
      },
      
      // 9. Manage Users
      {
        text: 'Manage Users',
        icon: <UsersIcon />,
        path: '/app/admin/users',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageUsers),
        section: 'admin',
      },
      
      // 10. Manage Schools
      {
        text: 'Manage Schools',
        icon: <SchoolsIcon />,
        path: '/app/admin/schools',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageSchools),
        section: 'admin',
      },
      
      // 11. Manage Classes
      {
        text: 'Manage Classes',
        icon: <ClassIcon />,
        path: '/app/admin/classes',
        roles: ['admin', 'secretary'],
        // Always allow admins to access, for secretary require school management permission
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageSchools === true),
        section: 'admin',
      },
      
      // 11.5. Student Statistics (Admin View)
      {
        text: 'Student Statistics',
        icon: <AnalyticsIcon />,
        path: '/app/admin/student-stats',
        roles: ['admin'],
        section: 'admin',
      },
      
      // 11.6. Student Statistics (Teacher View)
      {
        text: 'Student Statistics',
        icon: <AnalyticsIcon />,
        path: '/app/teacher/student-stats',
        roles: ['teacher'],
        section: 'teacher',
      },
      
      // 12. Profile
      {
        text: 'Profile',
        icon: <PersonIcon />,
        path: '/app/profile',
        roles: ['student', 'teacher', 'admin', 'superadmin'],
        section: 'common',
      },
      
      // Student's view of grades
      {
        text: 'My Grades',
        icon: <GradesIcon />,
        path: '/app/grades',
        roles: ['student'],
        checkPermission: (user) => isFeatureEnabled('enableGrades'),
        section: 'student',
      },
      
      // Removed general dashboard to avoid duplication
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
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden' // Prevent the container from scrolling
    }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          {isSuperAdminRoute ? 'Super Admin' : 'GradeBook'}
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {user.name} ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})
          </Typography>
        )}
      </Box>
      <Divider sx={{ flexShrink: 0 }} />
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', // Enable scrolling for the menu items
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0,0,0,0.5)',
        },
      }}>
        <List sx={{ py: 1 }}>
          {getMenuItems().map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => handleNavigate(item.path)}
                selected={isPathSelected(item.path)}
                sx={{
                  minHeight: 48, // Ensure consistent height for zoom responsiveness
                  px: 2,
                  py: 1,
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
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 'medium'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
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
