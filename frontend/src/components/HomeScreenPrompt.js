import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  useTheme
} from '@mui/material';
import { Close as CloseIcon, AddToHomeScreen, Download } from '@mui/icons-material';

const HomeScreenPrompt = () => {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const theme = useTheme();

  // Check if the app is already installed
  const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;

  useEffect(() => {
    // Don't show if app is already installed or we're not on a mobile device
    if (isAppInstalled || !isMobileDevice()) {
      return;
    }

    // Check if we should show the prompt based on user's previous choice
    const promptShownBefore = localStorage.getItem('homeScreenPromptShown');
    const lastPromptDate = localStorage.getItem('homeScreenPromptDate');
    const now = new Date().getTime();
    
    // If the prompt was shown before, only show it again after 14 days
    if (promptShownBefore) {
      if (lastPromptDate && now - parseInt(lastPromptDate, 10) < 14 * 24 * 60 * 60 * 1000) {
        return; // Don't show if less than 14 days have passed
      }
    }

    // Detect iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // For Android and other browsers that support the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the prompt after a delay
      setTimeout(() => setOpen(true), 2000);
    });

    // For iOS devices (which don't support beforeinstallprompt)
    if (isIOSDevice && !promptShownBefore) {
      // Show the iOS instructions after a delay
      setTimeout(() => setOpen(true), 2000);
    }

    // Save that we've shown the prompt
    localStorage.setItem('homeScreenPromptShown', 'true');
    localStorage.setItem('homeScreenPromptDate', now.toString());

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
    };
  }, [isAppInstalled]);

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddToHomeScreen = async () => {
    if (!isIOS && deferredPrompt) {
      // For Android and other browsers that support beforeinstallprompt
      try {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // Clear the saved prompt since it can't be used again
        setDeferredPrompt(null);
        setOpen(false);
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    }
    // For iOS, the dialog will remain open with instructions
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          width: '90%',
          maxWidth: '400px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Add to Home Screen</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <AddToHomeScreen fontSize="large" color="primary" sx={{ fontSize: 60, mb: 2 }} />
          
          <Typography variant="body1" textAlign="center" gutterBottom>
            Add GradeBook to your home screen for a better experience!
          </Typography>
          
          {isIOS ? (
            <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
              <Typography variant="body2" textAlign="center">
                1. Tap the <b>Share</b> button at the bottom of your browser
              </Typography>
              <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                2. Scroll down and tap <b>"Add to Home Screen"</b>
              </Typography>
              <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                3. Tap <b>"Add"</b> in the top right corner
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
              Click the button below to add this app to your home screen for quick access.
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
        {!isIOS && (
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            onClick={handleAddToHomeScreen}
            startIcon={<Download />}
          >
            Add to Home Screen
          </Button>
        )}
        
        {isIOS && (
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleClose}
          >
            Got it
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default HomeScreenPrompt;
