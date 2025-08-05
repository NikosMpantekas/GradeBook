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
  Collapse,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [streaming, setStreaming] = useState(false);
  const logsContainerRef = useRef(null);

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

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

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
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (err) {
      // Try to extract timestamp from raw log line
      const timestampMatch = timestamp.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      if (timestampMatch) {
        try {
          const date = new Date(timestampMatch[1]);
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
        } catch (err2) {
          return timestamp;
        }
      }
      return timestamp;
    }
  };

  // Check if log line indicates a build step
  const isBuildStep = (text) => {
    const buildStepPatterns = [
      /step\s+\d+\/\d+:/i,
      /installing\s+dependencies/i,
      /building\s+application/i,
      /deploying/i,
      /compiling/i,
      /bundling/i
    ];
    return buildStepPatterns.some(pattern => pattern.test(text));
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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
          
          <Button
            variant={autoScroll ? "contained" : "outlined"}
            onClick={() => setAutoScroll(!autoScroll)}
            size="small"
            sx={{ ml: 1 }}
          >
            {autoScroll ? 'Stop Scroll' : 'Auto Scroll'}
          </Button>

          <Button
            variant={streaming ? "contained" : "outlined"}
            onClick={() => setStreaming(!streaming)}
            size="small"
            sx={{ ml: 1 }}
            startIcon={streaming ? <PauseIcon /> : <PlayIcon />}
          >
            {streaming ? 'Stop Stream' : 'Live Stream'}
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
            {streaming && (
              <Chip 
                label="LIVE" 
                size="small" 
                color="error" 
                sx={{ 
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
            )}
            {loading && <CircularProgress size={20} sx={{ color: '#e6e6e6' }} />}
          </Box>
        </Box>

        {logs.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="info">
              {filters.level !== 'all' || filters.category !== 'all' 
                ? 'No logs match your current filters. Try adjusting your filters and refresh.'
                : 'No logs found. Make sure log files exist in the backend logs directory.'
              }
            </Alert>
          </Box>
        ) : (
          <Box 
            ref={logsContainerRef}
            sx={{ 
              maxHeight: 600, 
              overflow: 'auto',
              bgcolor: '#23272e',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#e6e6e6',
              p: 0
            }}
          >
            {logs.map((log, index) => {
              const logText = parseAnsiColors(log.message || log.raw || '');
              const timestamp = formatTimestamp(log.timestamp || logText);
              const levelColor = getLevelColor(log.level);
              const isBuildStepLine = isBuildStep(logText);
              const sectionId = `section-${Math.floor(index / 10)}`; // Group every 10 lines
              const isSectionExpanded = expandedSections.has(sectionId);
              
              return (
                <React.Fragment key={index}>
                  {/* Build Step Header */}
                  {isBuildStepLine && (
                    <Box
                      sx={{
                        p: '8px 12px',
                        bgcolor: '#2c313a',
                        borderBottom: '1px solid #3a3f4b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#343a44'
                        }
                      }}
                      onClick={() => toggleSection(sectionId)}
                    >
                      <Typography
                        sx={{
                          color: '#e6e6e6',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {logText}
                      </Typography>
                      <IconButton size="small" sx={{ color: '#e6e6e6' }}>
                        {isSectionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  )}
                  
                  {/* Regular Log Line */}
                  <Collapse in={!isBuildStepLine || isSectionExpanded}>
                    <Box
                      sx={{
                        p: '4px 12px',
                        borderBottom: '1px solid #3a3f4b',
                        '&:hover': {
                          bgcolor: '#2c313a'
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
                          color: '#666',
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
                          color: '#888',
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
                            color: '#aaa',
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
                          color: '#e6e6e6',
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
                          color: copiedIndex === index ? '#4caf50' : '#e6e6e6',
                          p: 0.5
                        }}
                      >
                        <CopyIcon sx={{ fontSize: '14px' }} />
                      </IconButton>
                    </Box>
                  </Collapse>
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SystemLogs; 