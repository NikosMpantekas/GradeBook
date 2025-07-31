import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormHelperText,
  InputAdornment,
  IconButton,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorAccountIcon,
  SelectAll as SelectAllIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../../config/appConfig';

/**
 * NotificationRecipients component with class-based filtering system
 * Implements cascading filters: School Branch → Direction → Subject → Users
 * Supports role-based filtering and "Select All" functionality
 */
const NotificationRecipients = ({
  selectedRecipients,
  onRecipientsChange,
  error,
  disabled,
  currentUserRole = 'admin' // Default to admin if not provided
}) => {
  // Filter states
  const [filterOptions, setFilterOptions] = useState({
    schoolBranches: [],
    directions: [],
    subjects: []
  });
  
  // Selected filter values
  const [selectedFilters, setSelectedFilters] = useState({
    schoolBranch: '',
    direction: '',
    subject: '',
    userRole: 'student' // 'student', 'teacher', 'all'
  });
  
  // User data and search
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Loading states
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterError, setFilterError] = useState('');

  // Get auth token for API calls
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Load users when filters change
  useEffect(() => {
    if (selectedFilters.schoolBranch || selectedFilters.direction || selectedFilters.subject) {
      loadFilteredUsers();
    } else {
      setFilteredUsers([]);
    }
  }, [selectedFilters.schoolBranch, selectedFilters.direction, selectedFilters.subject, selectedFilters.userRole]);

  // Apply search filter to available users
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);

  // Load filter options from backend
  const loadFilterOptions = async () => {
    setLoadingFilters(true);
    setFilterError('');
    
    try {
      console.log('Loading notification filter options...');
      const endpoint = `${API_URL}/api/students/notification/filters`;
      const response = await axios.get(endpoint, getAuthConfig());
      
      console.log('Filter options loaded:', response.data);
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
      setFilterError('Failed to load filter options. Please try again.');
    } finally {
      setLoadingFilters(false);
    }
  };

  // Load filtered users based on selected criteria
  const loadFilteredUsers = async () => {
    setLoadingUsers(true);
    setFilterError('');
    
    try {
      const params = new URLSearchParams();
      if (selectedFilters.schoolBranch) params.append('schoolBranch', selectedFilters.schoolBranch);
      if (selectedFilters.direction) params.append('direction', selectedFilters.direction);
      if (selectedFilters.subject) params.append('subject', selectedFilters.subject);
      if (selectedFilters.userRole) params.append('userRole', selectedFilters.userRole);
      
      console.log('Loading filtered users with params:', params.toString());
      
      const endpoint = `${API_URL}/api/students/notification/filtered?${params}`;
      const response = await axios.get(endpoint, getAuthConfig());
      
      console.log(`Loaded ${response.data.length} filtered users:`, response.data);
      setAllUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error loading filtered users:', error);
      setFilterError('Failed to load users. Please try again.');
      setFilteredUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle filter changes with cascading reset
  const handleFilterChange = (filterType, value) => {
    console.log(`Filter changed: ${filterType} = ${value}`);
    
    setSelectedFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };
      
      // Reset dependent filters when parent filter changes
      if (filterType === 'schoolBranch') {
        newFilters.direction = '';
        newFilters.subject = '';
      } else if (filterType === 'direction') {
        newFilters.subject = '';
      }
      
      return newFilters;
    });
    
    // Clear current selection when filters change
    onRecipientsChange({ target: { value: [] } });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedFilters({
      schoolBranch: '',
      direction: '',
      subject: '',
      userRole: 'student'
    });
    setSearchTerm('');
    onRecipientsChange({ target: { value: [] } });
  };

  // Select all filtered users
  const handleSelectAll = () => {
    const allUserIds = filteredUsers.map(user => user._id);
    onRecipientsChange({ target: { value: allUserIds } });
  };

  // Clear all selections
  const handleClearAll = () => {
    onRecipientsChange({ target: { value: [] } });
  };

  // Get available directions based on selected school branch
  const getAvailableDirections = () => {
    return filterOptions.directions.filter(direction => {
      // For now, show all directions - can be enhanced with branch-specific filtering
      return true;
    });
  };

  // Get available subjects based on selected direction
  const getAvailableSubjects = () => {
    return filterOptions.subjects.filter(subject => {
      // For now, show all subjects - can be enhanced with direction-specific filtering
      return true;
    });
  };

  return (
    <Card sx={{ mb: { xs: 2, sm: 3 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
          <FilterListIcon sx={{ mr: { xs: 0.5, sm: 1 }, color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          <Typography variant="h6" component="h2" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Select Recipients
          </Typography>
        </Box>

        {filterError && (
          <Alert severity="error" sx={{ mb: { xs: 1.5, sm: 2 } }}>
            {filterError}
          </Alert>
        )}

        {/* Role Selection */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            <GroupIcon sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.1rem' } }} />
            User Type
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              row
              sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
              value={selectedFilters.userRole}
              onChange={(e) => handleFilterChange('userRole', e.target.value)}
            >
              <FormControlLabel 
                value="student" 
                control={<Radio />} 
                sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: { xs: 0.25, sm: 0.5 }, fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                    Students
                  </Box>
                }
              />
              {/* Hide teacher and all users options for teachers */}
              {currentUserRole === 'admin' && (
                <>
                  <FormControlLabel 
                    value="teacher" 
                    control={<Radio />} 
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SupervisorAccountIcon sx={{ mr: { xs: 0.25, sm: 0.5 }, fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                        Teachers
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="all" 
                    control={<Radio />} 
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon sx={{ mr: { xs: 0.25, sm: 0.5 }, fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                        All Users
                      </Box>
                    }
                  />
                </>
              )}
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Cascading Filters */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
          gap: { xs: 1.5, sm: 2 }, 
          mb: { xs: 2, sm: 3 } 
        }}>
          {/* School Branch Filter */}
          <FormControl fullWidth disabled={loadingFilters} sx={{ 
            '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } },
            '& .MuiSelect-select': { fontSize: { xs: '0.875rem', sm: '1rem' } }
          }}>
            <InputLabel>School Branch</InputLabel>
            <Select
              value={selectedFilters.schoolBranch}
              onChange={(e) => handleFilterChange('schoolBranch', e.target.value)}
              label="School Branch"
              startAdornment={<SchoolIcon sx={{ mr: { xs: 0.5, sm: 1 }, color: 'action.active', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />}
            >
              <MenuItem value="">
                <em>All Branches</em>
              </MenuItem>
              {filterOptions.schoolBranches.map((branch) => (
                <MenuItem key={branch.value} value={branch.value}>
                  {branch.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Direction Filter */}
          <FormControl fullWidth disabled={loadingFilters} sx={{ 
            '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } },
            '& .MuiSelect-select': { fontSize: { xs: '0.875rem', sm: '1rem' } }
          }}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={selectedFilters.direction}
              onChange={(e) => handleFilterChange('direction', e.target.value)}
              label="Direction"
            >
              <MenuItem value="">
                <em>All Directions</em>
              </MenuItem>
              {getAvailableDirections().map((direction) => (
                <MenuItem key={direction.value} value={direction.value}>
                  {direction.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Subject Filter */}
          <FormControl fullWidth disabled={loadingFilters} sx={{ 
            '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } },
            '& .MuiSelect-select': { fontSize: { xs: '0.875rem', sm: '1rem' } }
          }}>
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedFilters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              label="Subject"
            >
              <MenuItem value="">
                <em>All Subjects</em>
              </MenuItem>
              {getAvailableSubjects().map((subject) => (
                <MenuItem key={subject.value} value={subject.value}>
                  {subject.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Filter Actions */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearFilters}
            disabled={loadingFilters || loadingUsers}
          >
            Clear Filters
          </Button>
          {loadingFilters && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption">Loading filters...</Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />


        {/* Selection Actions */}
        {filteredUsers.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAll}
              disabled={disabled || loadingUsers}
            >
              Select All ({filteredUsers.length})
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearAll}
              disabled={disabled || loadingUsers || selectedRecipients.length === 0}
            >
              Clear Selection
            </Button>
          </Box>
        )}

        {/* Recipients Selection with Integrated Search */}
        <FormControl 
          fullWidth 
          error={!!error}
          disabled={disabled || loadingUsers}
        >
          <InputLabel id="recipients-label">Search and Select Recipients</InputLabel>
          <Select
            labelId="recipients-label"
            id="recipients"
            multiple
            value={selectedRecipients}
            onChange={onRecipientsChange}
            input={<OutlinedInput label="Search and Select Recipients" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const selectedUser = filteredUsers.find(user => user._id === value);
                  return (
                    <Chip 
                      key={value} 
                      label={selectedUser ? `${selectedUser.name} (${selectedUser.role})` : value}
                      size="small"
                      color={selectedUser?.role === 'teacher' ? 'secondary' : 'primary'}
                      onDelete={() => {
                        const newSelected = selectedRecipients.filter(id => id !== value);
                        onRecipientsChange({ target: { value: newSelected } });
                      }}
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={{
              PaperProps: {
                style: { 
                  maxHeight: 400,
                  minWidth: 300
                },
              },
              // Add search functionality to the dropdown
              MenuListProps: {
                sx: {
                  '& .MuiMenuItem-root': {
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                  }
                }
              }
            }}
          >
            {/* Search Field at Top of Dropdown */}
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: '1rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                        edge="end"
                      >
                        <ClearIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                  },
                }}
              />
            </Box>
            
            {loadingUsers ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading users...
              </MenuItem>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {user.role === 'teacher' ? (
                      <SupervisorAccountIcon sx={{ mr: 1, fontSize: '1rem', color: 'secondary.main' }} />
                    ) : (
                      <PersonIcon sx={{ mr: 1, fontSize: '1rem', color: 'primary.main' }} />
                    )}
                    <Box>
                      <Typography variant="body2">{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email} • {user.role}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            ) : searchTerm ? (
              <MenuItem disabled>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No users found matching "{searchTerm}"
                  </Typography>
                  <Button size="small" onClick={handleClearSearch} sx={{ mt: 1 }}>
                    Clear Search
                  </Button>
                </Box>
              </MenuItem>
            ) : selectedFilters.schoolBranch || selectedFilters.direction || selectedFilters.subject ? (
              <MenuItem disabled>
                No users found with the selected filters
              </MenuItem>
            ) : (
              <MenuItem disabled>
                Please select filters to see available users
              </MenuItem>
            )}
          </Select>
          <FormHelperText>
            {error || (
              filteredUsers.length > 0 
                ? `${filteredUsers.length} users available • ${selectedRecipients.length} selected`
                : 'Use filters above to find users from your assigned classes'
            )}
          </FormHelperText>
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default NotificationRecipients;
