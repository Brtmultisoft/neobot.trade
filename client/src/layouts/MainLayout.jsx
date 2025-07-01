import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme, Container } from '@mui/material';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNavigation from './components/BottomNavigation';
import { clearFrontendSession } from '../pages/auth/Login';

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Inject Tawk.to script once
  useEffect(() => {
    if (!document.getElementById('tawkto-script')) {
      const s1 = document.createElement('script');
      s1.id = 'tawkto-script';
      s1.async = true;
      s1.src = 'https://embed.tawk.to/6863cb3f89d0b51907b141a9/1iv2t3t4j';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      document.body.appendChild(s1);
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleForcedLogout = (e) => {
      if (e.key === 'forced_logout_triggered') {
        console.log('Forced logout detected in another tab. Logging out here too.');
        clearFrontendSession();
        window.location.href = '/login?forced=1';
      }
    };

    window.addEventListener('storage', handleForcedLogout);

    return () => {
      window.removeEventListener('storage', handleForcedLogout);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - visible on all screen sizes */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { xs: '100%', md: `calc(100% - ${sidebarOpen ? 280 : 0}px)` },
          ml: { xs: 0, md: sidebarOpen ? '280px' : 0 },
          p: 0,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Header */}
        <Header onToggleSidebar={handleToggleSidebar} />

        {/* Page Content */}
        <Container
          maxWidth="lg"
          disableGutters={isMobile}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            px: isMobile ? 1 : 2, // Reduced padding for mobile but not zero
            pb: isMobile ? 10 : 3, // Add padding at bottom for mobile to account for bottom navigation
            width: '100%', // Ensure container takes full width
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              borderRadius: isMobile ? 0 : 2,
              overflow: 'hidden',
            }}
          >
            <Outlet />
          </Box>
        </Container>

        {/* Footer - only visible on desktop */}
        {!isMobile && <Footer />}

        {/* Bottom Navigation - only visible on mobile */}
        {isMobile && <BottomNavigation />}
      </Box>
    </Box>
  );
};

export default MainLayout;
