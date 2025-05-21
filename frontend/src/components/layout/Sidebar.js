import React, { useEffect } from 'react';
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
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

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

  // Generate menu items based on user role
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
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || user.role === 'teacher' || (user.role === 'secretary' && user.secretaryPermissions?.canManageGrades),
      },
      {
        text: 'Add Grade',
        icon: <AddIcon />,
        path: '/app/teacher/grades/create',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || user.role === 'teacher' || (user.role === 'secretary' && user.secretaryPermissions?.canManageGrades),
      },
      {
        text: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/app/teacher/notifications',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || 
                                 (user.role === 'teacher' && user.canSendNotifications !== false) || 
                                 (user.role === 'secretary' && user.secretaryPermissions?.canSendNotifications)
      },
      {
        text: 'Send Notification',
        icon: <AddIcon />,
        path: '/app/teacher/notifications/create',
        roles: ['teacher', 'admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || 
                                 (user.role === 'teacher' && user.canSendNotifications !== false) || 
                                 (user.role === 'secretary' && user.secretaryPermissions?.canSendNotifications)
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
        text: 'Manage Directions',
        icon: <DirectionsIcon />,
        path: '/app/admin/directions',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageDirections),
      },
      {
        text: 'Manage Subjects',
        icon: <SubjectsIcon />,
        path: '/app/admin/subjects',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canManageSubjects),
      },
      {
        text: 'Student Progress Tracking',
        icon: <AssessmentIcon />,
        path: '/app/admin/progress',
        roles: ['admin', 'secretary'],
        checkPermission: (user) => user.role === 'admin' || (user.role === 'secretary' && user.secretaryPermissions?.canAccessStudentProgress),
      },

      {
        text: 'Contact Messages',
        icon: <EmailIcon />,
        path: '/app/admin/contact',
        roles: ['admin'],
      },
      // Profile is available to all users
      {
        text: 'Profile',
        icon: <PersonIcon />,
        path: '/app/profile',
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
    
    // Handle dashboard paths that should stay highlighted when navigating subpages
    if (itemPath === '/superadmin/dashboard' && location.pathname.startsWith('/superadmin') && 
        !location.pathname.includes('/new-school-owner')) {
      return true;
    }
    
    if (itemPath === '/app/admin' && location.pathname.startsWith('/app/admin') && 
        location.pathname === '/app/admin') {
      return true;
    }
    
    // Regular subpath highlighting for menu items with children
    if (itemPath !== '/' && itemPath !== '/app/dashboard' && 
        location.pathname.startsWith(itemPath + '/')) {
      return true;
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
        variant={isActuallyPermanent ? "permanent" : "persistent"}
        open={mobileOpen}
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
