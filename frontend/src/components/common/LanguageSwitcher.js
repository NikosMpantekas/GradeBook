import React from 'react';
import { 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Box,
  Typography
} from '@mui/material';
import { 
  Language as LanguageIcon, 
  Check as CheckIcon 
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ variant = 'icon' }) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      nativeName: 'English',
      flag: '🇺🇸'
    },
    { 
      code: 'gr', 
      name: 'Greek', 
      nativeName: 'Ελληνικά',
      flag: '🇬🇷'
    }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('gradebook_language', languageCode);
    handleClose();
  };

  if (variant === 'button') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={handleClick}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            mr: 1
          }}
        >
          <Typography sx={{ mr: 0.5, fontSize: '1.2em' }}>
            {currentLanguage.flag}
          </Typography>
          <LanguageIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              minWidth: 180,
              mt: 1,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.5
              }
            }
          }}
        >
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={i18n.language === language.code}
              sx={{
                display: 'flex',
                alignItems: 'center',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Typography sx={{ fontSize: '1.2em' }}>
                  {language.flag}
                </Typography>
              </ListItemIcon>
              <ListItemText 
                primary={language.nativeName}
                secondary={language.name}
                sx={{ mr: 2 }}
              />
              {i18n.language === language.code && (
                <CheckIcon color="primary" sx={{ ml: 'auto' }} />
              )}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Default icon variant
  return (
    <Tooltip title={t('settings.language', 'Language')}>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 160,
            mt: 1
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={i18n.language === language.code}
          >
            <ListItemIcon>
              <Typography sx={{ fontSize: '1.1em' }}>
                {language.flag}
              </Typography>
            </ListItemIcon>
            <ListItemText primary={language.nativeName} />
            {i18n.language === language.code && (
              <CheckIcon color="primary" sx={{ ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </Tooltip>
  );
};

export default LanguageSwitcher;
