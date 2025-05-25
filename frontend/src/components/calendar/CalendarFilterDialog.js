import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Chip,
  Box,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

const CalendarFilterDialog = ({ open, onClose, filter, onApply, onClear, events = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [localFilter, setLocalFilter] = useState({
    tags: [],
    audience: null
  });
  
  // Extract all unique tags from events
  const allTags = events && events.length > 0
    ? [...new Set(events.flatMap(event => event.tags || []))]
    : [];

  // Extract all unique audience types from events
  const allAudienceTypes = events && events.length > 0
    ? [...new Set(events.map(event => event.audience?.targetType).filter(Boolean))]
    : [];
  
  // Reset local filter when dialog opens
  useEffect(() => {
    if (open) {
      setLocalFilter(filter);
    }
  }, [open, filter]);
  
  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setLocalFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Apply filter and close dialog
  const handleApply = () => {
    onApply(localFilter);
  };
  
  // Clear filter and close dialog
  const handleClear = () => {
    setLocalFilter({
      tags: [],
      audience: null
    });
    onClear();
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1 }} />
          Filter Events
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Tags filter */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Filter by Tags
            </Typography>
            
            <Autocomplete
              multiple
              options={allTags}
              value={localFilter.tags}
              onChange={(e, newValue) => handleFilterChange('tags', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder={allTags.length > 0 ? "Select tags" : "No tags available"}
                  variant="outlined"
                  fullWidth
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
              disabled={allTags.length === 0}
            />
            
            {allTags.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No tags found in the current events.
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          {/* Audience filter */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Filter by Audience Type
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Chip 
                label="All Audiences"
                variant={!localFilter.audience ? "filled" : "outlined"}
                color={!localFilter.audience ? "primary" : "default"}
                onClick={() => handleFilterChange('audience', null)}
                sx={{ '&:hover': { opacity: 0.9 } }}
              />
              
              {['all', 'school', 'direction', 'teacher', 'student'].map(audienceType => {
                const isSelected = localFilter.audience === audienceType;
                const isAvailable = allAudienceTypes.includes(audienceType);
                
                return (
                  <Chip 
                    key={audienceType}
                    label={audienceType.charAt(0).toUpperCase() + audienceType.slice(1)}
                    variant={isSelected ? "filled" : "outlined"}
                    color={isSelected ? "primary" : "default"}
                    disabled={!isAvailable}
                    onClick={() => handleFilterChange('audience', audienceType)}
                    sx={{
                      opacity: isAvailable ? 1 : 0.6,
                      '&:hover': { opacity: 0.9 }
                    }}
                  />
                );
              })}
            </Box>
            
            {allAudienceTypes.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No audience types found in the current events.
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClear} color="secondary">
          Clear Filters
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarFilterDialog;
