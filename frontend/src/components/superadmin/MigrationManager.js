import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, 
  Box, 
  Paper, 
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Collapse
} from '@mui/material';
import {
  UpdateRounded,
  CheckCircleOutline,
  ErrorOutline,
  HourglassEmpty,
  ExpandMore,
  ExpandLess,
  SyncProblem,
  Backup,
  RestoreOutlined
} from '@mui/icons-material';
import { getMigrations, runMigration, reset } from '../../features/migrations/migrationsSlice';

const MigrationManager = () => {
  const dispatch = useDispatch();
  const { migrations, isLoading, isSuccess, currentMigration, migrationResult } = useSelector(
    (state) => state.migrations
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMigration, setSelectedMigration] = useState(null);
  const [expandedResults, setExpandedResults] = useState(false);

  useEffect(() => {
    dispatch(getMigrations());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleRunMigration = (migration) => {
    setSelectedMigration(migration);
    setDialogOpen(true);
  };

  const confirmRunMigration = () => {
    dispatch(runMigration(selectedMigration.id));
    setDialogOpen(false);
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutline color="success" />;
      case 'pending':
        return <HourglassEmpty color="warning" />;
      case 'failed':
        return <ErrorOutline color="error" />;
      default:
        return <SyncProblem color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Database Migrations
          </Typography>
          <Button 
            variant="outlined"
            color="primary"
            startIcon={<UpdateRounded />}
            onClick={() => dispatch(getMigrations())}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Apply database schema updates and migrations when needed. Only run migrations after a system update.
        </Typography>
        
        {isLoading && !currentMigration ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : migrations && migrations.length > 0 ? (
          <List>
            {migrations.map((migration) => (
              <ListItem
                key={migration.id}
                secondaryAction={
                  <Button
                    variant="contained" 
                    color="primary"
                    disabled={migration.status === 'completed' || isLoading}
                    onClick={() => handleRunMigration(migration)}
                  >
                    {migration.status === 'completed' ? 'Already Applied' : 'Apply Migration'}
                  </Button>
                }
                sx={{ 
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getStatusColor(migration.status)}.light` }}>
                    {getStatusIcon(migration.status)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">{migration.name}</Typography>
                      <Chip 
                        label={migration.status} 
                        size="small" 
                        color={getStatusColor(migration.status)}
                        sx={{ ml: 1 }} 
                      />
                    </Box>
                  }
                  secondary={migration.description}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">No migrations available at this time.</Alert>
        )}

        {/* Migration Results Summary */}
        {migrationResult && (
          <Card sx={{ mt: 3, mb: 2 }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">Migration Results</Typography>
                  <Chip 
                    label={migrationResult.success ? "Success" : "Failed"} 
                    color={migrationResult.success ? "success" : "error"}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                  {migrationResult.backup && migrationResult.backup.created && (
                    <Chip
                      icon={<Backup fontSize="small" />} 
                      label="Backup Created" 
                      color="info"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
              action={
                <Button 
                  size="small" 
                  onClick={() => setExpandedResults(!expandedResults)}
                  endIcon={expandedResults ? <ExpandLess /> : <ExpandMore />}
                >
                  {expandedResults ? 'Hide Details' : 'Show Details'}
                </Button>
              }
            />
            <Collapse in={expandedResults}>
              <Divider />
              <CardContent>
                <Typography variant="body2" paragraph>
                  {migrationResult.success ? (
                    `Successfully processed ${migrationResult.totalSchools} schools and updated ${migrationResult.totalAdminsUpdated} admin users.`
                  ) : (
                    `Migration failed: ${migrationResult.error}`
                  )}
                </Typography>
                
                {/* Show backup information */}
                {migrationResult.backup && migrationResult.backup.created && (
                  <Box sx={{ mt: 2, mb: 2, p: 1.5, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Backup fontSize="small" sx={{ mr: 1 }} /> Database Backup Information
                    </Typography>
                    <Typography variant="body2" component="div">
                      A backup of the database was automatically created before running this migration for safety.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, fontFamily: 'monospace', bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                      {migrationResult.backup.path}
                    </Typography>
                    {migrationResult.error && migrationResult.error.includes('restored from backup') && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <RestoreOutlined fontSize="small" sx={{ mr: 1 }} /> 
                          <Typography variant="body2">Database was automatically restored from backup due to migration error</Typography>
                        </Box>
                      </Alert>
                    )}
                  </Box>
                )}

                {migrationResult.success && migrationResult.schoolsProcessed && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">Processed Schools:</Typography>
                    <List dense>
                      {migrationResult.schoolsProcessed.slice(0, 5).map((school, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText
                            primary={`${school.schoolName || 'School ' + index}`}
                            secondary={`Admins: ${school.adminsFound} (Updated: ${school.adminsUpdated})`}
                          />
                        </ListItem>
                      ))}
                      {migrationResult.schoolsProcessed.length > 5 && (
                        <ListItem sx={{ py: 0 }}>
                          <ListItemText
                            primary={`And ${migrationResult.schoolsProcessed.length - 5} more schools...`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Collapse>
          </Card>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>Confirm Migration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to apply the <strong>{selectedMigration?.name}</strong> migration?
          </DialogContentText>
          <Alert icon={<Backup />} severity="info" sx={{ mt: 2, mb: 1 }}>
            A database backup will be created automatically before applying the migration for safety.
          </Alert>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This operation will update database schemas and records. This process cannot be interrupted once started.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmRunMigration} color="primary" variant="contained">
            Apply Migration
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Loading Dialog */}
      <Dialog open={isLoading && !!currentMigration}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <DialogContentText>
            Applying migration: {currentMigration}
          </DialogContentText>
          <DialogContentText variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Please do not close or refresh this page...
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MigrationManager;
