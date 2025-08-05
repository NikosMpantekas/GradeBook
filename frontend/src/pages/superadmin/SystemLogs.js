import React, { useState, useEffect, useRef } from 'react';
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
  useTheme,
  Chip
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
  
  // State management (optimized for memory)
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 100, // Reduced from loading all logs
    total: 0,
    hasMore: true
  });
  const [displayedLogs, setDisplayedLogs] = useState([]); // Only logs currently displayed
  const logsContainerRef = useRef(null);

  // Load logs (optimized with pagination)
  const loadLogs = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          ...filters,
          limit: pagination.limit,
          offset: reset ? 0 : pagination.page * pagination.limit
        }
      };

      const response = await axios.get(`${API_URL}/api/superadmin/logs`, config);

      if (response.data && response.data.success) {
        const newLogs = response.data.data.logs.reverse();
        
        if (reset) {
          // Reset pagination and logs
          setLogs(newLogs);
          setDisplayedLogs(newLogs.slice(0, 50)); // Only show first 50 logs initially
          setPagination(prev => ({ ...prev, page: 0, total: response.data.data.totalLines }));
        } else {
          // Append new logs
          setLogs(prev => [...prev, ...newLogs]);
          setDisplayedLogs(prev => [...prev, ...newLogs].slice(0, Math.min(100, prev.length + newLogs.length)));
          setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
        
        setAvailableLevels(response.data.data.availableLevels);
        setAvailableCategories(response.data.data.availableCategories);
        setStats({
          totalFiles: response.data.data.totalFiles,
          totalLines: response.data.data.totalLines,
          filteredLines: response.data.data.filteredLines
        });
        
        // Check if there are more logs
        setPagination(prev => ({
          ...prev,
          hasMore: newLogs.length === pagination.limit
        }));
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
  
  // Load more logs
  const loadMoreLogs = () => {
    if (!loading && pagination.hasMore) {
      loadLogs(false);
    }
  };



  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadLogs();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Load data on component mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Reload when filters change (reset pagination)
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 0, hasMore: true }));
    loadLogs(true); // Reset logs when filters change
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

  // Parse ANSI color codes and convert to React styles
  const parseAnsiColors = (text) => {
    if (!text) return text;
    
    // Simple ANSI color parsing (can be enhanced with a library like ansi-to-react)
    const ansiRegex = /\x1b\[(\d+(?:;\d+)*)?m/g;
    let result = text;
    
    // Remove ANSI codes for now (can be enhanced later)
    result = result.replace(ansiRegex, '');
    
    return result;
  };

  // Format timestamp for console display (Netlify style)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // If it's already a Date object or valid timestamp
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
    } catch (err) {
      // Continue to other parsing methods
    }
    
    // Try to extract timestamp from raw log line
    const timestampMatch = timestamp.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
    if (timestampMatch) {
      try {
        const date = new Date(timestampMatch[1]);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        }
      } catch (err2) {
        // Continue to fallback
      }
    }
    
    // Try to extract ISO timestamp without milliseconds
    const isoMatch = timestamp.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
    if (isoMatch) {
      try {
        const date = new Date(isoMatch[1]);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        }
      } catch (err2) {
        // Continue to fallback
      }
    }
    
    // Try to extract date from various formats
    const dateMatch = timestamp.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    if (dateMatch) {
      try {
        const date = new Date(dateMatch[1].replace(' ', 'T'));
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        }
      } catch (err2) {
        // Continue to fallback
      }
    }
    
    // If all else fails, return current time
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
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
          
          <Button
            variant={autoRefresh ? "contained" : "outlined"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="small"
            sx={{ ml: 1 }}
          >
            {autoRefresh ? 'Stop Auto' : 'Auto Refresh'}
          </Button>
          

        </Box>

        {/* Stats */}
        {stats.totalFiles > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              {stats.totalFiles} Log Files • {stats.totalLines} Total Lines • {stats.filteredLines} Filtered Lines
            </Typography>
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
          bgcolor: '#23272e',
          color: '#e6e6e6'
        }}>
          <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#e6e6e6' }}>
            System Logs (Last 24 hours)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {loading && <CircularProgress size={20} sx={{ color: '#e6e6e6' }} />}
          </Box>
        </Box>

      {displayedLogs.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            {loading ? 'Loading logs...' : (
              filters.level !== 'all' || filters.category !== 'all' 
                ? 'No logs match your current filters. Try adjusting your filters and refresh.'
                : 'No logs found. Make sure log files exist in the backend logs directory.'
            )}
          </Alert>
        </Box>
      ) : (
        <>
          <Box 
            ref={logsContainerRef}
            sx={{ 
              maxHeight: 500, 
              overflow: 'auto',
              bgcolor: '#23272e',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#e6e6e6',
              p: 0
            }}
          >
            {displayedLogs.map((log, index) => {
              const logText = parseAnsiColors(log.message || log.raw || '');
              const timestamp = formatTimestamp(log.timestamp || logText);
              const levelColor = getLevelColor(log.level);
              
              // Determine text color based on log level
              let textColor = '#e6e6e6'; // default
              if (log.level && log.level.toLowerCase().includes('warn')) {
                textColor = '#ffeb3b'; // yellow for warnings
              } else if (log.level && log.level.toLowerCase().includes('error')) {
                textColor = '#ff6b6b'; // red for errors
              }
              
              return (
                <Box
                  key={index}
                  sx={{
                    p: '2px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    minHeight: '18px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    color: textColor
                  }}
                >
                  {/* Line number */}
                  <Typography
                    component="span"
                    sx={{
                      color: '#666',
                      fontSize: '13px',
                      minWidth: '35px',
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
                      color: '#888',
                      fontSize: '13px',
                      minWidth: '90px',
                      flexShrink: 0
                    }}
                  >
                    {timestamp}:
                  </Typography>
                  
                  {/* Message */}
                  <Typography
                    component="span"
                    sx={{
                      color: textColor,
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
                    onClick={() => copyToClipboard(`${timestamp}: ${logText}`, index)}
                    sx={{ 
                      opacity: 0.4,
                      '&:hover': { opacity: 0.8 },
                      color: copiedIndex === index ? '#4caf50' : '#e6e6e6',
                      p: 0.5
                    }}
                  >
                    <CopyIcon sx={{ fontSize: '14px' }} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
          
          {/* Load More Button */}
          {pagination.hasMore && (
            <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #333' }}>
              <Button
                variant="outlined"
                onClick={loadMoreLogs}
                disabled={loading}
                sx={{ color: '#e6e6e6', borderColor: '#555' }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1, color: '#e6e6e6' }} />
                    Loading...
                  </>
                ) : (
                  `Load More (${logs.length - displayedLogs.length} remaining)`
                )}
              </Button>
            </Box>
          )}
          
          {/* Memory Usage Info */}
          <Box sx={{ p: 1, fontSize: '12px', color: '#666', textAlign: 'center' }}>
            Showing {displayedLogs.length} of {stats.filteredLines || 0} logs (Memory optimized)
          </Box>
        </>
      )}
    </Paper>
  </Box>
);
};

export default SystemLogs; 