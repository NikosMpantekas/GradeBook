import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, useTheme, useMediaQuery } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import offlineManager from '../utils/offlineManager';
import axios from 'axios';

// Animated Cog Component (copied from Maintenance.js)
const AnimatedCog = ({ size = 120, position = "bottom-right" }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSparks, setShowSparks] = useState(false);

  useEffect(() => {
    const startSpinning = () => {
      setIsSpinning(true);
      setShowSparks(false);
      
      // Stop spinning after 2 seconds
      setTimeout(() => {
        setIsSpinning(false);
        setShowSparks(true);
        
        // Hide sparks after 1 second and restart
        setTimeout(() => {
          setShowSparks(false);
          startSpinning(); // Restart the cycle
        }, 1000);
      }, 2000);
    };

    // Start the cycle
    startSpinning();
  }, []);

  const getPositionStyles = () => {
    switch (position) {
      case "bottom-right":
        return { bottom: -60, right: -60 };
      default:
        return { bottom: -60, right: -60 };
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        ...getPositionStyles(),
        zIndex: 0, // Behind the mockup
      }}
    >
      {/* Main Cog */}
      <Box
        sx={{
          width: size,
          height: size,
          position: "relative",
          animation: isSpinning ? "spin 2s linear infinite" : "none",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
        }}
      >
        <SettingsIcon
          sx={{
            fontSize: size,
            color: "#337ab7",
            filter: "drop-shadow(0 0 8px rgba(51, 122, 183, 0.6))",
            opacity: 0.7, // Make it slightly transparent to be behind
          }}
        />
      </Box>

      {/* Sparks */}
      {showSparks && (
        <>
          {/* Spark 1 */}
          <Box
            sx={{
              position: "absolute",
              top: -20,
              right: -30,
              width: 6,
              height: 6,
              bgcolor: "#FFA500",
              borderRadius: "50%",
              animation: "spark1 0.8s ease-out forwards",
              "@keyframes spark1": {
                "0%": {
                  transform: "translate(0, 0) scale(1)",
                  opacity: 1,
                },
                "100%": {
                  transform: "translate(30px, -40px) scale(0)",
                  opacity: 0,
                },
              },
            }}
          />
          {/* Spark 2 */}
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: -40,
              width: 4,
              height: 4,
              bgcolor: "#FFA500",
              borderRadius: "50%",
              animation: "spark2 0.6s ease-out 0.1s forwards",
              "@keyframes spark2": {
                "0%": {
                  transform: "translate(0, 0) scale(1)",
                  opacity: 1,
                },
                "100%": {
                  transform: "translate(-35px, -30px) scale(0)",
                  opacity: 0,
                },
              },
            }}
          />
          {/* Spark 3 */}
          <Box
            sx={{
              position: "absolute",
              top: 30,
              right: -20,
              width: 5,
              height: 5,
              bgcolor: "#FFA500",
              borderRadius: "50%",
              animation: "spark3 0.7s ease-out 0.2s forwards",
              "@keyframes spark3": {
                "0%": {
                  transform: "translate(0, 0) scale(1)",
                  opacity: 1,
                },
                "100%": {
                  transform: "translate(25px, -35px) scale(0)",
                  opacity: 0,
                },
              },
            }}
          />
          {/* Spark 4 */}
          <Box
            sx={{
              position: "absolute",
              top: -10,
              right: -50,
              width: 3,
              height: 3,
              bgcolor: "#FFA500",
              borderRadius: "50%",
              animation: "spark4 0.9s ease-out 0.3s forwards",
              "@keyframes spark4": {
                "0%": {
                  transform: "translate(0, 0) scale(1)",
                  opacity: 1,
                },
                "100%": {
                  transform: "translate(-40px, -25px) scale(0)",
                  opacity: 0,
                },
              },
            }}
          />
        </>
      )}
    </Box>
  );
};

const DashboardMockup = () => (
  <Box
    sx={{
      width: "100%",
      maxWidth: 420,
      height: 260,
      mx: "auto",
      mt: { xs: 4, md: 0 },
      borderRadius: 4,
      bgcolor: "#181b20",
      boxShadow: "0 4px 24px 0 rgba(51,122,183,0.10)",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      p: 0,
      filter: "blur(0.5px)",
    }}
  >
    {/* Animated Cog */}
    <AnimatedCog size={120} position="bottom-right" />

    <Box
      sx={{
        width: 110,
        height: "100%",
        bgcolor: "#181b20",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        pt: 3,
        px: 2,
        gap: 2,
        borderRight: "1px solid #23262b",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: 36,
          bgcolor: "#353942",
          borderRadius: 2,
          mb: 2,
        }}
      />
      <Box
        sx={{
          width: "100%",
          height: 36,
          bgcolor: "#353942",
          borderRadius: 2,
          mb: 1.5,
        }}
      />
      <Box
        sx={{
          width: "70%",
          height: 18,
          bgcolor: "#23262b",
          borderRadius: 2,
          mb: 1,
        }}
      />
      <Box
        sx={{
          width: "60%",
          height: 14,
          bgcolor: "#23262b",
          borderRadius: 2,
        }}
      />
    </Box>
    <Box
      sx={{
        flex: 1,
        height: "100%",
        bgcolor: "#23262b",
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            bgcolor: "#337ab7",
            borderRadius: "50%",
          }}
        />
        <Box
          sx={{ width: 120, height: 16, bgcolor: "grey.800", borderRadius: 2 }}
        />
        <Box sx={{ flex: 1 }} />
        <Box
          sx={{
            width: 22,
            height: 22,
            bgcolor: "grey.800",
            borderRadius: "50%",
          }}
        />
        <Box
          sx={{
            width: 22,
            height: 22,
            bgcolor: "grey.800",
            borderRadius: "50%",
          }}
        />
        <Box
          sx={{
            width: 22,
            height: 22,
            bgcolor: "grey.800",
            borderRadius: "50%",
          }}
        />
      </Box>
      <Box
        sx={{
          width: 120,
          height: 18,
          bgcolor: "grey.700",
          borderRadius: 2,
          mb: 1,
        }}
      />
      <Box
        sx={{
          width: 180,
          height: 14,
          bgcolor: "grey.800",
          borderRadius: 2,
          mb: 2,
        }}
      />
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Box
          sx={{ flex: 1, height: 60, bgcolor: "#181b20", borderRadius: 3 }}
        />
        <Box
          sx={{ flex: 1, height: 60, bgcolor: "#181b20", borderRadius: 3 }}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Box
          sx={{
            flex: 1,
            height: 36,
            bgcolor: "#23262b",
            borderRadius: 2,
            border: "1px solid #337ab7",
          }}
        />
        <Box
          sx={{
            flex: 1,
            height: 36,
            bgcolor: "#23262b",
            borderRadius: 2,
            border: "1px solid #337ab7",
          }}
        />
        <Box
          sx={{
            flex: 1,
            height: 36,
            bgcolor: "#23262b",
            borderRadius: 2,
            border: "1px solid #337ab7",
          }}
        />
        <Box
          sx={{
            flex: 1,
            height: 36,
            bgcolor: "#23262b",
            borderRadius: 2,
            border: "1px solid #337ab7",
          }}
        />
      </Box>
    </Box>
  </Box>
);

const BackendOfflineDetector = ({ children }) => {
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Listen to global offline manager for backend-specific failures
  useEffect(() => {
    const handleBackendStateChange = (isBackendOffline) => {
      console.log('BackendOfflineDetector: Backend state changed to', isBackendOffline ? 'offline' : 'online');
      setIsBackendOnline(!isBackendOffline);
    };

    // Subscribe to backend offline manager
    offlineManager.addBackendListener(handleBackendStateChange);



    return () => {
      offlineManager.removeBackendListener(handleBackendStateChange);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('BackendOfflineDetector: Current state - isBackendOnline:', isBackendOnline);
  }, [isBackendOnline]);

  // Function to check backend health
  const checkBackendHealth = async () => {
    try {
      setIsChecking(true);
      
      // Try to reach the backend health endpoint
      const response = await axios.get('/api/health', {
        timeout: 5000
      });
      
      if (response.status === 200) {
        setIsBackendOnline(true);
        offlineManager.setOfflineState(false);
        return true;
      } else {
        // Server is responding but with error - likely maintenance
        setIsBackendOnline(false);
        return false;
      }
    } catch (error) {
      console.log('Backend health check failed:', error.message);
      // Don't set offline state here - let the network offline detector handle it
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Handle retry button click
  const handleRetry = async () => {
    await checkBackendHealth();
  };

  // If backend is online, render children normally
  if (isBackendOnline) {
    return children;
  }

  // If backend is offline, show maintenance page as full-screen overlay
  // This should override any other offline states
  console.log('BackendOfflineDetector: Showing maintenance page');

  // Color palette for dark mode (maintenance page is always dark)
  const colors = {
    background: "#181b20",
    appBar: "#23262b",
    card: "#23262b",
    text: "#fff",
    subText: "grey.300",
    footer: "#23262b",
    border: "1px solid #23262b",
    button: "#337ab7",
    buttonHover: "#245a8d",
    icon: "#337ab7",
    warning: "#ff6b35",
  };

  // If backend is offline, show maintenance page as full-screen overlay
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: colors.background,
        zIndex: 9999,
        fontFamily: "Roboto, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        overscrollBehavior: 'none',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: colors.background,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: colors.icon,
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: colors.buttonHover,
        },
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <Grid
            container
            spacing={6}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 4 }}>
                {/* Maintenance Warning */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    p: 2,
                    bgcolor: "rgba(255, 107, 53, 0.1)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 107, 53, 0.3)",
                  }}
                >
                  <WarningIcon sx={{ color: colors.warning, fontSize: 32 }} />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: colors.warning,
                        fontWeight: "bold",
                        mb: 0.5,
                      }}
                    >
                      Συντήρηση Συστήματος
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.subText }}
                    >
                      Εκτελούμε προγραμματισμένη συντήρηση για να βελτιώσουμε την απόδοση του GradeBook.
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="h3"
                  fontWeight="bold"
                  sx={{
                    color: colors.text,
                    mb: 2,
                    fontSize: { xs: 28, md: 36 },
                    lineHeight: 1.2,
                  }}
                >
                  Επιστρέφουμε σύντομα...
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: colors.subText,
                    mb: 4,
                    fontWeight: 400,
                    fontSize: { xs: 16, md: 18 },
                  }}
                >
                  Το GradeBook ή η συγκερκιμένη σελίδα βρίσκεται υπό συντήρηση για να προσθέσουμε νέες λειτουργίες 
                  και να βελτιώσουμε την εμπειρία σας. Ελπίζουμε ότι θα διαρκέσει μόλις μερικά λεπτά. Ευχαριστούμε για την υπομονή σας.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleRetry}
                  disabled={isChecking}
                  startIcon={<RefreshIcon />}
                  sx={{
                    bgcolor: colors.button,
                    color: "white",
                    borderRadius: 8,
                    px: 5,
                    py: 1.7,
                    fontWeight: "bold",
                    fontSize: 18,
                    boxShadow: "0 2px 8px 0 rgba(51,122,183,0.10)",
                    textTransform: "none",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: colors.buttonHover,
                      transform: "translateY(-2px) scale(1.03)",
                    },
                  }}
                >
                  {isChecking ? 'Ελέγχοντας...' : 'Δοκιμάστε Ξανά'}
                </Button>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
              }}
            >
              <DashboardMockup />
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Box
        sx={{
          mt: "auto",
          py: 3,
          bgcolor: colors.footer,
          borderTop: colors.border,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{ color: "grey.400" }}>
          © {new Date().getFullYear()} GradeBook Team.
        </Typography>
      </Box>
    </Box>
  );
};

export default BackendOfflineDetector; 