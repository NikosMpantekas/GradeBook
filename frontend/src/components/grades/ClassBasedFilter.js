import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField
} from '@mui/material';

/**
 * ClassBasedFilter Component
 * A flexible filter component for class-based filtering
 */
const ClassBasedFilter = ({
  filterType,
  value,
  options,
  loading,
  onChange,
  label,
  disabled,
  helperText,
  fullWidth = true
}) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth={fullWidth} variant="outlined" disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
        disabled={disabled || loading}
        endAdornment={loading ? <CircularProgress size={20} /> : null}
      >
        <MenuItem value="">
          <em>All {label}s</em>
        </MenuItem>
        {(options || []).map((option, index) => (
          <MenuItem 
            key={option.value || index} 
            value={option.value || option.label || option}
          >
            {option.label || option.value || option}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <TextField
          variant="outlined"
          size="small"
          InputProps={{
            readOnly: true,
          }}
          sx={{ mt: 1 }}
          value={helperText}
        />
      )}
    </FormControl>
  );
};

export default ClassBasedFilter;
