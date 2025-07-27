import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  AppBar,
  Toolbar,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GradeIcon from '@mui/icons-material/Grade';
import ForumIcon from '@mui/icons-material/Forum';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

const Logo = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        fontWeight: 100,
        fontSize: { xs: 28, sm: 32, md: 34, lg: 36 }, // smaller overall, even smaller on mobile
        color: '#337ab7',
        letterSpacing: 1,
        mr: 2,
        fontFamily: 'Roboto, Arial, sans-serif'
      }}
    >
      GradeBook
    </Box>
  );
};

const features = [
  {
    icon: <CheckCircleIcon color="primary" sx={{ fontSize: 32 }} aria-hidden="true" />, title: 'Παρουσίες', desc: 'Εύκολη καταγραφή παρουσιών μαθητών.'
  },
  {
    icon: <GradeIcon color="primary" sx={{ fontSize: 32 }} aria-hidden="true" />, title: 'Βαθμολογίες', desc: 'Άμεση διαχείριση και ανάλυση βαθμών.'
  },
  {
    icon: <ForumIcon color="primary" sx={{ fontSize: 32 }} aria-hidden="true" />, title: 'Επικοινωνία', desc: 'Γρήγορη ενημέρωση γονέων & μαθητών.'
  },
  {
    icon: <AssessmentIcon color="primary" sx={{ fontSize: 32 }} aria-hidden="true" />, title: 'Αναφορές', desc: 'Αναλυτικές αναφορές προόδου.'
  }
];

const navLinks = [
  { label: 'Πίνακας Ελέγχου', href: '/login' },
  { label: 'Σχετικά με εμάς', href: '#about' },
  { label: 'Επικοινωνία', href: '#contact' }
];

const DashboardMockup = () => (
  <Box
    sx={{
      width: '100%',
      maxWidth: 420,
      height: 260,
      mx: 'auto',
      mt: { xs: 4, md: 0 },
      borderRadius: 4,
      bgcolor: '#181b20',
      boxShadow: '0 4px 24px 0 rgba(51,122,183,0.10)',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      p: 0,
      filter: 'blur(0.5px)'
    }}
  >
    <Box sx={{
      width: 110,
      height: '100%',
      bgcolor: '#181b20',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      pt: 3,
      px: 2,
      gap: 2,
      borderRight: '1px solid #23262b'
    }}>
      <Box sx={{
        width: '100%',
        height: 36,
        bgcolor: '#353942',
        borderRadius: 2,
        mb: 2
      }} />
      <Box sx={{
        width: '100%',
        height: 36,
        bgcolor: '#353942',
        borderRadius: 2,
        mb: 1.5
      }} />
      <Box sx={{
        width: '70%',
        height: 18,
        bgcolor: '#23262b',
        borderRadius: 2,
        mb: 1
      }} />
      <Box sx={{
        width: '60%',
        height: 14,
        bgcolor: '#23262b',
        borderRadius: 2
      }} />
    </Box>
    <Box sx={{
      flex: 1,
      height: '100%',
      bgcolor: '#23262b',
      p: 2.5,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ width: 28, height: 28, bgcolor: '#337ab7', borderRadius: '50%' }} />
        <Box sx={{ width: 120, height: 16, bgcolor: 'grey.800', borderRadius: 2 }} />
        <Box sx={{ flex: 1 }} />
        <Box sx={{ width: 22, height: 22, bgcolor: 'grey.800', borderRadius: '50%' }} />
        <Box sx={{ width: 22, height: 22, bgcolor: 'grey.800', borderRadius: '50%' }} />
        <Box sx={{ width: 22, height: 22, bgcolor: 'grey.800', borderRadius: '50%' }} />
      </Box>
      <Box sx={{ width: 120, height: 18, bgcolor: 'grey.700', borderRadius: 2, mb: 1 }} />
      <Box sx={{ width: 180, height: 14, bgcolor: 'grey.800', borderRadius: 2, mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1, height: 60, bgcolor: '#181b20', borderRadius: 3 }} />
        <Box sx={{ flex: 1, height: 60, bgcolor: '#181b20', borderRadius: 3 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
      </Box>
    </Box>
  </Box>
);

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => setDrawerOpen((prev) => !prev);

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #f0f0f0' }}>
        <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 3 } }}>
          <Logo />
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((link) => (
              <Button
                key={link.label}
                href={link.href}
                sx={{
                  color: '#337ab7',
                  fontWeight: 500,
                  fontSize: 16,
                  borderRadius: 2,
                  px: 2,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>
          <IconButton
            sx={{ display: { xs: 'flex', md: 'none' }, color: '#337ab7' }}
            onClick={handleDrawerToggle}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: { width: 220 }
        }}
      >
        <Box
          sx={{
            width: 220,
            pt: 2,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
          role="presentation"
          onClick={handleDrawerToggle}
          onKeyDown={handleDrawerToggle}
        >
          <Logo />
          <List sx={{ mt: 2 }}>
            {navLinks.map((link) => (
              <ListItem key={link.label} disablePadding>
                <ListItemButton component="a" href={link.href}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={6} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  color: '#222',
                  mb: 2,
                  fontSize: { xs: 28, md: 36 },
                  lineHeight: 1.2
                }}
              >
                Αναβαθμίστε την διαχείριση του φροντιστηρίου σας.
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'grey.700',
                  mb: 4,
                  fontWeight: 400,
                  fontSize: { xs: 16, md: 18 }
                }}
              >
                Το GradeBook παρέχει τα εφόδια για την σύγχρονη και εύκολη διαχείριση φροντιστηρίων, προσφέροντας πλήρη έλεγχο των τάξεων και των μαθητών σας.
              </Typography>
              <Button
                variant="contained"
                size="large"
                href="/login"
                sx={{
                  bgcolor: '#337ab7',
                  color: 'white',
                  borderRadius: 8,
                  px: 5,
                  py: 1.7,
                  fontWeight: 'bold',
                  fontSize: 18,
                  boxShadow: '0 2px 8px 0 rgba(51,122,183,0.10)',
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#245a8d',
                    transform: 'translateY(-2px) scale(1.03)'
                  }
                }}
                rel="noopener noreferrer"
              >
                Συνδεθείτε στον Πίνακα Ελέγχου
              </Button>
            </Box>
            <Grid container spacing={2} id="features">
              {features.map((feature, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Card
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 4,
                      bgcolor: 'grey.50',
                      boxShadow: '0 1px 6px 0 rgba(51,122,183,0.04)',
                      mb: 1,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 4px 16px 0 rgba(51,122,183,0.10)' }
                    }}
                  >
                    {feature.icon}
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" color="#222">
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="grey.700">
                        {feature.desc}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <DashboardMockup />
          </Grid>
        </Grid>
      </Container>
      <Box
        sx={{
          mt: 8,
          py: 3,
          bgcolor: 'grey.50',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="grey.600">
          © 2025 GradeBook Team. Όλα τα δικαιώματα διατηρούνται.
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
