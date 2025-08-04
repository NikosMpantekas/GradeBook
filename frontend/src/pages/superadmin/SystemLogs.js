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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as DebugIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { green, red, orange, blue, grey } from '@mui/material/colors';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { useSelector } from 'react-redux';

const SystemLogs = () => {
  const { user, token } = useSelector((state) => state.auth);
  const theme = useTheme();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [pm2Status, setPm2Status] = useState(null);
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all'
  });
  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

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

  // Format timestamp for console display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (err) {
      return timestamp;
    }
  };

  // Copy log line to clipboard
  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
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

      {/* Console-style Logs Display */}
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
        }}>
          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
            Console Logs (Last 24 hours)
          </Typography>
          {loading && <CircularProgress size={20} />}
        </Box>

        {logs.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="info">
              No logs found. Make sure log files exist in the backend logs directory.
            </Alert>
          </Box>
        ) : (
          <Box sx={{ 
            maxHeight: 600, 
            overflow: 'auto',
            bgcolor: theme.palette.mode === 'dark' ? 'black' : '#f5f5f5',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1.4
          }}>
            {logs.map((log, index) => {
              const logText = log.message || log.raw || '';
              const timestamp = formatTimestamp(log.timestamp);
              const levelColor = getLevelColor(log.level);
              
              return (
                <Box
                  key={index}
                  sx={{
                    p: 1,
                    borderBottom: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100'
                    },
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1
                  }}
                >
                  {/* Timestamp */}
                  <Typography
                    component="span"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'grey.400' : 'grey.600',
                      fontSize: '12px',
                      minWidth: '140px',
                      flexShrink: 0
                    }}
                  >
                    {timestamp}
                  </Typography>
                  
                  {/* Level indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '60px' }}>
                    {getLevelIcon(log.level)}
                    <Typography
                      component="span"
                      sx={{
                        color: levelColor === 'error' ? red[500] :
                               levelColor === 'warning' ? orange[500] :
                               levelColor === 'info' ? blue[500] :
                               levelColor === 'default' ? grey[500] : grey[400],
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      {log.level || 'INFO'}
                    </Typography>
                  </Box>
                  
                  {/* Category */}
                  {log.category && (
                    <Typography
                      component="span"
                      sx={{
                        color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.700',
                        fontSize: '12px',
                        minWidth: '80px',
                        flexShrink: 0
                      }}
                    >
                      [{log.category}]
                    </Typography>
                  )}
                  
                  {/* Message */}
                  <Typography
                    component="span"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'white' : 'black',
                      flex: 1,
                      wordBreak: 'break-word'
                    }}
                  >
                    {logText}
                  </Typography>
                  
                  {/* Copy button */}
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(`${timestamp} [${log.level || 'INFO'}] ${log.category ? `[${log.category}] ` : ''}${logText}`, index)}
                    sx={{ 
                      opacity: 0.6,
                      '&:hover': { opacity: 1 },
                      color: copiedIndex === index ? green[500] : 'inherit'
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SystemLogs; 