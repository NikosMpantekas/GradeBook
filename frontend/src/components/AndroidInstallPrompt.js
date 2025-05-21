import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, styled, Snackbar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/GetApp';
import InfoIcon from '@mui/icons-material/Info';
import Alert from '@mui/material/Alert';

// Styled components for a more attractive UI
const InstallButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#3f51b5',
  color: 'white',
  fontWeight: 'bold',
  padding: '10px 20px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#303f9f',
  },
}));

const StepBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '16px',
  padding: '10px',
  borderRadius: '8px',
  backgroundColor: '#f5f5f5',
}));

const StepNumber = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: '#3f51b5',
  color: 'white',
  fontWeight: 'bold',
  marginRight: '16px',
  flexShrink: 0,
}));

const AndroidInstallPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);
  const [installStatus, setInstallStatus] = useState({ show: false, message: '', severity: 'info' });
  const [debugInfo, setDebugInfo] = useState('');

  // Store the beforeinstallprompt event in window for debugging access
  if (typeof window !== 'undefined') {
    window.pwaInstallEvent = installEvent;
  }

  useEffect(() => {
    // Only show on Android devices that don't have the app installed
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Check if already installed as PWA
    const isInStandaloneMode = () => 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone || 
      document.referrer.includes('android-app://');
    
    const isInstalled = isInStandaloneMode();
    setDebugInfo(`Device: ${isAndroid ? 'Android' : 'Non-Android'}, Installed: ${isInstalled}`);
    console.log(`[PWA] Device detection - Android: ${isAndroid}, Installed: ${isInstalled}`);

    // Force debug information to console to help troubleshoot
    console.log('[PWA] Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
    console.log('[PWA] navigator.standalone:', window.navigator.standalone);
    console.log('[PWA] Service Worker supported:', 'serviceWorker' in navigator);
    console.log('[PWA] User Agent:', navigator.userAgent);
    
    // Check PWA requirements
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        console.log('[PWA] Service Worker registration:', registration);
      }).catch(err => {
        console.error('[PWA] Service Worker registration error:', err);
      });
    }
    
    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    console.log('[PWA] Manifest link:', manifestLink?.href);

    if (isAndroid && !isInstalled) {
      console.log('[PWA] Android device detected, not installed yet');
      
      // Show prompt after 3 seconds if they haven't dismissed it before
      const hasPromptBeenDismissed = localStorage.getItem('android_install_prompt_dismissed');
      
      if (!hasPromptBeenDismissed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
    
    // Listen for beforeinstallprompt event to capture it
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA] Before install prompt fired', e);
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallEvent(e);
      // Show install status
      setInstallStatus({
        show: true,
        message: 'App is installable! Open the menu to install.',
        severity: 'success'
      });
      // Show the install button
      setIsOpen(true);
    };
    
    // Listen for appinstalled event
    const handleAppInstalled = (e) => {
      console.log('[PWA] App was installed', e);
      setInstallStatus({
        show: true,
        message: 'App was successfully installed!',
        severity: 'success'
      });
      // Hide the install prompt
      setIsOpen(false);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('android_install_prompt_dismissed', 'true');
    
    // Reset after 1 day
    setTimeout(() => {
      localStorage.removeItem('android_install_prompt_dismissed');
    }, 24 * 60 * 60 * 1000);
  };

  const handleInstall = async () => {
    try {
      if (installEvent) {
        console.log('[PWA] Triggering installation prompt...');
        
        // Show the install prompt
        await installEvent.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await installEvent.userChoice;
        
        console.log('[PWA] User installation choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
          setInstallStatus({
            show: true,
            message: 'Installation in progress!',
            severity: 'info'
          });
        } else {
          console.log('[PWA] User dismissed the install prompt');
          setInstallStatus({
            show: true,
            message: 'Installation cancelled. You can install later from the browser menu.',
            severity: 'warning'
          });
        }
        
        // Clear the saved prompt since it can't be used twice
        setInstallEvent(null);
      } else {
        console.log('[PWA] No installation prompt available');
        // Try manual installation instructions
        setInstallStatus({
          show: true,
          message: 'Please install manually: tap menu (⋮) then "Add to Home Screen"',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('[PWA] Installation error:', error);
      setInstallStatus({
        show: true,
        message: 'Installation failed. Try again from browser menu.',
        severity: 'error'
      });
    }
    
    setIsOpen(false);
  };
  
  const handleDebug = () => {
    // Force re-check if the app can be installed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('[PWA Debug] Service Worker registrations:', registrations);
      });
    }
    
    // Clear dismissal flag to show prompt again
    localStorage.removeItem('android_install_prompt_dismissed');
    
    setInstallStatus({
      show: true,
      message: 'Debug mode activated. Checking installation eligibility...',
      severity: 'info'
    });
    
    // Show dialog again if closed
    setIsOpen(true);
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={handleClose}
        PaperProps={{
          style: {
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#3f51b5', color: 'white', pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <img 
                src="/logo192.png" 
                alt="GradeBook" 
                style={{ width: '40px', height: '40px', marginRight: '12px', background: 'white', borderRadius: '8px', padding: '4px' }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
              <Typography variant="h6" fontWeight="bold">
                Install GradeBook App
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleDebug} sx={{ color: 'white' }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {debugInfo && (
            <Box mb={2} p={1} bgcolor="#f5f5f5" borderRadius={1} fontSize="12px" fontFamily="monospace">
              <Typography variant="caption" component="div" color="textSecondary">
                {debugInfo}
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            Install GradeBook as an app on your Android device for a better experience:
          </Typography>
          
          <StepBox>
            <StepNumber>1</StepNumber>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Tap the "Install" button below
              </Typography>
              <Typography variant="body2">
                This will trigger the Android installation prompt
              </Typography>
            </Box>
          </StepBox>
          
          <StepBox>
            <StepNumber>2</StepNumber>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Tap "Add to Home Screen"
              </Typography>
              <Typography variant="body2">
                When prompted by your browser
              </Typography>
            </Box>
          </StepBox>
          
          <StepBox>
            <StepNumber>3</StepNumber>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Open from your home screen
              </Typography>
              <Typography variant="body2">
                Enjoy a full-screen, app-like experience!
              </Typography>
            </Box>
          </StepBox>
          
          <Box mt={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
            <Typography variant="body2" color="textSecondary">
              <strong>Alternative method:</strong> Click ⋮ (menu) in your browser and select "Add to Home Screen"
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
          <Button 
            onClick={handleClose} 
            color="inherit"
            startIcon={<CloseIcon />}
          >
            Later
          </Button>
          <InstallButton 
            onClick={handleInstall} 
            variant="contained" 
            startIcon={<DownloadIcon />}
          >
            Install Now
          </InstallButton>
        </DialogActions>
      </Dialog>
      
      {/* Status Notification */}
      <Snackbar 
        open={installStatus.show} 
        autoHideDuration={6000} 
        onClose={() => setInstallStatus({...installStatus, show: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setInstallStatus({...installStatus, show: false})} 
          severity={installStatus.severity}
          sx={{ width: '100%' }}
        >
          {installStatus.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AndroidInstallPrompt;
