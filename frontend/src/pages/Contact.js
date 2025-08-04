import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import EmailIcon from "@mui/icons-material/Email";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";
import { API_URL } from "../config/appConfig";

// Security utilities
const SECURITY_CONFIG = {
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_SUBJECT_LENGTH: 200,
  MAX_MESSAGE_LENGTH: 2000,
  RATE_LIMIT_DURATION: 60000, // 1 minute
  MAX_ATTEMPTS: 3,
  ALLOWED_EMAIL_DOMAINS: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'], // Optional: restrict to common domains
};

// Input sanitization function
const sanitizeInput = (input, maxLength = 100, allowSpaces = false) => {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script tags and javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Only trim whitespace if spaces are not allowed
  if (!allowSpaces) {
    sanitized = sanitized.trim();
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

// Email validation function
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= SECURITY_CONFIG.MAX_EMAIL_LENGTH;
};

// Rate limiting utility
const useRateLimit = () => {
  const attemptsRef = useRef([]);
  
  const isRateLimited = () => {
    const now = Date.now();
    // Remove old attempts
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < SECURITY_CONFIG.RATE_LIMIT_DURATION
    );
    
    return attemptsRef.current.length >= SECURITY_CONFIG.MAX_ATTEMPTS;
  };
  
  const recordAttempt = () => {
    attemptsRef.current.push(Date.now());
  };
  
  const getRemainingTime = () => {
    if (attemptsRef.current.length === 0) return 0;
    const oldestAttempt = Math.min(...attemptsRef.current);
    const elapsed = Date.now() - oldestAttempt;
    return Math.max(0, SECURITY_CONFIG.RATE_LIMIT_DURATION - elapsed);
  };
  
  return { isRateLimited, recordAttempt, getRemainingTime };
};

const Logo = () => {
  return (
    <Button
      href="/home"
      sx={{
        textTransform: "none",
        p: 0,
        minWidth: 0,
        "&:hover": {
          bgcolor: "transparent",
          color: "#337ab7",
        },
      }}
    >
      <Box
        sx={{
          fontWeight: 100,
          fontSize: { xs: 28, sm: 32, md: 34, lg: 36 },
          color: "#337ab7",
          letterSpacing: 1,
          mr: 2,
          fontFamily: "Roboto, Arial, sans-serif",
        }}
      >
        GradeBook
      </Box>
    </Button>
  );
};

const navLinks = [
  { label: "Πίνακας Ελέγχου", href: "/login" },
  { label: "Σχετικά με εμάς", href: "/about" },
  { label: "Επικοινωνία", href: "/contact" },
];

const Contact = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  
  // Rate limiting
  const { isRateLimited, recordAttempt, getRemainingTime } = useRateLimit();
  
  // CSRF token (in a real app, this would be generated server-side)
  const [csrfToken] = useState(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  });

  const handleDrawerToggle = () => setDrawerOpen((prev) => !prev);
  const handleToggleDarkMode = () => setDarkMode((prev) => !prev);

  const colors = darkMode
    ? {
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
      }
    : {
        background: "#f5f6fa",
        appBar: "#fff",
        card: "#fff",
        text: "#23262b",
        subText: "grey.800",
        footer: "#f5f6fa",
        border: "1px solid #e0e0e0",
        button: "#337ab7",
        buttonHover: "#245a8d",
        icon: "#337ab7",
      };

  // Input validation
  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Το όνομα είναι υποχρεωτικό';
        } else if (value.length > SECURITY_CONFIG.MAX_NAME_LENGTH) {
          errors.name = `Το όνομα δεν μπορεί να υπερβαίνει τους ${SECURITY_CONFIG.MAX_NAME_LENGTH} χαρακτήρες`;
        } else if (!/^[a-zA-Zα-ωΑ-Ω\s]+$/.test(value.trim())) {
          errors.name = 'Το όνομα πρέπει να περιέχει μόνο γράμματα';
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Το email είναι υποχρεωτικό';
        } else if (!validateEmail(value.trim())) {
          errors.email = 'Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email';
        }
        break;
        
      case 'subject':
        if (!value.trim()) {
          errors.subject = 'Το θέμα είναι υποχρεωτικό';
        } else if (value.length > SECURITY_CONFIG.MAX_SUBJECT_LENGTH) {
          errors.subject = `Το θέμα δεν μπορεί να υπερβαίνει τους ${SECURITY_CONFIG.MAX_SUBJECT_LENGTH} χαρακτήρες`;
        }
        break;
        
      case 'message':
        if (!value.trim()) {
          errors.message = 'Το μήνυμα είναι υποχρεωτικό';
        } else if (value.length > SECURITY_CONFIG.MAX_MESSAGE_LENGTH) {
          errors.message = `Το μήνυμα δεν μπορεί να υπερβαίνει τους ${SECURITY_CONFIG.MAX_MESSAGE_LENGTH} χαρακτήρες`;
        }
        break;
        
      default:
        break;
    }
    
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitize input - allow spaces for message field
    const allowSpaces = name === 'message';
    const sanitizedValue = sanitizeInput(value, SECURITY_CONFIG[`MAX_${name.toUpperCase()}_LENGTH`], allowSpaces);
    
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
    
    // Clear error for this field
    setFormErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    Object.keys(formData).forEach(field => {
      const fieldErrors = validateField(field, formData[field]);
      Object.assign(errors, fieldErrors);
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Security checks
    if (isRateLimited()) {
      const remainingTime = Math.ceil(getRemainingTime() / 1000);
      setSnackbar({
        open: true,
        message: `Παρακαλώ περιμένετε ${remainingTime} δευτερόλεπτα πριν δοκιμάσετε ξανά.`,
        severity: "error",
      });
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Παρακαλώ διορθώστε τα σφάλματα στη φόρμα.",
        severity: "error",
      });
      return;
    }
    
    setIsSubmitting(true);
    recordAttempt();
    
    try {
      // Prepare secure payload
      const securePayload = {
        name: sanitizeInput(formData.name, SECURITY_CONFIG.MAX_NAME_LENGTH),
        email: sanitizeInput(formData.email, SECURITY_CONFIG.MAX_EMAIL_LENGTH).toLowerCase(),
        subject: sanitizeInput(formData.subject, SECURITY_CONFIG.MAX_SUBJECT_LENGTH),
        message: sanitizeInput(formData.message, SECURITY_CONFIG.MAX_MESSAGE_LENGTH, true), // Allow spaces for message
        csrfToken: csrfToken,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      };
      
      // Additional security headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
        timeout: 10000, // 10 second timeout
      };
      
      const response = await axios.post(`${API_URL}/api/contact/public`, securePayload, config);
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: "Το μήνυμά σας στάλθηκε επιτυχώς! Θα επικοινωνήσουμε μαζί σας σύντομα.",
          severity: "success",
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
        setFormErrors({});
      } else {
        throw new Error(response.data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      let errorMessage = "Προέκυψε σφάλμα κατά την αποστολή του μηνύματος. Παρακαλώ δοκιμάστε ξανά.";
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 429) {
          errorMessage = "Πάρα πολλές προσπάθειες. Παρακαλώ περιμένετε λίγο πριν δοκιμάσετε ξανά.";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Μη έγκυρα δεδομένα.";
        } else if (error.response.status === 403) {
          errorMessage = "Πρόσβαση απορρίφθηκε.";
        } else if (error.response.status >= 500) {
          errorMessage = "Πρόβλημα με τον διακομιστή. Παρακαλώ δοκιμάστε ξανά αργότερα.";
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Η σύνδεση έληξε. Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.";
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Πρόβλημα δικτύου. Παρακαλώ ελέγξτε τη σύνδεσή σας.";
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const contactInfo = [
    {
      icon: <EmailIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "Email",
      value: (
        <a 
          href="mailto:info@gradebook.pro" 
          style={{ 
            color: colors.icon, 
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.1s'
          }}
          onMouseEnter={(e) => e.target.style.color = colors.buttonHover}
          onMouseLeave={(e) => e.target.style.color = colors.icon}
        >
          info@gradebook.pro
        </a>
      ),
      description: "Για οποιαδήποτε απορία ή αίτηση συνεργασίας στείλτε μας email.",
    },
    {
      icon: <img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/discord.svg" alt="Discord" style={{ width: 40, height: 40, color: colors.icon, verticalAlign: 'middle' }} />,
      title: "Discord",
      value: "To be Discord link..",
      description: "Συζητήστε μαζί μας ή με άλλους χρήστες στο Discord server μας.",
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: colors.background,
        minHeight: "100vh",
        fontFamily: "Roboto, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        transition: 'background-color 0.1s',
        overscrollBehavior: 'none',
        overscrollColor: colors.icon,
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
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: colors.appBar, borderBottom: colors.border, transition: 'background-color 0.1s, border-bottom-color 0.1s' }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 3 } }}>
          <IconButton
            sx={{
              display: { xs: "flex", md: "none" },
              color: colors.icon,
              mr: 1,
              transition: 'color 0.1s',
            }}
            onClick={handleDrawerToggle}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Logo />
          <Box sx={{ flexGrow: 1 }} />
          <Stack
            direction="row"
            spacing={2}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {navLinks.map((link) => (
              <Button
                key={link.label}
                href={link.href}
                sx={{
                  color: colors.icon,
                  fontWeight: 500,
                  fontSize: 16,
                  borderRadius: 2,
                  px: 2,
                  textTransform: "none",
                  transition: 'color 0.1s, background-color 0.1s',
                  "&:hover": { bgcolor: colors.appBar },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>
          <IconButton
            onClick={handleToggleDarkMode}
            sx={{ color: colors.icon, ml: 2, transition: 'color 0.1s' }}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: 220,
            bgcolor: colors.appBar,
            color: colors.text,
            boxShadow: 3,
            transition: 'background-color 0.1s, color 0.1s',
          },
        }}
      >
        <Box
          sx={{
            width: 220,
            pt: 2,
            px: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            bgcolor: colors.appBar,
            color: colors.text,
            transition: 'background-color 0.1s, color 0.1s',
          }}
          role="presentation"
          onClick={handleDrawerToggle}
          onKeyDown={handleDrawerToggle}
        >
          <List sx={{ mt: 2 }}>
            {navLinks.map((link) => (
              <ListItem key={link.label} disablePadding>
                <ListItemButton
                  component="a"
                  href={link.href}
                  sx={{ color: colors.text, transition: 'color 0.1s' }}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h2"
              fontWeight="bold"
              sx={{
                color: colors.text,
                mb: 3,
                fontSize: { xs: 32, md: 48 },
                lineHeight: 1.2,
              }}
            >
              Επικοινωνήστε μαζί μας
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: colors.subText,
                maxWidth: 800,
                mx: "auto",
                fontWeight: 400,
                fontSize: { xs: 16, md: 18 },
              }}
            >
              Έχετε ερωτήσεις ή χρειάζεστε βοήθεια; Επικοινωνήστε μαζί μας και θα σας απαντήσουμε άμεσα.
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} md={8}>
              <Card
                elevation={0}
                sx={{
                  bgcolor: colors.card,
                  transition: 'background-color 0.1s',
                  boxShadow: "0 1px 6px 0 rgba(51,122,183,0.04)",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{
                      color: colors.text,
                      mb: 4,
                      fontSize: { xs: 24, md: 28 },
                    }}
                  >
                    Στείλτε μας μήνυμα
                  </Typography>
                  
                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Όνομα"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          error={!!formErrors.name}
                          helperText={formErrors.name}
                          required
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              color: colors.text,
                              "& fieldset": {
                                borderColor: colors.subText,
                              },
                              "&:hover fieldset": {
                                borderColor: colors.icon,
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: colors.icon,
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: colors.subText,
                              "&.Mui-focused": {
                                color: colors.icon,
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          error={!!formErrors.email}
                          helperText={formErrors.email}
                          required
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              color: colors.text,
                              "& fieldset": {
                                borderColor: colors.subText,
                              },
                              "&:hover fieldset": {
                                borderColor: colors.icon,
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: colors.icon,
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: colors.subText,
                              "&.Mui-focused": {
                                color: colors.icon,
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Θέμα"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          error={!!formErrors.subject}
                          helperText={formErrors.subject}
                          required
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              color: colors.text,
                              "& fieldset": {
                                borderColor: colors.subText,
                              },
                              "&:hover fieldset": {
                                borderColor: colors.icon,
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: colors.icon,
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: colors.subText,
                              "&.Mui-focused": {
                                color: colors.icon,
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Μήνυμα"
                          name="message"
                          multiline
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange}
                          error={!!formErrors.message}
                          helperText={formErrors.message}
                          required
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              color: colors.text,
                              "& fieldset": {
                                borderColor: colors.subText,
                              },
                              "&:hover fieldset": {
                                borderColor: colors.icon,
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: colors.icon,
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: colors.subText,
                              "&.Mui-focused": {
                                color: colors.icon,
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          endIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                          sx={{
                            bgcolor: colors.button,
                            color: "white",
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontWeight: "bold",
                            fontSize: 16,
                            textTransform: "none",
                            transition: "all 0.2s",
                            "&:hover": {
                              bgcolor: colors.buttonHover,
                              transform: "translateY(-2px)",
                            },
                          }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Αποστολή..." : "Αποστολή Μηνύματος"}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: colors.text,
                    mb: 3,
                    fontSize: { xs: 20, md: 24 },
                  }}
                >
                  Πληροφορίες Επικοινωνίας
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {contactInfo.map((info, index) => (
                    <Card
                      key={index}
                      elevation={0}
                      sx={{
                        bgcolor: colors.card,
                        transition: 'background-color 0.1s',
                        boxShadow: "0 1px 6px 0 rgba(51,122,183,0.04)",
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          {info.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{ color: colors.text, mb: 1, transition: 'color 0.1s' }}
                        >
                          {info.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: colors.icon, mb: 1, fontWeight: 500, transition: 'color 0.1s' }}
                        >
                          {info.value}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: colors.subText, transition: 'color 0.1s' }}
                        >
                          {info.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
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
          transition: 'background-color 0.1s, border-top-color 0.1s',
        }}
      >
        <Typography variant="body2" sx={{ color: darkMode ? "grey.400" : "grey.700", transition: 'color 0.1s' }}>
          © {new Date().getFullYear()} GradeBook Team.
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Contact; 