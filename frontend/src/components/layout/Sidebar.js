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
  Typography,
  Avatar
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
  ContactSupport as ContactSupportIcon,
  Announcement as AnnouncementIcon,
  Class as ClassIcon,
  Analytics as AnalyticsIcon,
  Support as SupportIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { useFeatureToggles } from '../../context/FeatureToggleContext';

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle, permanent = false }) => {
  console.log('Sidebar rendering with props:', { drawerWidth, mobileOpen, permanent });
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
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
  // (Removed isActuallyPermanent logic)
  
  // Debug sidebar state on route changes
  useEffect(() => {
    console.log(`Sidebar state - Route: ${location.pathname} | Open: ${mobileOpen}`);
  }, [location.pathname, mobileOpen]);

  // Get feature toggles from context
  const { features, isFeatureEnabled } = useFeatureToggles();

  // Generate menu items based on user role and school permissions
  const getMenuItems = () => {
    const menuItems = [
      // STUDENT MENU ITEMS (FOCUSED - ONLY GRADES AND NOTIFICATIONS)
      
      // 1. Student Dashboard
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/app/student',
        roles: ['student'],
        section: 'student',
      },
      
      // 2. View My Grades (Student)
      {
        text: 'My Grades',
        icon: <GradesIcon />,
        path: '/app/student/grades',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableGrades'),
      },
      
      // 3. View My Notifications (Student)
      {
        text: 'My Notifications',
        icon: <NotificationsIcon />,
        path: '/app/student/notifications',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // 4. View My Schedule (Student)
      {
        text: 'My Schedule',
        icon: <ScheduleIcon />,
        path: '/app/student/schedule',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableSchedule'),
      },
      
      // 5. Contact (Student)
      {
        text: 'Contact',
        icon: <ContactSupportIcon />,
        path: '/app/student/contact',
        roles: ['student'],
        section: 'student',
        checkPermission: () => isFeatureEnabled('enableContact'),
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
      
      // STEP 4: TEACHER FUNCTIONS (REFINED - REMOVED MANAGEMENT FUNCTIONS PER USER REQUEST)
      
      // NOTE: Removed Manage Users, Manage Classes, Manage Students, Manage Teachers per user request
      
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
      
      // 10. Received Notifications (Teacher)
      {
        text: 'Received Notifications',
        icon: <NotificationsIcon />,
        path: '/app/teacher/notifications',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableNotifications'),
      },
      
      // NOTE: Removed Manage School Branches per user request
      
      // 12. Schedule (Teacher)
      {
        text: 'Schedule',
        icon: <ScheduleIcon />,
        path: '/app/teacher/schedule',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableSchedule'),
      },
      
      // 13. Contact (Teacher)
      {
        text: 'Contact',
        icon: <ContactSupportIcon />,
        path: '/app/teacher/contact',
        roles: ['teacher'],
        section: 'teacher',
        checkPermission: () => isFeatureEnabled('enableContact'),
      },
      
      // ADMIN MENU ITEMS - REFACTORED (only working features)
      
      // 1. Admin Dashboard
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/app/admin',
        roles: ['admin'],
        section: 'admin',
        description: 'Start your day with a clear overview of your school'
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
      
      // 13. Contact (Admin)
      {
        text: 'Contact',
        icon: <ContactSupportIcon />,
        path: '/app/admin/contact',
        roles: ['admin'],
        section: 'admin',
        checkPermission: () => isFeatureEnabled('enableContact'),
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
      
      // 4. Patch Notes (SuperAdmin)
      {
        text: 'Patch Notes',
        icon: <AnnouncementIcon />,
        path: '/superadmin/patch-notes',
        roles: ['superadmin'],
        section: 'superadmin',
      },
      
      // 5. Notifications (SuperAdmin)
      {
        text: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/superadmin/notifications',
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
    // Store current section in localStorage for persistence across refreshes
    if (actualPath.includes('/superadmin/')) {
      localStorage.setItem('currentSection', 'superadmin');
    } else if (actualPath.includes('/admin/')) {
      localStorage.setItem('currentSection', 'admin');
    } else {
      localStorage.removeItem('currentSection');
    }
    // First navigate to the path
    navigate(actualPath);
    // Always close drawer on mobile after navigation
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

  // Create the drawer content - Matches ParentSidebar visual design
  const drawer = (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Profile Section - Matches ParentSidebar styling */}
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
          {user?.name?.charAt(0)?.toUpperCase() || (isSuperAdminRoute ? 'S' : 'G')}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {user?.name || (isSuperAdminRoute ? 'Super Admin' : 'User')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isSuperAdminRoute ? 'Super Admin Account' : `${user?.role?.charAt(0)?.toUpperCase() || ''}${user?.role?.slice(1) || ''} Account`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>

      {/* Navigation Menu - Matches ParentSidebar styling */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={isPathSelected(item.path)}
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
                  color: isPathSelected(item.path) ? 'white' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
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

      <Divider />

      {/* Profile and Logout - Matches ParentSidebar */}
      <List sx={{ py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              // Navigate to role-specific profile page
              const profilePath = user?.role === 'superadmin' ? '/superadmin/profile' : 
                                 user?.role === 'admin' ? '/app/admin/profile' :
                                 user?.role === 'teacher' ? '/app/teacher/profile' :
                                 user?.role === 'student' ? '/app/student/profile' :
                                 '/app/profile';
              navigate(profilePath);
            }}
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
