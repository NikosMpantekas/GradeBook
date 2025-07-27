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
  PersonAdd as PersonAddIcon,
  Event as CalendarIcon,
  Schedule as ScheduleIcon,
  Star as RatingIcon,
  RateReview as RateReviewIcon,
  Class as ClassIcon,
  Analytics as AnalyticsIcon,
  Support as SupportIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
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
  const { features, isFeatureEnabled } = useFeatureToggles();

  // Generate menu items based on user role and school permissions
  const getMenuItems = () => {
    const menuItems = [
      // STUDENT MENU ITEMS (in requested order)
      
      // 1. Student Dashboard
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/app/student',
        roles: ['student'],
        section: 'student',
      },
      
      // 2. My Grades (Student)
      {
        text: 'My Grades',
        icon: <GradesIcon />,
        path: '/app/grades',
        roles: ['student'],
        checkPermission: () => isFeatureEnabled('enableGrades'),
        section: 'student',
      },
      
      // 3. My Notifications (Student)
      {
        text: 'My Notifications',
        icon: <NotificationsIcon />,
        path: '/app/notifications',
        roles: ['student'],
        checkPermission: () => isFeatureEnabled('enableNotifications'),
        section: 'student',
      },
      
      // 4. Schedule (Student)
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/schedule',
        roles: ['student'],
        checkPermission: () => isFeatureEnabled('enableSchedule'),
        section: 'student',
      },
      
      // 5. Profile (Student)
      {
        text: 'Profile',
        icon: <PersonIcon />,
        path: '/app/profile',
        roles: ['student'],
        section: 'student',
      },
      
      // 6. Messages (Student)
      {
        text: 'My Messages',
        icon: <EmailIcon />,
        path: '/app/contact-messages',
        roles: ['student'],
        checkPermission: () => isFeatureEnabled('enableContactDeveloper'),
        section: 'student',
      },
      
      // 7. Calendar (Student)
      {
        text: 'Calendar',
        icon: <CalendarIcon />,
        path: '/app/calendar',
        roles: ['student'],
        checkPermission: () => isFeatureEnabled('enableCalendar'),
        section: 'student',
      },
      
      // 8. Rating System (Student)
      {
        text: 'Rating System',
        icon: <RatingIcon />,
        path: '/app/ratings',
        roles: ['student'],
        checkPermission: () => isFeatureEnabled('enableRatingSystem'),
        section: 'student',
      },
      
      // 9. Student Progress (Student)
      {
        text: 'Student Progress',
        icon: <AnalyticsIcon />,
        path: '/app/student-progress',
        roles: ['student'],
        checkPermission: () => isFeatureEnabled('enableStudentProgress'),
        section: 'student',
      },
      
      // TEACHER MENU ITEMS
      
      // 1. Teacher Dashboard
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/app/teacher',
        roles: ['teacher'],
        section: 'teacher',
      },
      
      // 2. My Classes (Teacher)
      {
        text: 'My Classes',
        icon: <ClassIcon />,
        path: '/app/classes',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableClasses'),
        section: 'teacher',
      },
      
      // 3. Manage Grades (Teacher)
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/grades',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableGrades'),
        section: 'teacher',
      },
      
      // 4. My Students (Teacher)
      {
        text: 'My Students',
        icon: <PersonIcon />,
        path: '/app/students',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableStudents'),
        section: 'teacher',
      },
      
      // 5. Notifications (Teacher)
      {
        text: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/app/notifications',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableNotifications'),
        section: 'teacher',
      },
      
      // 6. Schedule (Teacher)
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/schedule',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableSchedule'),
        section: 'teacher',
      },
      
      // 7. Calendar (Teacher)
      {
        text: 'Calendar',
        icon: <CalendarIcon />,
        path: '/app/calendar',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableCalendar'),
        section: 'teacher',
      },
      
      // 8. Rating System (Teacher)
      {
        text: 'Rating System',
        icon: <RateReviewIcon />,
        path: '/app/ratings',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableRatingSystem'),
        section: 'teacher',
      },
      
      // 9. Messages (Teacher)
      {
        text: 'Messages',
        icon: <EmailIcon />,
        path: '/app/contact-messages',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableContactDeveloper'),
        section: 'teacher',
      },
      
      // 10. Analytics (Teacher)
      {
        text: 'Analytics',
        icon: <AnalyticsIcon />,
        path: '/app/analytics',
        roles: ['teacher'],
        checkPermission: () => isFeatureEnabled('enableAnalytics'),
        section: 'teacher',
      },
      
      // ADMIN MENU ITEMS
      
      // 1. Admin Dashboard
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/app/admin',
        roles: ['admin'],
        section: 'admin',
      },
      
      // 2. Manage Users (Admin)
      {
        text: 'Manage Users',
        icon: <UsersIcon />,
        path: '/app/admin/users',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableUserManagement'),
        section: 'admin',
      },
      
      // 3. Manage Classes (Admin)
      {
        text: 'Manage Classes',
        icon: <ClassIcon />,
        path: '/app/admin/classes',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableClasses'),
        section: 'admin',
      },
      
      // 4. Manage Subjects (Admin)
      {
        text: 'Manage Subjects',
        icon: <SubjectsIcon />,
        path: '/app/admin/subjects',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableSubjects'),
        section: 'admin',
      },
      
      // 5. Manage Directions (Admin)
      {
        text: 'Manage Directions',
        icon: <DirectionsIcon />,
        path: '/app/admin/directions',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableDirections'),
        section: 'admin',
      },
      
      // 6. Manage Students (Admin)
      {
        text: 'Manage Students',
        icon: <PersonIcon />,
        path: '/app/admin/students',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableStudents'),
        section: 'admin',
      },
      
      // 7. Manage Teachers (Admin)
      {
        text: 'Manage Teachers',
        icon: <PersonIcon />,
        path: '/app/admin/teachers',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableTeachers'),
        section: 'admin',
      },
      
      // 8. Grades Overview (Admin)
      {
        text: 'Grades Overview',
        icon: <GradesIcon />,
        path: '/app/admin/grades',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableGrades'),
        section: 'admin',
      },
      
      // 9. Notifications (Admin)
      {
        text: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/app/admin/notifications',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableNotifications'),
        section: 'admin',
      },
      
      // 10. School Settings (Admin)
      {
        text: 'School Settings',
        icon: <SchoolIcon />,
        path: '/app/admin/school-settings',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableSchoolSettings'),
        section: 'admin',
      },
      
      // 11. Calendar (Admin)
      {
        text: 'Calendar',
        icon: <CalendarIcon />,
        path: '/app/admin/calendar',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableCalendar'),
        section: 'admin',
      },
      
      // 12. Schedule (Admin)
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/admin/schedule',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableSchedule'),
        section: 'admin',
      },
      
      // 13. Rating System (Admin)
      {
        text: 'Rating System',
        icon: <RatingIcon />,
        path: '/app/admin/ratings',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableRatingSystem'),
        section: 'admin',
      },
      
      // 14. Analytics (Admin)
      {
        text: 'Analytics',
        icon: <AnalyticsIcon />,
        path: '/app/admin/analytics',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableAnalytics'),
        section: 'admin',
      },
      
      // 15. System Maintenance (Admin)
      {
        text: 'System Maintenance',
        icon: <SettingsIcon />,
        path: '/app/admin/system-maintenance',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableSystemMaintenance'),
        section: 'admin',
      },
      
      // 16. Bug Reports (Admin)
      {
        text: 'Bug Reports',
        icon: <SupportIcon />,
        path: '/app/admin/bug-reports',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableBugReports'),
        section: 'admin',
      },
      
      // 17. Messages (Admin)
      {
        text: 'Messages',
        icon: <EmailIcon />,
        path: '/app/admin/contact-messages',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableContactDeveloper'),
        section: 'admin',
      },
      
      // 18. Student Progress (Admin)
      {
        text: 'Student Progress',
        icon: <AnalyticsIcon />,
        path: '/app/admin/student-progress',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enableStudentProgress'),
        section: 'admin',
      },
      
      // 19. Patch Notes (Admin)
      {
        text: 'Patch Notes',
        icon: <InfoIcon />,
        path: '/app/admin/patch-notes',
        roles: ['admin'],
        checkPermission: () => isFeatureEnabled('enablePatchNotes'),
        section: 'admin',
      },
      
      // SUPERADMIN MENU ITEMS
      
      // 1. SuperAdmin Dashboard
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/superadmin/dashboard',
        roles: ['superadmin'],
        section: 'superadmin',
      },
      
      // 2. School Permissions (SuperAdmin)
      {
        text: 'School Permissions',
        icon: <SettingsIcon />,
        path: '/superadmin/school-permissions',
        roles: ['superadmin'],
        section: 'superadmin',
      },
      
      // 3. Contact Messages (SuperAdmin)
      {
        text: 'Contact Messages',
        icon: <EmailIcon />,
        path: '/superadmin/contact',
        roles: ['superadmin'],
        section: 'superadmin',
      },
      
      // 6. System Migration (SuperAdmin)
      {
        text: 'Database Migration',
        icon: <SettingsIcon />,
        path: '/superadmin/migration',
        roles: ['superadmin'],
        section: 'superadmin',
      },
      
      // 6. Global Analytics (SuperAdmin)
      {
        text: 'Global Analytics',
        icon: <AnalyticsIcon />,
        path: '/app/superadmin/analytics',
        roles: ['superadmin'],
        section: 'superadmin',
      },
      
      // 7. System Logs (SuperAdmin)
      {
        text: 'System Logs',
        icon: <SupportIcon />,
        path: '/app/superadmin/logs',
        roles: ['superadmin'],
        section: 'superadmin',
      },
    ];

    // Filter menu items based on user role and permissions
    return menuItems.filter(item => {
      // Check if user has required role
      if (!item.roles.includes(user?.role)) {
        return false;
      }

      // Check if section matches current context
      if (item.section && item.section !== getCurrentSection()) {
        return false;
      }

      // Check permission if specified
      if (item.checkPermission) {
        return item.checkPermission();
      }

      return true;
    });
  };

  // Get current section based on route
  const getCurrentSection = () => {
    if (location.pathname.includes('/superadmin/')) {
      return 'superadmin';
    } else if (location.pathname.includes('/admin/')) {
      return 'admin';
    } else if (location.pathname.includes('/teacher/')) {
      return 'teacher';
    } else if (location.pathname.includes('/student/')) {
      return 'student';
    } else if (user?.role === 'superadmin') {
      return 'superadmin';
    } else if (user?.role === 'admin') {
      return 'admin';
    } else if (user?.role === 'teacher') {
      return 'teacher';
    } else {
      return 'student';
    }
  };

  const handleNavigate = (path) => {
    // Handle function paths that depend on user role
    const actualPath = typeof path === 'function' ? path(user) : path;
    
    console.log('Navigation to path:', actualPath);
    console.log('Navigation state before:', { isAdmin, isSuperAdmin, isActuallyPermanent });
    
    // Check if we're navigating to a special route
    const isNavigatingToSuperAdmin = actualPath.includes('/superadmin/');
    const isNavigatingToAdmin = actualPath.includes('/admin/') || isNavigatingToSuperAdmin;
    
    // Store current section in localStorage for persistence across refreshes
    if (isNavigatingToSuperAdmin) {
      localStorage.setItem('currentSection', 'superadmin');
    } else if (isNavigatingToAdmin) {
      localStorage.setItem('currentSection', 'admin');
    }
    
    // First navigate to the path
    navigate(actualPath);
    
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

  // Clear and simple item selection logic - only one item selected at a time
  const isPathSelected = (itemPath) => {
    // Handle function paths
    const actualPath = typeof itemPath === 'function' ? itemPath(user) : itemPath;
    
    // EXACT MATCH ONLY for most cases
    if (location.pathname === actualPath) {
      return true;
    }
    
    // Special cases for dashboard routes
    if (actualPath === '/superadmin/dashboard') {
      return location.pathname === '/superadmin/dashboard' || 
             (location.pathname.startsWith('/superadmin/school-owner/') && location.pathname !== '/superadmin/school-permissions');
    }
    
    if (actualPath === '/app/admin') {
      return location.pathname === '/app/admin';
    }
    
    if (actualPath === '/app/teacher') {
      return location.pathname === '/app/teacher';
    }
    
    if (actualPath === '/app/student') {
      return location.pathname === '/app/student';
    }
    
    // For School Owners item, only highlight when on dashboard
    if (actualPath === '/superadmin/dashboard' && location.pathname === '/superadmin/dashboard') {
      return true;
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
                  borderRadius: 1,
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: '#1976d2', // Strong blue background
                    color: 'white',
                    borderLeft: '4px solid #fff',
                    fontWeight: 'bold',
                    '& .MuiListItemIcon-root': {
                      color: 'white'
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 'bold'
                    }
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: '#1565c0', // Darker blue on hover
                    color: 'white'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)', // Light blue hover for non-selected
                    borderRadius: 1
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
