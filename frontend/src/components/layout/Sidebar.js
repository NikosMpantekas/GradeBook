import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FeatureToggleContext } from '../../context/FeatureToggleContext';
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
  
  // Enhanced sidebar state management with corrected route detection
  const isSuperAdmin = user && user.role === 'superadmin';
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
  const isSuperAdminRoute = location.pathname.includes('/superadmin/');
  const isAdminRoute = location.pathname.includes('/admin/') || location.pathname === '/app/admin' || isSuperAdminRoute;
  
  // Track if current section is superadmin or admin with enhanced debugging
  useEffect(() => {
    console.log(`[SIDEBAR ROUTE DEBUG] Path: ${location.pathname}`);
    console.log(`[SIDEBAR ROUTE DEBUG] isSuperAdminRoute: ${isSuperAdminRoute}`);
    console.log(`[SIDEBAR ROUTE DEBUG] isAdminRoute: ${isAdminRoute}`);
    console.log(`[SIDEBAR ROUTE DEBUG] User role: ${user?.role}`);
    
    if (isSuperAdminRoute) {
      localStorage.setItem('currentSection', 'superadmin');
      console.log(`[SIDEBAR ROUTE DEBUG] Set section to: superadmin`);
    } else if (isAdminRoute) {
      localStorage.setItem('currentSection', 'admin');
      console.log(`[SIDEBAR ROUTE DEBUG] Set section to: admin`);
    } else {
      console.log(`[SIDEBAR ROUTE DEBUG] No section set, relying on user role`);
    }
  }, [isSuperAdminRoute, isAdminRoute, location.pathname, user?.role]);
  
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
      
      // STEP 4: COMPLETE ADMIN FUNCTIONS FOR STUDENT ROLE
      
      // 2. Manage Users (Student)
      {
        text: 'Manage Users',
        icon: <UsersIcon />,
        path: '/app/student/users',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableUserManagement'),
      },
      
      // 3. Manage Classes (Student)
      {
        text: 'Manage Classes',
        icon: <ClassIcon />,
        path: '/app/student/classes',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableClasses'),
      },
      
      // 4. Manage Students (Student)
      {
        text: 'Manage Students',
        icon: <PersonIcon />,
        path: '/app/student/students',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableStudents'),
      },
      
      // 5. Manage Teachers (Student)
      {
        text: 'Manage Teachers',
        icon: <PersonIcon />,
        path: '/app/student/teachers',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableTeachers'),
      },
      
      // 6. Add Grades (Student)
      {
        text: 'Add Grades',
        icon: <AddIcon />,
        path: '/app/student/grades/create',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 7. Manage Grades (Student)
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/student/grades/manage',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 8. Grades Overview (Student)
      {
        text: 'Grades Overview',
        icon: <AnalyticsIcon />,
        path: '/app/student/student-stats',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 9. Add Notifications (Student)
      {
        text: 'Add Notifications',
        icon: <AddIcon />,
        path: '/app/student/notifications/create',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // 10. Manage Notifications (Student)
      {
        text: 'Manage Notifications',
        icon: <NotificationsIcon />,
        path: '/app/student/notifications/manage',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // 11. Manage School Branches (Student)
      {
        text: 'Manage School Branches',
        icon: <SchoolIcon />,
        path: '/app/student/schools',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableSchoolSettings'),
      },
      
      // 12. Schedule (Student)
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/student/schedule',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableSchedule'),
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
      
      // STEP 4: COMPLETE ADMIN FUNCTIONS FOR TEACHER ROLE
      
      // 2. Manage Users (Teacher)
      {
        text: 'Manage Users',
        icon: <UsersIcon />,
        path: '/app/teacher/users',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableUserManagement'),
      },
      
      // 3. Manage Classes (Teacher)
      {
        text: 'Manage Classes',
        icon: <ClassIcon />,
        path: '/app/teacher/classes',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableClasses'),
      },
      
      // 4. Manage Students (Teacher)
      {
        text: 'Manage Students',
        icon: <PersonIcon />,
        path: '/app/teacher/students',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableStudents'),
      },
      
      // 5. Manage Teachers (Teacher)
      {
        text: 'Manage Teachers',
        icon: <PersonIcon />,
        path: '/app/teacher/teachers',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableTeachers'),
      },
      
      // 6. Add Grades (Teacher)
      {
        text: 'Add Grades',
        icon: <AddIcon />,
        path: '/app/teacher/grades/create',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 7. Manage Grades (Teacher)
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/teacher/grades/manage',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 8. Grades Overview (Teacher)
      {
        text: 'Grades Overview',
        icon: <AnalyticsIcon />,
        path: '/app/teacher/student-stats',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 9. Add Notifications (Teacher)
      {
        text: 'Add Notifications',
        icon: <AddIcon />,
        path: '/app/teacher/notifications/create',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // 10. Manage Notifications (Teacher)
      {
        text: 'Manage Notifications',
        icon: <NotificationsIcon />,
        path: '/app/teacher/notifications',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // 11. Manage School Branches (Teacher)
      {
        text: 'Manage School Branches',
        icon: <SchoolIcon />,
        path: '/app/teacher/schools',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableSchoolSettings'),
      },
      
      // 12. Schedule (Teacher)
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/teacher/schedule',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableSchedule'),
      },
      
      // ADMIN MENU ITEMS - REFACTORED (only working features)
      
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
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableUserManagement'),
      },
      
      // 3. Manage Classes (Admin)
      {
        text: 'Manage Classes',
        icon: <ClassIcon />,
        path: '/app/admin/classes',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableClasses'),
      },
      
      // 4. Manage Students (Admin)
      {
        text: 'Manage Students',
        icon: <PersonIcon />,
        path: '/app/admin/students',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableStudents'),
      },
      
      // 5. Manage Teachers (Admin)
      {
        text: 'Manage Teachers',
        icon: <PersonIcon />,
        path: '/app/admin/teachers',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableTeachers'),
      },
      
      // 6. Add Grades (Admin) - RESTORED
      {
        text: 'Add Grades',
        icon: <AddIcon />,
        path: '/app/admin/grades/create',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 7. Manage Grades (Admin) - RESTORED
      {
        text: 'Manage Grades',
        icon: <GradesIcon />,
        path: '/app/admin/grades/manage',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 8. Grades Overview (Admin) - RESTORED
      {
        text: 'Grades Overview',
        icon: <AnalyticsIcon />,
        path: '/app/admin/student-stats',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 9. Add Notifications (Admin) - RESTORED
      {
        text: 'Add Notifications',
        icon: <AddIcon />,
        path: '/app/admin/notifications/create',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // 10. Manage Notifications (Admin) - RESTORED
      {
        text: 'Manage Notifications',
        icon: <NotificationsIcon />,
        path: '/app/admin/notifications/manage',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // 11. Manage School Branches (Admin) - RESTORED
      {
        text: 'Manage School Branches',
        icon: <SchoolIcon />,
        path: '/app/admin/schools',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableSchoolSettings'),
      },
      
      // 12. Schedule (Admin) - KEPT
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/admin/schedule',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableSchedule'),
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

    // Get current section for filtering
    const currentSection = getCurrentSection();
    
    // Filter menu items based on user role and permissions
    const filteredItems = menuItems.filter(item => {
      // Check if user has required role
      if (!item.roles.includes(user?.role)) {
        return false;
      }

      // Check if section matches current context
      if (item.section && item.section !== currentSection) {
        return false;
      }

      // Check permission if specified
      if (item.checkPermission) {
        return item.checkPermission();
      }

      return true;
    });
    
    // Enhanced debug logging for admin menu filtering
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      console.log(`[SIDEBAR MENU DEBUG] ==========================================`);
      console.log(`[SIDEBAR MENU DEBUG] Menu filtering analysis:`);
      console.log(`  - User role: ${user?.role}`);
      console.log(`  - Current section: ${currentSection}`);
      console.log(`  - Current path: ${location.pathname}`);
      console.log(`  - Total menu items: ${menuItems.length}`);
      console.log(`  - Filtered items: ${filteredItems.length}`);
      console.log(`  - Admin items available:`, menuItems.filter(item => item.roles.includes('admin')).map(item => ({ text: item.text, section: item.section, hasPermissionCheck: !!item.checkPermission })));
      console.log(`  - Filtered admin items:`, filteredItems.filter(item => item.roles.includes('admin')).map(item => ({ text: item.text, section: item.section })));
      
      // Check each admin item individually
      const adminItems = menuItems.filter(item => item.roles.includes('admin'));
      adminItems.forEach(item => {
        const hasRole = item.roles.includes(user?.role);
        const sectionMatches = !item.section || item.section === currentSection;
        const permissionPassed = !item.checkPermission || item.checkPermission();
        
        console.log(`[SIDEBAR MENU DEBUG] Item "${item.text}":`);
        console.log(`  - Has role: ${hasRole}`);
        console.log(`  - Section matches (${item.section} === ${currentSection}): ${sectionMatches}`);
        console.log(`  - Permission passed: ${permissionPassed}`);
        console.log(`  - Will show: ${hasRole && sectionMatches && permissionPassed}`);
      });
      console.log(`[SIDEBAR MENU DEBUG] ==========================================`);
    }
    
    return filteredItems;
  };

  // Get current section based on route
  const getCurrentSection = () => {
    // Get stored section from localStorage first (for persistence)
    const storedSection = localStorage.getItem('currentSection');
    
    // Check route-based section detection
    let routeBasedSection = null;
    if (location.pathname.includes('/superadmin/')) {
      routeBasedSection = 'superadmin';
    } else if (location.pathname.includes('/admin/') || location.pathname === '/app/admin') {
      routeBasedSection = 'admin';
    } else if (location.pathname.includes('/teacher/') || location.pathname === '/app/teacher') {
      routeBasedSection = 'teacher';
    } else if (location.pathname.includes('/student/') || location.pathname === '/app/student') {
      routeBasedSection = 'student';
    }
    
    // Determine final section with improved logic
    let finalSection;
    if (routeBasedSection) {
      // Route explicitly indicates section
      finalSection = routeBasedSection;
    } else if (storedSection && (user?.role === 'admin' || user?.role === 'superadmin')) {
      // For admin/superadmin users, prefer stored section when route is ambiguous
      // This fixes the menu visibility issue after login
      finalSection = storedSection;
    } else if (user?.role === 'superadmin') {
      finalSection = 'superadmin';
    } else if (user?.role === 'admin') {
      finalSection = 'admin';
    } else if (user?.role === 'teacher') {
      finalSection = 'teacher';
    } else {
      finalSection = 'student';
    }
    
    // Debug logging for admin menu visibility issues
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      console.log(`[SIDEBAR DEBUG] getCurrentSection analysis:`);
      console.log(`  - Current path: ${location.pathname}`);
      console.log(`  - User role: ${user?.role}`);
      console.log(`  - Route-based section: ${routeBasedSection}`);
      console.log(`  - Stored section: ${storedSection}`);
      console.log(`  - Final section: ${finalSection}`);
    }
    
    return finalSection;
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
