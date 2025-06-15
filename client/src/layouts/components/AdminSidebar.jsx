import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  EmojiEvents as TrophyIcon,
  CardGiftcard as RewardIcon,
  Leaderboard as LeaderboardIcon,
  TrendingUp as ProgressIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AnalyticsIcon,
  Announcement as AnnouncementIcon,
  Security as SecurityIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';

const drawerWidth = 280;

const AdminSidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for menu collapse
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);

  const handleRewardsClick = () => {
    setRewardsOpen(!rewardsOpen);
  };

  const handleUsersClick = () => {
    setUsersOpen(!usersOpen);
  };

  const handleSystemClick = () => {
    setSystemOpen(!systemOpen);
  };

  const handleItemClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      {/* Logo and Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2.5,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src="./logo.png"
          alt="Neobot Admin"
          sx={{ height: 40, display: 'block', mx: 'auto' }}
        />
      </Box>

      {/* Admin Info */}
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(to bottom, rgba(255, 87, 34, 0.05), transparent)`,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#ff5722',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 2,
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              border: `2px solid ${theme.palette.background.paper}`,
            }
          }}
        >
          <AdminIcon sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        <Box sx={{ fontWeight: 'bold', color: theme.palette.text.primary, fontSize: '1.1rem', mb: 0.5 }}>
          Admin Panel
        </Box>
        <Box
          sx={{
            fontSize: '0.8rem',
            color: theme.palette.text.secondary,
            backgroundColor: 'rgba(255, 87, 34, 0.08)',
            borderRadius: 4,
            py: 0.5,
            px: 1.5,
            display: 'inline-block',
          }}
        >
          {user?.email || 'admin@neobot.trade'}
        </Box>
      </Box>

      <Divider />

      {/* Navigation Links */}
      <List sx={{ px: 1, py: 1 }}>
        {/* Admin Dashboard */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/admin/dashboard"
            selected={isActive('/admin/dashboard')}
            onClick={handleItemClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 87, 34, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 87, 34, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: isActive('/admin/dashboard') ? 'rgba(255, 87, 34, 0.12)' : 'transparent',
                  color: isActive('/admin/dashboard') ? '#ff5722' : theme.palette.text.secondary,
                }}
              >
                <DashboardIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive('/admin/dashboard') ? 'bold' : 'medium',
                  color: isActive('/admin/dashboard') ? '#ff5722' : theme.palette.text.primary,
                }
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Reward Management */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleRewardsClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              backgroundColor: rewardsOpen ? 'rgba(255, 193, 7, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 193, 7, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: rewardsOpen ? 'rgba(255, 193, 7, 0.12)' : 'transparent',
                  color: rewardsOpen ? '#ff9800' : theme.palette.text.secondary,
                }}
              >
                <TrophyIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Reward Management"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: rewardsOpen ? 'bold' : 'medium',
                  color: rewardsOpen ? '#ff9800' : theme.palette.text.primary,
                }
              }}
            />
            {rewardsOpen ?
              <ExpandLess sx={{ color: '#ff9800' }} /> :
              <ExpandMore />
            }
          </ListItemButton>
        </ListItem>
        <Collapse in={rewardsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2, pr: 1 }}>
            <ListItemButton
              component={Link}
              to="/admin/rewards/dashboard"
              selected={isActive('/admin/rewards/dashboard')}
              onClick={handleItemClick}
              sx={{
                pl: 2,
                borderRadius: 2,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 193, 7, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 193, 7, 0.12)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 193, 7, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    backgroundColor: isActive('/admin/rewards/dashboard') ? 'rgba(255, 193, 7, 0.12)' : 'transparent',
                    color: isActive('/admin/rewards/dashboard') ? '#ff9800' : theme.palette.text.secondary,
                  }}
                >
                  <TrophyIcon sx={{ fontSize: 16 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Reward Dashboard"
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.9rem',
                    fontWeight: isActive('/admin/rewards/dashboard') ? 'bold' : 'medium',
                    color: isActive('/admin/rewards/dashboard') ? '#ff9800' : theme.palette.text.primary,
                  }
                }}
              />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/admin/rewards/progress"
              selected={isActive('/admin/rewards/progress')}
              onClick={handleItemClick}
              sx={{
                pl: 2,
                borderRadius: 2,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 193, 7, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 193, 7, 0.12)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 193, 7, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    backgroundColor: isActive('/admin/rewards/progress') ? 'rgba(255, 193, 7, 0.12)' : 'transparent',
                    color: isActive('/admin/rewards/progress') ? '#ff9800' : theme.palette.text.secondary,
                  }}
                >
                  <ProgressIcon sx={{ fontSize: 16 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="User Progress"
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.9rem',
                    fontWeight: isActive('/admin/rewards/progress') ? 'bold' : 'medium',
                    color: isActive('/admin/rewards/progress') ? '#ff9800' : theme.palette.text.primary,
                  }
                }}
              />
            </ListItemButton>
          </List>
        </Collapse>

        {/* User Management */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleUsersClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              backgroundColor: usersOpen ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: usersOpen ? 'rgba(33, 150, 243, 0.12)' : 'transparent',
                  color: usersOpen ? '#2196f3' : theme.palette.text.secondary,
                }}
              >
                <PeopleIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="User Management"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: usersOpen ? 'bold' : 'medium',
                  color: usersOpen ? '#2196f3' : theme.palette.text.primary,
                }
              }}
            />
            {usersOpen ?
              <ExpandLess sx={{ color: '#2196f3' }} /> :
              <ExpandMore />
            }
          </ListItemButton>
        </ListItem>

        {/* System Settings */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/admin/settings"
            selected={isActive('/admin/settings')}
            onClick={handleItemClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: 'rgba(156, 39, 176, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(156, 39, 176, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: isActive('/admin/settings') ? 'rgba(156, 39, 176, 0.12)' : 'transparent',
                  color: isActive('/admin/settings') ? '#9c27b0' : theme.palette.text.secondary,
                }}
              >
                <SettingsIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="System Settings"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive('/admin/settings') ? 'bold' : 'medium',
                  color: isActive('/admin/settings') ? '#9c27b0' : theme.palette.text.primary,
                }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box component="nav">
      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[3],
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        /* Desktop drawer */
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[3],
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default AdminSidebar;
