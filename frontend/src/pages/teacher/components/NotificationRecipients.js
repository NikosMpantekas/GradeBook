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
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

/**
 * NotificationRecipients component handles the recipient selection UI
 * Simplified to only support "All users" and name search filtering
 */
const NotificationRecipients = ({
  availableUsers,
  selectedRecipients,
  onRecipientsChange,
  error,
  disabled,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, availableUsers]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <>
      {/* Search bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search users"
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={disabled}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={handleClearSearch}
                  edge="end"
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Box>
      
      {/* Recipients Selection */}
      <FormControl 
        fullWidth 
        error={!!error}
        disabled={disabled}
      >
        <InputLabel id="recipients-label">Recipients</InputLabel>
        <Select
          labelId="recipients-label"
          id="recipients"
          multiple
          value={selectedRecipients}
          onChange={onRecipientsChange}
          input={<OutlinedInput label="Recipients" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const selectedUser = availableUsers.find(user => user._id === value);
                return (
                  <Chip 
                    key={value} 
                    label={selectedUser?.name || value} 
                    size="small" 
                  />
                );
              })}
            </Box>
          )}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 300 },
            },
          }}
        >
          {loading ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading users...
            </MenuItem>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No users found</MenuItem>
          )}
        </Select>
        <FormHelperText>
          {error || 'Select specific recipients for your notification'}
        </FormHelperText>
      </FormControl>
    </>
  );
};

export default NotificationRecipients;
