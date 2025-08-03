import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import SchoolIcon from "@mui/icons-material/School";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import SupportIcon from "@mui/icons-material/Support";

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

const About = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

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

  const features = [
    {
      icon: <SchoolIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "Διαχείριση Φροντιστηρίων",
      description: "Πλήρης έλεγχος των τάξεων, μαθητών και βαθμολογιών με εύκολη και διαισθητική διασύνδεση.",
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "Ασφάλεια Δεδομένων",
      description: "Προστασία των ευαίσθητων πληροφοριών των μαθητών με σύγχρονες τεχνολογίες κρυπτογράφησης.",
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "Γρήγορη Ενημέρωση",
      description: "Άμεση επικοινωνία με γονείς και μαθητές μέσω push notifications και email ειδοποιήσεων.",
    },
    {
      icon: <SupportIcon sx={{ fontSize: 40, color: colors.icon }} />,
      title: "24/7 Υποστήριξη",
      description: "Συνεχής τεχνική υποστήριξη για όλες τις ανάγκες του φροντιστηρίου σας.",
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
              Σχετικά με το GradeBook
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
              Το GradeBook είναι μια σύγχρονη πλατφόρμα διαχείρισης φροντιστηρίων που αναπτύχθηκε 
              για να απλοποιήσει και να βελτιώσει την εκπαιδευτική διαδικασία.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    bgcolor: colors.card,
                    transition: 'background-color 0.1s',
                    boxShadow: "0 1px 6px 0 rgba(51,122,183,0.04)",
                    "&:hover": {
                      boxShadow: "0 4px 16px 0 rgba(51,122,183,0.10)",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ color: colors.text, mb: 2, transition: 'color 0.1s' }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.subText, transition: 'color 0.1s' }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: colors.text,
                mb: 4,
                fontSize: { xs: 24, md: 32 },
              }}
            >
              Η Ιστορία μας
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.subText,
                maxWidth: 900,
                mx: "auto",
                lineHeight: 1.8,
                fontSize: { xs: 16, md: 18 },
              }}
            >
              Το GradeBook ξεκίνησε ως μια απλή ιδέα για να βελτιώσουμε τον τρόπο που τα φροντιστήρια 
              διαχειρίζονται τις πληροφορίες των μαθητών τους. Με την εξέλιξη της τεχνολογίας και τις 
              αυξανόμενες απαιτήσεις για ψηφιακές λύσεις, αναπτύξαμε μια πλατφόρμα που συνδυάζει 
              ευκολία χρήσης με ισχυρές λειτουργίες.
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: colors.text,
                mb: 4,
                fontSize: { xs: 24, md: 32 },
              }}
            >
              Η Αποστολή μας
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.subText,
                maxWidth: 900,
                mx: "auto",
                lineHeight: 1.8,
                fontSize: { xs: 16, md: 18 },
              }}
            >
              Στόχος μας είναι να παρέχουμε στους εκπαιδευτικούς και τα φροντιστήρια τα εργαλεία που 
              χρειάζονται για να εστιάσουν σε αυτό που κάνουν καλύτερα: την εκπαίδευση των μαθητών. 
              Με το GradeBook, η διαχείριση γίνεται απλή και αποδοτική.
            </Typography>
          </Box>
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
    </Box>
  );
};

export default About; 