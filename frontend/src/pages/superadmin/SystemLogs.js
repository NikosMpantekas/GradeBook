import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as DebugIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { green, red, orange, blue, grey } from '@mui/material/colors';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { useSelector } from 'react-redux';

const SystemLogs = () => {
  const { user, token } = useSelector((state) => state.auth);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [pm2Status, setPm2Status] = useState(null);
  const [filters, setFilters] = useState({
    lines: 100,
    level: 'all',
    category: 'all'
  });
  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [stats, setStats] = useState({});

  // Load logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: filters
      };

      const response = await axios.get(`${API_URL}/api/superadmin/logs`, config);

      if (response.data && response.data.success) {
        setLogs(response.data.data.logs);
        setAvailableLevels(response.data.data.availableLevels);
        setAvailableCategories(response.data.data.availableCategories);
        setStats({
          totalFiles: response.data.data.totalFiles,
          totalLines: response.data.data.totalLines,
          filteredLines: response.data.data.filteredLines
        });
      } else {
        setError('Failed to load logs');
      }

    } catch (error) {
      console.error('Error loading logs:', error);
      setError(error.response?.data?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  // Load PM2 status
  const loadPM2Status = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${API_URL}/api/superadmin/pm2-status`, config);

      if (response.data && response.data.success) {
        setPm2Status(response.data.data);
      }

    } catch (error) {
      console.error('Error loading PM2 status:', error);
      // Don't show error for PM2 status as it's optional
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadLogs();
    loadPM2Status();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadLogs();
  }, [filters]);

  // Get icon for log level
  const getLevelIcon = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
      case 'CRITICAL':
        return <ErrorIcon color="error" />;
      case 'WARN':
        return <WarningIcon sx={{ color: orange[600] }} />;
      case 'INFO':
        return <InfoIcon color="info" />;
      case 'DEBUG':
        return <DebugIcon sx={{ color: grey[600] }} />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Get color for log level
  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
      case 'CRITICAL':
        return 'error';
      case 'WARN':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (err) {
      return timestamp;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor system performance and error logs
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Log Level</InputLabel>
            <Select
              value={filters.level}
              label="Log Level"
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            >
              <MenuItem value="all">All Levels</MenuItem>
              {availableLevels.map(level => (
                <MenuItem key={level} value={level.toLowerCase()}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {availableCategories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Lines"
            type="number"
            value={filters.lines}
            onChange={(e) => setFilters({ ...filters, lines: e.target.value })}
            sx={{ width: 100 }}
            inputProps={{ min: 10, max: 1000 }}
          />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadLogs}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Stats */}
        {stats.totalFiles > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${stats.totalFiles} Log Files`} color="info" variant="outlined" />
            <Chip label={`${stats.totalLines} Total Lines`} color="primary" variant="outlined" />
            <Chip label={`${stats.filteredLines} Filtered Lines`} color="secondary" variant="outlined" />
          </Box>
        )}
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* PM2 Status */}
      {pm2Status && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            PM2 Process Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {pm2Status.processes?.map((process, index) => (
              <Card key={index} variant="outlined" sx={{ minWidth: 200 }}>
                <CardHeader
                  avatar={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {process.status === 'online' ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </Box>
                  }
                  title={process.name}
                  subheader={`Status: ${process.status}`}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>CPU:</strong> {process.monit?.cpu || 'N/A'}%
                    </Typography>
                    <Typography variant="body2">
                      <strong>Memory:</strong> {process.monit?.memory || 'N/A'} MB
                    </Typography>
                    <Typography variant="body2">
                      <strong>Uptime:</strong> {process.pm2_env?.pm_uptime ? 
                        Math.floor(process.pm2_env.pm_uptime / 1000 / 60) + ' min' : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Logs Display */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Application Logs
          </Typography>
          {loading && <CircularProgress size={20} />}
        </Box>

        {logs.length === 0 ? (
          <Alert severity="info">
            No logs found. Make sure log files exist in the backend logs directory.
          </Alert>
        ) : (
          <List sx={{ maxHeight: 600, overflow: 'auto' }}>
            {logs.map((log, index) => (
              <ListItem key={index} sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 1
              }}>
                <ListItemIcon>
                  {getLevelIcon(log.level)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" component="span">
                        {log.message || log.raw}
                      </Typography>
                      {log.level && (
                        <Chip 
                          label={log.level} 
                          size="small" 
                          color={getLevelColor(log.level)}
                          variant="outlined"
                        />
                      )}
                      {log.category && (
                        <Chip 
                          label={log.category} 
                          size="small" 
                          color="default"
                          variant="outlined"
                        />
                      )}
                      {log.source && (
                        <Chip 
                          label={log.source} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      {log.timestamp && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default SystemLogs; 