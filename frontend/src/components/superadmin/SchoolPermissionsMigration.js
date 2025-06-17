import { useState } from 'react';
import { 
  Box, 
  Button, 
  Alert,
  CircularProgress,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Settings, CheckCircle, Error } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useSelector } from 'react-redux';

/**
 * Component to handle the migration of school feature permissions
 * from the School collection to the SchoolPermissions collection
 */
const SchoolPermissionsMigration = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { token } = useSelector(state => state.auth);

  const runMigration = async () => {
    setLoading(true);
    setResult(null);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Call our migration endpoint
      const response = await axios.post(
        '/api/schools/permissions/migrate', 
        {}, 
        config
      );

      setResult({
        success: true,
        message: 'Migration completed successfully',
        data: response.data
      });

      toast.success('School permissions migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      
      setResult({
        success: false,
        message: error.response?.data?.message || 'Migration failed',
        error: error.response?.data || error.message
      });

      toast.error('School permissions migration failed. See details.');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleConfirmOpen = () => {
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Settings />}
          onClick={handleConfirmOpen}
          disabled={loading}
        >
          {loading ? 'Running Migration...' : 'Run Permissions Migration'}
        </Button>
        
        {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Box>

      {/* Results display */}
      {result && (
        <Box sx={{ mt: 2 }}>
          <Alert 
            severity={result.success ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {result.message}
          </Alert>
          
          {result.success && result.data && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Schools migrated:</strong> {result.data.migratedCount || 0}
              </Typography>
              {result.data.details && (
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  maxHeight: '100px',
                  overflow: 'auto',
                  fontSize: '0.8rem'
                }}>
                  {JSON.stringify(result.data.details, null, 2)}
                </pre>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleConfirmClose}
      >
        <DialogTitle>
          Confirm School Permissions Migration
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will migrate feature permissions from the School collection to the new SchoolPermissions collection.
            Any existing permissions in the SchoolPermissions collection will be preserved.
            This operation is safe and can be run multiple times if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={runMigration} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Migration'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SchoolPermissionsMigration;
