import React, { useState } from "react";
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
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SendIcon from "@mui/icons-material/Send";

const Logo = () => {
  return (
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setSnackbar({
        open: true,
        message: "Παρακαλώ συμπληρώστε όλα τα πεδία.",
        severity: "error",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSnackbar({
        open: true,
        message: "Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email.",
        severity: "error",
      });
      return;
    }

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll simulate a successful submission
      console.log("Form submitted:", formData);
      
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
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Προέκυψε σφάλμα κατά την αποστολή του μηνύματος. Παρακαλώ δοκιμάστε ξανά.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const contactInfo = [
    {
      icon: <EmailIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "Email",
      value: "info@gradebook.pro",
      description: "Στείλτε μας email για οποιαδήποτε ερώτηση",
    },
    {
      icon: <PhoneIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "Τηλέφωνο",
      value: "+30 210 1234567",
      description: "Επικοινωνήστε μαζί μας τηλεφωνικά",
    },
    {
      icon: <LocationOnIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "Διεύθυνση",
      value: "Αθήνα, Ελλάδα",
      description: "Βρείτε μας στην καρδιά της Αθήνας",
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
                          endIcon={<SendIcon />}
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
                        >
                          Αποστολή Μηνύματος
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