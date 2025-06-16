import { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  IconButton
} from '@mui/material';
import { 
  PersonAdd, 
  School, 
  AdminPanelSettings, 
  Check as CheckIcon,
  Block as BlockIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  Grade as GradeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { getSchoolOwners, updateSchoolOwnerStatus, reset } from '../../features/superadmin/superAdminSlice';
import LoadingState from '../../components/common/LoadingState';

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { schoolOwners, isLoading, isError, message } = useSelector(
    (state) => state.superAdmin
  );

  const [stats, setStats] = useState({
    totalOwners: 0,
    activeOwners: 0,
    inactiveOwners: 0
  });

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (!user || user.role !== 'superadmin') {
      navigate('/');
      return;
    }

    dispatch(getSchoolOwners());

    // Cleanup function
    return () => {
      dispatch(reset());
    };
  }, [user, navigate, isError, message, dispatch]);

  // Calculate statistics whenever schoolOwners changes
  useEffect(() => {
    if (schoolOwners.length > 0) {
      const activeOwners = schoolOwners.filter(owner => owner.active).length;
      setStats({
        totalOwners: schoolOwners.length,
        activeOwners: activeOwners,
        inactiveOwners: schoolOwners.length - activeOwners
      });
    }
  }, [schoolOwners]);

  if (isLoading) {
    return <LoadingState fullPage={true} message="Loading school owners..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AdminPanelSettings sx={{ mr: 1 }} /> Super Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome to the Super Admin Control Panel
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <School />
              </Avatar>
              <Box>
                <Typography variant="h4">{stats.totalOwners}</Typography>
                <Typography variant="body2" color="text.secondary">Total School Owners</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%', bgcolor: 'success.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <CheckIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{stats.activeOwners}</Typography>
                <Typography variant="body2">Active Schools</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%', bgcolor: 'error.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                <BlockIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{stats.inactiveOwners}</Typography>
                <Typography variant="body2">Inactive Schools</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/superadmin/new-school-owner')}
          size="large"
        >
          Create New School Owner
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          School Owners
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {schoolOwners.length > 0 ? (
          <Grid container spacing={2}>
            {schoolOwners.map((owner) => (
              <Grid item xs={12} sm={6} md={4} key={owner._id}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: owner.active ? 'success.main' : 'error.main' }}>
                        {owner.name.charAt(0)}
                      </Avatar>
                    }
                    title={owner.name}
                    subheader={owner.email}
                    action={
                      <Chip 
                        label={owner.active ? 'Active' : 'Disabled'}
                        color={owner.active ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <School fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {owner.school ? (typeof owner.school === 'object' ? owner.school.name : 'School ID: ' + owner.school) : 'No School Assigned'}
                    </Typography>
                    
                    {owner.adminPermissions && (
                      <Box sx={{ mt: 1, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          icon={<GradeIcon fontSize="small" />}
                          label="Grades"
                          variant={owner.adminPermissions.canManageGrades ? "default" : "outlined"}
                          color={owner.adminPermissions.canManageGrades ? "primary" : "default"}
                          sx={{ opacity: owner.adminPermissions.canManageGrades ? 1 : 0.6 }}
                        />
                        <Chip
                          size="small"
                          icon={<NotificationsIcon fontSize="small" />}
                          label="Notif."
                          variant={owner.adminPermissions.canSendNotifications ? "default" : "outlined"}
                          color={owner.adminPermissions.canSendNotifications ? "primary" : "default"}
                          sx={{ opacity: owner.adminPermissions.canSendNotifications ? 1 : 0.6 }}
                        />
                        <Chip
                          size="small"
                          icon={<SettingsIcon fontSize="small" />}
                          label="Features"
                          component={RouterLink}
                          to={`/superadmin/school-owner/${owner._id}`}
                          clickable
                          color="secondary"
                        />
                      </Box>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        variant="outlined"
                        color={owner.active ? 'error' : 'success'}
                        size="small"
                        startIcon={owner.active ? <BlockIcon /> : <CheckIcon />}
                        onClick={() => {
                          dispatch(updateSchoolOwnerStatus({
                            id: owner._id,
                            statusData: { active: !owner.active }
                          }))
                            .unwrap()
                            .then(() => {
                              toast.success(`School owner ${owner.active ? 'disabled' : 'enabled'} successfully`);
                            })
                            .catch((error) => {
                              toast.error(`Error: ${error}`);
                            });
                        }}
                      >
                        {owner.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        component={RouterLink}
                        to={`/superadmin/school-owner/${owner._id}`}
                      >
                        Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No school owners found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Create your first school owner to get started
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default SuperAdminDashboard;
