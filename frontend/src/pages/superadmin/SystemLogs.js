import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
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

  // Load data on component mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadLogs();
  }, [filters]);

  // Get color for log level
  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
      case 'CRITICAL':
        return '#ff6b6b';
      case 'WARN':
        return '#ffa726';
      case 'INFO':
        return '#42a5f5';
      case 'DEBUG':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  };

  // Format timestamp for console display (Netlify style)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
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



      {/* Netlify-style Console Logs Display */}
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
            System Logs (Last 24 hours)
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
            bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: 1.5,
            color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333'
          }}>
            {logs.map((log, index) => {
              const logText = log.message || log.raw || '';
              const timestamp = formatTimestamp(log.timestamp);
              const levelColor = getLevelColor(log.level);
              
              return (
                <Box
                  key={index}
                  sx={{
                    p: '4px 12px',
                    borderBottom: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? '#333' : '#e0e0e0',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f0f0'
                    },
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    minHeight: '20px'
                  }}
                >
                  {/* Line number */}
                  <Typography
                    component="span"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#666' : '#999',
                      fontSize: '11px',
                      minWidth: '40px',
                      flexShrink: 0,
                      textAlign: 'right'
                    }}
                  >
                    {index + 1}
                  </Typography>
                  
                  {/* Timestamp */}
                  <Typography
                    component="span"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#888' : '#666',
                      fontSize: '11px',
                      minWidth: '80px',
                      flexShrink: 0
                    }}
                  >
                    {timestamp}:
                  </Typography>
                  
                  {/* Level */}
                  <Typography
                    component="span"
                    sx={{
                      color: levelColor,
                      fontSize: '11px',
                      fontWeight: 'bold',
                      minWidth: '50px',
                      flexShrink: 0,
                      textTransform: 'uppercase'
                    }}
                  >
                    [{log.level || 'INFO'}]
                  </Typography>
                  
                  {/* Category */}
                  {log.category && (
                    <Typography
                      component="span"
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#aaa' : '#666',
                        fontSize: '11px',
                        minWidth: '60px',
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
                      color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333',
                      flex: 1,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {logText}
                  </Typography>
                  
                  {/* Copy button */}
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(`${timestamp}: [${log.level || 'INFO'}] ${log.category ? `[${log.category}] ` : ''}${logText}`, index)}
                    sx={{ 
                      opacity: 0.4,
                      '&:hover': { opacity: 0.8 },
                      color: copiedIndex === index ? '#4caf50' : 'inherit',
                      p: 0.5
                    }}
                  >
                    <CopyIcon sx={{ fontSize: '14px' }} />
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