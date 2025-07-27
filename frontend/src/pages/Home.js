import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
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

const Logo = () => (
  <Box
    sx={{
      fontWeight: 'bold',
      fontSize: 26,
      color: '#337ab7',
      letterSpacing: 1,
      mr: 2,
      fontFamily: 'Roboto, Arial, sans-serif'
    }}
  >
    GradeBook
  </Box>
);

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

// Updated navLinks: removed "Τιμές", added "Σχετικά με εμάς"
const navLinks = [
  { label: 'Πίνακας Ελέγχου', href: '/login' },
  { label: 'Σχετικά με εμάς', href: '#about' },
  { label: 'Επικοινωνία', href: '#contact' }
];

// Dashboard-inspired blurred mockup
const DashboardMockup = () => (
  <Box
    sx={{
      width: '100%',
      maxWidth: 420,
      height: 260,
      mx: 'auto',
      mt: { xs: 4, md: 0 },
      borderRadius: 4,
      bgcolor: 'grey.100',
      boxShadow: '0 4px 24px 0 rgba(51,122,183,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      p: 0,
      filter: 'blur(0.5px)'
    }}
  >
    {/* Sidebar */}
    <Box sx={{
      width: 70,
      height: '100%',
      bgcolor: '#181b20',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pt: 2,
      gap: 2
    }}>
      <Box sx={{ bgcolor: '#337ab7', width: 36, height: 36, borderRadius: 2, mb: 2 }} />
      <Box sx={{ bgcolor: '#353942', width: 36, height: 36, borderRadius: 2, mb: 1 }} />
    </Box>
    {/* Main area */}
    <Box sx={{
      flex: 1,
      height: '100%',
      bgcolor: '#23262b',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      {/* Topbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ width: 28, height: 28, bgcolor: '#337ab7', borderRadius: '50%' }} />
        <Box sx={{ width: 90, height: 14, bgcolor: 'grey.800', borderRadius: 2 }} />
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ width: 22, height: 22, bgcolor: 'grey.800', borderRadius: '50%' }} />
        <Box sx={{ width: 22, height: 22, bgcolor: 'grey.800', borderRadius: '50%' }} />
        <Box sx={{ width: 22, height: 22, bgcolor: 'grey.800', borderRadius: '50%' }} />
      </Box>
      {/* Dashboard title */}
      <Box sx={{ width: 120, height: 18, bgcolor: 'grey.700', borderRadius: 2, mb: 1 }} />
      {/* Welcome text */}
      <Box sx={{ width: 180, height: 12, bgcolor: 'grey.800', borderRadius: 2, mb: 2 }} />
      {/* Cards row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1, height: 60, bgcolor: '#181b20', borderRadius: 3 }} />
        <Box sx={{ flex: 1, height: 60, bgcolor: '#181b20', borderRadius: 3 }} />
      </Box>
      {/* Quick actions row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
        <Box sx={{ flex: 1, height: 36, bgcolor: '#23262b', borderRadius: 2, border: '1px solid #337ab7' }} />
      </Box>
      {/* Recent notifications & user overview */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1, height: 38, bgcolor: '#181b20', borderRadius: 2 }} />
        <Box sx={{ flex: 1, height: 38, bgcolor: '#181b20', borderRadius: 2 }} />
      </Box>
    </Box>
    <Chip
      label="Demo"
      size="small"
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        bgcolor: '#337ab7',
        color: 'white',
        fontWeight: 'bold'
      }}
    />
  </Box>
);

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif' }}>
      {/* Top Navigation */}
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
          {/* Mobile menu icon */}
          <IconButton sx={{ display: { xs: 'flex', md: 'none' }, color: '#337ab7' }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={6} alignItems="center" justifyContent="center">
          {/* Left: Slogan, Description, CTA, Features */}
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

            {/* Features */}
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

          {/* Right: Dashboard Mockup */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <DashboardMockup />
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
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
