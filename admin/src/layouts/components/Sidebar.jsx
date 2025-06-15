import { useState, useEffect } from 'react';
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
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
  ExpandLess,
  ExpandMore,
  MonetizationOn as MonetizationOnIcon,
  Savings as SavingsIcon,
  CreditCard as CreditCardIcon,
  SupervisorAccount as SupervisorAccountIcon,
  AccountTree as AccountTreeIcon,
  RemoveCircle as RemoveCircleIcon,
  Announcement as AnnouncementIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  EmojiEvents as EmojiEventsIcon,
  BusinessCenter as BusinessCenterIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';

const drawerWidth = 280;
const miniDrawerWidth = 70;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const { /* user */ } = useAuth(); // User data available if needed
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // State for mini variant (compact view)
  const [miniVariant, setMiniVariant] = useState(isTablet);

  // State for menu collapse
  const [teamOpen, setTeamOpen] = useState(true);
  const [investmentOpen, setInvestmentOpen] = useState(true);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(true);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [tradingOpen, setTradingOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // State for touch feedback on mobile
  const [touchedItem, setTouchedItem] = useState(null);

  // Enhanced handlers for mobile experience
  const handleTeamClick = () => {
    // On mobile, close other sections when opening a new one
    if (isMobile) {
      if (!teamOpen) {
        setInvestmentOpen(false);
        setIncomeOpen(false);
        setWalletOpen(false);
      }
    }
    setTeamOpen(!teamOpen);
  };

  const handleInvestmentClick = () => {
    // On mobile, close other sections when opening a new one
    if (isMobile) {
      if (!investmentOpen) {
        setTeamOpen(false);
        setIncomeOpen(false);
        setWalletOpen(false);
      }
    }
    setInvestmentOpen(!investmentOpen);
  };

  const handleIncomeClick = () => {
    // On mobile, close other sections when opening a new one
    if (isMobile) {
      if (!incomeOpen) {
        setTeamOpen(false);
        setInvestmentOpen(false);
        setWalletOpen(false);
      }
    }
    setIncomeOpen(!incomeOpen);
  };

  const handleWalletClick = () => {
    // On mobile, close other sections when opening a new one
    if (isMobile) {
      if (!walletOpen) {
        setTeamOpen(false);
        setInvestmentOpen(false);
        setIncomeOpen(false);
      }
    }
    setWalletOpen(!walletOpen);
  };

  // Handle touch feedback for mobile devices
  const handleTouchStart = (itemId) => {
    if (isMobile) {
      setTouchedItem(itemId);
    }
  };

  const handleTouchEnd = () => {
    if (isMobile) {
      // Clear the touched state after a short delay for better visual feedback
      setTimeout(() => {
        setTouchedItem(null);
      }, 150);
    }
  };

  // Enhanced item click handler with touch feedback
  const handleItemClick = (itemId) => {
    if (isMobile) {
      // Show touch feedback
      handleTouchStart(itemId);
      handleTouchEnd();

      // Close drawer for leaf nodes
      onClose();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{
      width: miniVariant ? miniDrawerWidth : drawerWidth,
      overflow: 'auto',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }}>
      {/* Logo and Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: miniVariant ? 1.5 : 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          background: `linear-gradient(135deg, rgba(255, 87, 34, 0.05), rgba(255, 87, 34, 0.02))`,
        }}
      >
        <Box
          component="img"
          src="../logo.png"
          alt="Neobot Admin"
          sx={{
            height: miniVariant ? 32 : 45,
            mr: miniVariant ? 0 : 1.5,
            filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              filter: 'drop-shadow(0px 4px 8px rgba(255, 87, 34, 0.3))',
            }
          }}
        />
        {!miniVariant && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography
              variant="h6"
              component={Link}
              to="/dashboard"
              sx={{
                textDecoration: 'none',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                fontSize: '1.1rem',
                lineHeight: 1.2,
                '&:hover': {
                  color: '#ff5722',
                  transition: 'color 0.3s ease',
                }
              }}
            >
              Neobot
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Admin Panel
            </Typography>
          </Box>
        )}
      </Box>

      {/* Toggle button for mini variant */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <Tooltip title={miniVariant ? "Expand menu" : "Collapse menu"}>
          <IconButton onClick={() => setMiniVariant(!miniVariant)}>
            {miniVariant ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation Menu */}
      <List component="nav" sx={{ p: 1 }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <Tooltip title="Dashboard" placement="right" disableHoverListener={!miniVariant}>
            <ListItemButton
              component={Link}
              to="/dashboard"
              selected={isActive('/dashboard')}
              onClick={handleItemClick}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                }}
              >
                <DashboardIcon
                  color={isActive('/dashboard') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              {!miniVariant && <ListItemText primary="Dashboard" />}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {/* Team Management */}
        <ListItem disablePadding>
          <Tooltip title="Team Management" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={handleTeamClick}
              onTouchStart={() => handleTouchStart('team-management')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: teamOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'team-management'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: teamOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  transform: touchedItem === 'team-management' ? 'scale(0.98)' : 'scale(1)',
                }),
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.4rem',
                    }
                  })
                }}
              >
                <SupervisorAccountIcon color={teamOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Team Management"
                    primaryTypographyProps={{
                      fontWeight: teamOpen && isMobile ? 600 : 400,
                      color: teamOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {teamOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={teamOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="All Team" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/all-team"
                selected={isActive('/all-team')}
                onClick={() => handleItemClick('all-team')}
                onTouchStart={() => handleTouchStart('all-team')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/all-team') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'all-team' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                    transform: touchedItem === 'all-team' ? 'scale(0.98)' : 'scale(1)',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                    // Larger icons on mobile for better touch targets
                    ...(isMobile && {
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.3rem',
                      }
                    })
                  }}
                >
                  <PeopleIcon
                    color={isActive('/all-team') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="All Team" />}
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Team Structure" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/team-structure"
                selected={isActive('/team-structure')}
                onClick={handleItemClick}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/team-structure') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'border-left-color 0.2s ease',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                    // Larger icons on mobile for better touch targets
                    ...(isMobile && {
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.3rem',
                      }
                    })
                  }}
                >
                  <AccountTreeIcon
                    color={isActive('/team-structure') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Team Structure" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && teamOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="All Team" placement="right">
              <ListItemButton
                component={Link}
                to="/all-team"
                selected={isActive('/all-team')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon
                    color={isActive('/all-team') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Team Structure" placement="right">
              <ListItemButton
                component={Link}
                to="/team-structure"
                selected={isActive('/team-structure')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <AccountTreeIcon
                    color={isActive('/team-structure') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}

        {/* Wallet Management */}
        <ListItem disablePadding>
          <Tooltip title="Wallet Management" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={handleWalletClick}
              onTouchStart={() => handleTouchStart('wallet-management')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: walletOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'wallet-management'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: walletOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }),
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                    }
                  })
                }}
              >
                <AccountBalanceIcon color={walletOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Funds"
                    primaryTypographyProps={{
                      fontWeight: walletOpen && isMobile ? 600 : 400,
                      color: walletOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {walletOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={walletOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="Transfer Fund" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/transfer-fund"
                selected={isActive('/transfer-fund')}
                onClick={() => handleItemClick('transfer-fund')}
                onTouchStart={() => handleTouchStart('transfer-fund')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/transfer-fund') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'transfer-fund' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <SwapHorizIcon
                    color={isActive('/transfer-fund') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Transfer Fund" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Deduct Fund" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/deduct-fund"
                selected={isActive('/deduct-fund')}
                onClick={() => handleItemClick('deduct-fund')}
                onTouchStart={() => handleTouchStart('deduct-fund')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/deduct-fund') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'deduct-fund' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <RemoveCircleIcon
                    color={isActive('/deduct-fund') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Deduct Fund" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Transfer History" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/transfer-history"
                selected={isActive('/transfer-history')}
                onClick={() => handleItemClick('transfer-history')}
                onTouchStart={() => handleTouchStart('transfer-history')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/transfer-history') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'transfer-history' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <HistoryIcon
                    color={isActive('/transfer-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Transfer History" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Deposit History" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/deposit-history"
                selected={isActive('/deposit-history')}
                onClick={() => handleItemClick('deposit-history')}
                onTouchStart={() => handleTouchStart('deposit-history')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/deposit-history') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'deposit-history' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <CreditCardIcon
                    color={isActive('/deposit-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Deposit History" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Withdrawal History" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/withdrawal-history"
                selected={isActive('/withdrawal-history')}
                onClick={() => handleItemClick('withdrawal-history')}
                onTouchStart={() => handleTouchStart('withdrawal-history')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/withdrawal-history') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'withdrawal-history' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <SavingsIcon
                    color={isActive('/withdrawal-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Withdrawal History" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && walletOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="Transfer Fund" placement="right">
              <ListItemButton
                component={Link}
                to="/transfer-fund"
                selected={isActive('/transfer-fund')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <SwapHorizIcon
                    color={isActive('/transfer-fund') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Deduct Fund" placement="right">
              <ListItemButton
                component={Link}
                to="/deduct-fund"
                selected={isActive('/deduct-fund')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <RemoveCircleIcon
                    color={isActive('/deduct-fund') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Transfer History" placement="right">
              <ListItemButton
                component={Link}
                to="/transfer-history"
                selected={isActive('/transfer-history')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <HistoryIcon
                    color={isActive('/transfer-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Deposit History" placement="right">
              <ListItemButton
                component={Link}
                to="/deposit-history"
                selected={isActive('/deposit-history')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <CreditCardIcon
                    color={isActive('/deposit-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Withdrawal History" placement="right">
              <ListItemButton
                component={Link}
                to="/withdrawal-history"
                selected={isActive('/withdrawal-history')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <SavingsIcon
                    color={isActive('/withdrawal-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}

        {/* Investment Management */}
        <ListItem disablePadding>
          <Tooltip title="Investment Management" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={handleInvestmentClick}
              onTouchStart={() => handleTouchStart('investment-management')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: investmentOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'investment-management'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: investmentOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }),
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                    }
                  })
                }}
              >
                <ShoppingCartIcon color={investmentOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Investment"
                    primaryTypographyProps={{
                      fontWeight: investmentOpen && isMobile ? 600 : 400,
                      color: investmentOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {investmentOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={investmentOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="All Investments" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/investments"
                selected={isActive('/investments')}
                onClick={() => handleItemClick('all-investments')}
                onTouchStart={() => handleTouchStart('all-investments')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/investments') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'all-investments' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingCartIcon
                    color={isActive('/investments') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="All Investments" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && investmentOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="All Investments" placement="right">
              <ListItemButton
                component={Link}
                to="/investments"
                selected={isActive('/investments')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingCartIcon
                    color={isActive('/investments') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}

        {/* Trading Management */}
        <ListItem disablePadding>
          <Tooltip title="Trading Management" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={() => {
                setTradingOpen(!tradingOpen);
                // On mobile, close other sections when opening a new one
                if (isMobile && !tradingOpen) {
                  setTeamOpen(false);
                  setInvestmentOpen(false);
                  setIncomeOpen(false);
                  setWalletOpen(false);
                  setAnnouncementsOpen(false);
                  setRewardsOpen(false);
                  setSettingsOpen(false);
                }
              }}
              onTouchStart={() => handleTouchStart('trading-management')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: tradingOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'trading-management'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: tradingOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }),
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                    }
                  })
                }}
              >
                <TrendingUpIcon color={tradingOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Trading"
                    primaryTypographyProps={{
                      fontWeight: tradingOpen && isMobile ? 600 : 400,
                      color: tradingOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {tradingOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={tradingOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="Package Management" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/trading-packages"
                selected={isActive('/trading-packages')}
                onClick={() => handleItemClick('trading-packages')}
                onTouchStart={() => handleTouchStart('trading-packages')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/trading-packages') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'trading-packages' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <BusinessCenterIcon
                    color={isActive('/trading-packages') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Package Management" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Activation History" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/trade-activation-history"
                selected={isActive('/trade-activation-history')}
                onClick={() => handleItemClick('trade-activation-history')}
                onTouchStart={() => handleTouchStart('trade-activation-history')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/trade-activation-history') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'trade-activation-history' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <AccessTimeIcon
                    color={isActive('/trade-activation-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Activation History" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && tradingOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="Package Management" placement="right">
              <ListItemButton
                component={Link}
                to="/trading-packages"
                selected={isActive('/trading-packages')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <BusinessCenterIcon
                    color={isActive('/trading-packages') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Activation History" placement="right">
              <ListItemButton
                component={Link}
                to="/trade-activation-history"
                selected={isActive('/trade-activation-history')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <AccessTimeIcon
                    color={isActive('/trade-activation-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}

        {/* Income Management */}
        <ListItem disablePadding>
          <Tooltip title="Income Management" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={handleIncomeClick}
              onTouchStart={() => handleTouchStart('income-management')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: incomeOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'income-management'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: incomeOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }),
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                    }
                  })
                }}
              >
                <MonetizationOnIcon color={incomeOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Income"
                    primaryTypographyProps={{
                      fontWeight: incomeOpen && isMobile ? 600 : 400,
                      color: incomeOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {incomeOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={incomeOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="MPR History" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/daily-roi-history"
                selected={isActive('/daily-roi-history')}
                onClick={() => handleItemClick('daily-roi-history')}
                onTouchStart={() => handleTouchStart('daily-roi-history')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/daily-roi-history') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'daily-roi-history' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon
                    color={isActive('/daily-roi-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="MPR History" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Level ROI History" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/level-roi-history"
                selected={isActive('/level-roi-history')}
                onClick={() => handleItemClick('level-roi-history')}
                onTouchStart={() => handleTouchStart('level-roi-history')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/level-roi-history') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'level-roi-history' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon
                    color={isActive('/level-roi-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Level ROI History" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Direct Income History" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/direct-income-history"
                selected={isActive('/direct-income-history')}
                onClick={() => handleItemClick('direct-income-history')}
                onTouchStart={() => handleTouchStart('direct-income-history')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/direct-income-history') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'direct-income-history' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon
                    color={isActive('/direct-income-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Direct Income History" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && incomeOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="MPR History" placement="right">
              <ListItemButton
                component={Link}
                to="/daily-roi-history"
                selected={isActive('/daily-roi-history')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon
                    color={isActive('/daily-roi-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Level ROI History" placement="right">
              <ListItemButton
                component={Link}
                to="/level-roi-history"
                selected={isActive('/level-roi-history')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon
                    color={isActive('/level-roi-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="Direct Income History" placement="right">
              <ListItemButton
                component={Link}
                to="/direct-income-history"
                selected={isActive('/direct-income-history')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon
                    color={isActive('/direct-income-history') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}

        {/* Reward Management */}
        <ListItem disablePadding>
          <Tooltip title="Reward Management" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={() => {
                setRewardsOpen(!rewardsOpen);
                // On mobile, close other sections when opening a new one
                if (isMobile && !rewardsOpen) {
                  setTeamOpen(false);
                  setInvestmentOpen(false);
                  setIncomeOpen(false);
                  setWalletOpen(false);
                  setAnnouncementsOpen(false);
                  setTradingOpen(false);
                }
              }}
              onTouchStart={() => handleTouchStart('reward-management')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: rewardsOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'reward-management'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: rewardsOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }),
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                    }
                  })
                }}
              >
                <EmojiEventsIcon color={rewardsOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Rewards"
                    primaryTypographyProps={{
                      fontWeight: rewardsOpen && isMobile ? 600 : 400,
                      color: rewardsOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {rewardsOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={rewardsOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="Reward Tracking" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/rewards"
                selected={isActive('/rewards')}
                onClick={() => handleItemClick('reward-tracking')}
                onTouchStart={() => handleTouchStart('reward-tracking')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/rewards') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'reward-tracking' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <EmojiEventsIcon
                    color={isActive('/rewards') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Reward Tracking" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && rewardsOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="Reward Tracking" placement="right">
              <ListItemButton
                component={Link}
                to="/rewards"
                selected={isActive('/rewards')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <EmojiEventsIcon
                    color={isActive('/rewards') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}

        {/* Announcements */}
        <ListItem disablePadding>
          <Tooltip title="Announcements" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={() => {
                setAnnouncementsOpen(!announcementsOpen);
                // On mobile, close other sections when opening a new one
                if (isMobile && !announcementsOpen) {
                  setTeamOpen(false);
                  setInvestmentOpen(false);
                  setIncomeOpen(false);
                  setWalletOpen(false);
                  setTradingOpen(false);
                  setRewardsOpen(false);
                  setSettingsOpen(false);
                }
              }}
              onTouchStart={() => handleTouchStart('announcements')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: announcementsOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'announcements'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: announcementsOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }),
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                    }
                  })
                }}
              >
                <AnnouncementIcon color={announcementsOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Announcements"
                    primaryTypographyProps={{
                      fontWeight: announcementsOpen && isMobile ? 600 : 400,
                      color: announcementsOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {announcementsOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {/* Announcements Submenu */}
        <Collapse in={announcementsOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="Manage Announcements" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/announcements"
                selected={isActive('/announcements')}
                onClick={() => handleItemClick('announcements-manage')}
                onTouchStart={() => handleTouchStart('announcements-manage')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/announcements') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'announcements-manage' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <EditIcon
                    color={isActive('/announcements') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Manage" />}
              </ListItemButton>
            </Tooltip>

            <Tooltip title="View Announcements" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/announcements-display"
                selected={isActive('/announcements-display')}
                onClick={() => handleItemClick('announcements-view')}
                onTouchStart={() => handleTouchStart('announcements-view')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/announcements-display') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'announcements-view' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <VisibilityIcon
                    color={isActive('/announcements-display') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="View All" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && announcementsOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="Manage Announcements" placement="right">
              <ListItemButton
                component={Link}
                to="/announcements"
                selected={isActive('/announcements')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <EditIcon
                    color={isActive('/announcements') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
            <Tooltip title="View Announcements" placement="right">
              <ListItemButton
                component={Link}
                to="/announcements-display"
                selected={isActive('/announcements-display')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <VisibilityIcon
                    color={isActive('/announcements-display') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}

        {/* Settings */}
        <ListItem disablePadding>
          <Tooltip title="Settings" placement="right" disableHoverListener={!miniVariant || isMobile}>
            <ListItemButton
              onClick={() => {
                setSettingsOpen(!settingsOpen);
                // On mobile, close other sections when opening a new one
                if (isMobile && !settingsOpen) {
                  setTeamOpen(false);
                  setInvestmentOpen(false);
                  setIncomeOpen(false);
                  setWalletOpen(false);
                  setAnnouncementsOpen(false);
                  setTradingOpen(false);
                  setRewardsOpen(false);
                }
              }}
              onTouchStart={() => handleTouchStart('settings')}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: miniVariant ? 'center' : 'flex-start',
                minHeight: 48,
                px: miniVariant ? 1 : 2.5,
                // Mobile-specific styling for parent menu items
                ...(isMobile && {
                  backgroundColor: settingsOpen
                    ? alpha(theme.palette.primary.main, 0.08)
                    : touchedItem === 'settings'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                  borderLeft: settingsOpen ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }),
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: miniVariant ? 0 : 2,
                  justifyContent: 'center',
                  // Larger icons on mobile for better touch targets
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                    }
                  })
                }}
              >
                <SettingsIcon color={settingsOpen ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!miniVariant && (
                <>
                  <ListItemText
                    primary="Settings"
                    primaryTypographyProps={{
                      fontWeight: settingsOpen && isMobile ? 600 : 400,
                      color: settingsOpen && isMobile ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                  {settingsOpen ? <ExpandLess color={isMobile ? "primary" : "inherit"} /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={settingsOpen && !miniVariant} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              // Mobile-specific styling for nested lists
              ...(isMobile && {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
                my: 0.5,
                mx: 1,
              })
            }}
          >
            <Tooltip title="Admin Settings" placement="right" disableHoverListener={!miniVariant || isMobile}>
              <ListItemButton
                component={Link}
                to="/settings"
                selected={isActive('/settings')}
                onClick={() => handleItemClick('admin-settings')}
                onTouchStart={() => handleTouchStart('admin-settings')}
                onTouchEnd={handleTouchEnd}
                sx={{
                  pl: miniVariant ? 1 : isMobile ? 3 : 4,
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: miniVariant ? 'center' : 'flex-start',
                  minHeight: isMobile ? 48 : 40,
                  // Mobile-specific styling
                  ...(isMobile && {
                    borderLeft: `3px solid ${isActive('/settings') ? theme.palette.primary.main : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: touchedItem === 'admin-settings' ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  }),
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: miniVariant ? 0 : 2,
                    justifyContent: 'center',
                  }}
                >
                  <SettingsIcon
                    color={isActive('/settings') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
                {!miniVariant && <ListItemText primary="Admin Settings" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>

        {/* Show mini menu items when in mini variant */}
        {miniVariant && settingsOpen && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title="Admin Settings" placement="right">
              <ListItemButton
                component={Link}
                to="/settings"
                selected={isActive('/settings')}
                onClick={handleItemClick}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 40,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}30`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                >
                  <SettingsIcon
                    color={isActive('/settings') ? 'primary' : 'inherit'}
                    fontSize="small"
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </Box>
        )}
      </List>
    </Box>
  );

  // Effect to handle responsive behavior
  useEffect(() => {
    // Set miniVariant based on screen size when it changes
    setMiniVariant(isTablet);
  }, [isTablet]);

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: '85%', // Use percentage for better mobile responsiveness
              maxWidth: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              // Improve scrolling on mobile
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              // Add some padding at the bottom for better scrolling
              paddingBottom: '80px',
            },
            // Improve list items for touch
            '& .MuiListItemButton-root': {
              padding: '12px 16px', // Larger padding for better touch targets
              minHeight: '48px', // Minimum height for touch targets
            },
            // Improve nested list items
            '& .MuiCollapse-root .MuiListItemButton-root': {
              paddingLeft: '24px', // Proper indentation for nested items
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: miniVariant ? miniDrawerWidth : drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            transform: open ? 'translateX(0)' : `translateX(-${miniVariant ? miniDrawerWidth : drawerWidth}px)`,
            visibility: open ? 'visible' : 'hidden',
            transition: theme.transitions.create(['width', 'transform', 'visibility'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;
