import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  Star as StarIcon,
  AccountBalanceWallet as WalletIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
    ShoppingCart as ShoppingCartIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import useApi from '../../hooks/useApi';
import InvestmentService from '../../services/investment.service';
import TradingPackageService from '../../services/tradingpackage.service';
import UserService from '../../services/user.service';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

const BuyPackage = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await UserService.getUserProfile();
        setUser(res.data || res.result || res);
      } catch (err) {
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch trading packages from API
  const {
    data: packagesData,
    loading: packagesLoading,
    error: packagesError,
  } = useApi(() => TradingPackageService.getAllTradingPackages(), true);

  // Add investment - only create the API handler, don't execute immediately
  const {
    data: investmentData,
    loading: investmentLoading,
    error: investmentError,
    execute: addInvestment,
  } = useApi((data) => InvestmentService.addTradingPackage(data), false);

  // Handle successful investment
  useEffect(() => {
    if (investmentData?.result) {
      setShowAmountInput(false);
      setModalOpen(false);
      Swal.fire({
        title: 'Success!',
        text: 'Your investment has been successfully processed.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: theme.palette.primary.main,
      }).then(() => {
        navigate('/dashboard');
      });
    }
  }, [investmentData, theme.palette.primary.main, navigate]);

  useEffect(() => {
    if (investmentError) {
      // Handle different types of error responses
      let errorMessage = 'Failed to process investment';

      if (investmentError.msg) {
        errorMessage = investmentError.msg;
      } else if (investmentError.message) {
        errorMessage = investmentError.message;
      } else if (typeof investmentError === 'string') {
        errorMessage = investmentError;
      } else if (investmentError.response?.data?.msg) {
        errorMessage = investmentError.response.data.msg;
      } else if (investmentError.response?.data?.message) {
        errorMessage = investmentError.response.data.message;
      }

      // Make error messages more user-friendly
      if (errorMessage.includes('Insufficient top-up wallet balance')) {
        errorMessage = `Insufficient balance in your top-up wallet. Please add funds to continue.`;
      } else if (errorMessage.includes('Investment amount must be more than $50')) {
        errorMessage = 'Minimum investment amount is $50. Please increase your investment amount.';
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'Account verification failed. Please try logging in again.';
      } else if (errorMessage.includes('Wallet update failed')) {
        errorMessage = 'Payment processing failed. Please try again or contact support.';
      } else if (errorMessage.includes('Failed to create trading package investment')) {
        errorMessage = 'Investment creation failed. Please try again or contact support.';
      }

      setError(errorMessage);
      setShowAmountInput(false);
    }
  }, [investmentError]);

  // Reset states when packages data loads
  useEffect(() => {
    const packages = packagesData?.data || packagesData?.result || [];
    if (packages && packages.length > 0) {
      // Don't auto-select, let user choose
      setShowAmountInput(false);
      setSelectedPlan(null);
      setAmount('');
      setError('');
    }
  }, [packagesData]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setAmount('');
    setError('');
    setShowAmountInput(true);
    setModalOpen(true);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setError('');
  };

  const validateAmount = () => {
    if (!selectedPlan) {
      setError('Please select a trading package first');
      return false;
    }

    const numAmount = parseFloat(amount);

    if (!numAmount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < selectedPlan.trading_amount_from) {
      setError(`Minimum investment amount is ${formatCurrency(selectedPlan.trading_amount_from)}`);
      return false;
    }

    if (!selectedPlan.is_unlimited && numAmount > selectedPlan.trading_amount_to) {
      setError(`Maximum investment amount is ${formatCurrency(selectedPlan.trading_amount_to)}`);
      return false;
    }

    if (numAmount > user.wallet_topup) {
      setError('Insufficient balance in your wallet');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateAmount()) {
      return;
    }
    handleConfirmInvestment();
  };

  const handleConfirmInvestment = async () => {
    try {
      const investmentAmount = parseFloat(amount);
      setError('');
         console.log(
          "data",
          
          {
          amount: investmentAmount,
          package_id: selectedPlan.id,
          daily_profit: selectedPlan.daily_trading_roi,
          "selectedPlan":selectedPlan
        });
         

      await addInvestment({
        amount: investmentAmount,
        package_id: selectedPlan.id,
        daily_profit: selectedPlan.daily_trading_roi
      });
    } catch (error) {
      let errorMessage = 'Failed to process investment';
      if (error.msg) {
        errorMessage = error.msg;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setShowAmountInput(false);
    setSelectedPlan(null);
    setAmount('');
    setError('');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
  };

  // Get packages data from API response with proper structure handling
  const apiPackages = packagesData?.data || packagesData?.result || [];

  // Fallback packages if API doesn't return data
  const fallbackPackages = [
    {
      _id: 'silver-fallback',
      name: 'Silver',
      package_number: 1,
      daily_trading_roi: 1,
      trading_amount_from: 50,
      trading_amount_to: 499,
      is_unlimited: false,
      description: 'Silver trading package for beginners',
      features: ['1% Daily ROI', 'Minimum $50', 'Maximum $499', '10% Referral Bonus'],
      status: true,
      sort_order: 1,
      extra: {
        color: '#C0C0C0',
        recommended: false,
        tier: 'silver'
      }
    },
    {
      _id: 'gold-fallback',
      name: 'Gold',
      package_number: 2,
      daily_trading_roi: 1.15,
      trading_amount_from: 500,
      trading_amount_to: null,
      is_unlimited: true,
      description: 'Gold trading package for advanced traders',
      features: ['1.15% Daily ROI', 'Minimum $500', 'Unlimited Maximum', '10% Referral Bonus'],
      status: true,
      sort_order: 2,
      extra: {
        color: '#FFD700',
        recommended: true,
        tier: 'gold'
      }
    }
  ];

  // Use API packages if available, otherwise use fallback
  const packages = apiPackages.length > 0 ? apiPackages : fallbackPackages;

  // 1. Calculate monthly ROI for each plan
  const getMonthlyRoi = (plan) => {
    if (plan.extra?.monthly_roi) return plan.extra.monthly_roi;
    return plan.daily_trading_roi * 30;
  };

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">Failed to load user data. Please try again.</Alert>
      </Box>
    );
  }
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} edge="start" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mr: 1 }}>
              {showAmountInput && selectedPlan ? selectedPlan.name : 'Trading Packages'}
            </Typography>
            <IconButton size="small" onClick={toggleFavorite}>
              {favorite ? <StarIcon sx={{ color: '#F3BA2F' }} /> : <StarBorderIcon />}
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => navigate('/investment-history')}>
            <HistoryIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Trust Wallet Style Price Chart Area */}
      <Box
        sx={{
          height: { xs: 200, sm: 250 },
          background: mode === 'dark'
            ? 'linear-gradient(135deg, rgba(51, 117, 187, 0.2) 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'linear-gradient(180deg, rgba(245, 247, 250, 0.8) 0%, rgba(255, 255, 255, 1) 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === 'dark'
              ? 'radial-gradient(circle at 30% 30%, rgba(51, 117, 187, 0.4), transparent 70%)'
              : 'radial-gradient(circle at 30% 30%, rgba(51, 117, 187, 0.1), transparent 70%)',
            opacity: 0.8,
            zIndex: 0,
            animation: 'pulse 8s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.5 },
              '50%': { opacity: 0.8 },
              '100%': { opacity: 0.5 },
            },
          },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Trust Wallet Style Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.1,
            background: `radial-gradient(circle, ${theme.palette.primary.main}30 10%, transparent 10.5%) 0 0,
                        radial-gradient(circle, ${theme.palette.primary.main}30 10%, transparent 10.5%) 8px 8px`,
            backgroundSize: '16px 16px',
            animation: 'pulse 4s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { opacity: 0.05 },
              '50%': { opacity: 0.15 },
              '100%': { opacity: 0.05 },
            },
          }}
        />

        {/* Trust Wallet Style Grid Lines */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.15,
            backgroundImage: `
              linear-gradient(90deg, ${theme.palette.primary.main}20 1px, transparent 1px),
              linear-gradient(180deg, ${theme.palette.primary.main}20 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: 'moveLines 20s infinite linear',
            '@keyframes moveLines': {
              '0%': { backgroundPosition: '0 0' },
              '100%': { backgroundPosition: '20px 20px' },
            },
          }}
        />

        {/* Trust Wallet Style Animated Chart Line */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '40%',
            bottom: '20%',
            left: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='none' stroke='%233375BB' stroke-width='4' d='M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'moveChart 30s infinite linear',
              '@keyframes moveChart': {
                '0%': { backgroundPosition: '0% center' },
                '100%': { backgroundPosition: '100% center' },
              },
            }
          }}
        />

        {/* Trust Wallet Logo Animation */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              borderRadius: '50%',
              backgroundColor: 'rgba(51, 117, 187, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(51, 117, 187, 0.2)',
              animation: 'float 3s infinite ease-in-out',
              '@keyframes float': {
                '0%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' },
                '100%': { transform: 'translateY(0px)' },
              },
              mb: 2,
            }}
          >
            <AccountBalanceWalletIcon
              sx={{
                fontSize: { xs: 40, sm: 50 },
                color: theme.palette.primary.main,
              }}
            />
          </Box>
        </Box>

        {/* Package title overlay with animation */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: { xs: '15px 20px', sm: '20px 30px' },
            background: mode === 'dark'
              ? 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
              : 'linear-gradient(to top, rgba(240, 244, 248, 0.1), transparent)',
            animation: 'fadeInUp 0.8s ease-out',
            '@keyframes fadeInUp': {
              '0%': { transform: 'translateY(20px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 },
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: mode === 'dark' ? '#fff' : '#000',
              textShadow: mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : 'none',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showAmountInput && selectedPlan ? selectedPlan.name : 'Choose Your Trading Package'}
            <Box
              sx={{
                ml: 1.5,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: mode === 'dark' ? 'rgba(14, 203, 129, 0.2)' : 'rgba(240, 244, 248, 1)',
                borderRadius: 20,
                px: 1.5,
                py: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? '#0ECB81' : '#000',
                  fontWeight: 'bold',
                  textShadow: 'none',
                }}
              >
                {showAmountInput && selectedPlan?.daily_trading_roi ? `${getMonthlyRoi(selectedPlan).toFixed(2)}% Monthly ROI` : 'Start Your Investment Journey'}
              </Typography>
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* Trading Form */}
      <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Package Selection */}
        {packagesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress
              sx={{
                color: mode === 'dark' ? '#fff' : '#000',
                animation: 'spin 1.5s linear infinite, pulse-opacity 2s ease-in-out infinite',
                '@keyframes pulse-opacity': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 },
                },
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }}
            />
          </Box>
        ) : packagesError ? (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              animation: 'slide-in 0.5s ease-out',
              '@keyframes slide-in': {
                '0%': { transform: 'translateY(-20px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              }
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            }
          >
            Failed to load trading packages. Please check your connection and try again.
          </Alert>
        ) : (
          <Box
            sx={{
              mb: 4,
              animation: 'fade-in 0.6s ease-out',
              '@keyframes fade-in': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              }
            }}
          >
            <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              color: mode === 'dark' ? theme.palette.primary.main : '#000',
              textShadow: mode === 'dark' ? '0 0 1px rgba(51, 117, 187, 0.2)' : 'none',
              '&::before': {
                content: '""',
                display: 'inline-block',
                width: 4,
                height: 24,
                backgroundColor: mode === 'dark' ? theme.palette.primary.main : '#000',
                marginRight: 1.5,
                borderRadius: 4,
                boxShadow: mode === 'dark' ? '0 0 8px rgba(51, 117, 187, 0.5)' : 'none',
              }
            }}
          >
           Select Trading Package
          </Typography>

            <Grid container spacing={2}>
              {packages.map((plan, index) => (
                <Grid item xs={12} sm={6} md={4} key={plan._id}>
                  <Paper
                    elevation={0}
                    sx={{
                      background: plan.name?.toLowerCase().includes('gold')
                        ? 'linear-gradient(135deg, #FFD700 0%, #FFEF8A 40%, #D4AF37 100%)'
                        : plan.name?.toLowerCase().includes('silver')
                        ? 'linear-gradient(135deg, #C0C0C0 0%, #F8F8FF 40%, #A8A9AD 100%)'
                        : 'linear-gradient(135deg, #3375BB 0%, #2A5F9E 100%)',
                      border: plan.name?.toLowerCase().includes('gold')
                        ? '2px solid #FFD700'
                        : plan.name?.toLowerCase().includes('silver')
                        ? '2px solid #C0C0C0'
                        : 'none',
                      boxShadow: plan.name?.toLowerCase().includes('gold')
                        ? '0 2px 8px rgba(212, 175, 55, 0.25)'
                        : plan.name?.toLowerCase().includes('silver')
                        ? '0 2px 8px rgba(192, 192, 192, 0.18)'
                        : 'none',
                      p: 0,
                      borderRadius: 3,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      height: 'auto',
                      minHeight: '280px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: plan.name?.toLowerCase().includes('gold')
                          ? '0 12px 24px rgba(212, 175, 55, 0.35)'
                          : plan.name?.toLowerCase().includes('silver')
                          ? '0 12px 24px rgba(192, 192, 192, 0.25)'
                          : mode === 'dark'
                            ? '0 12px 24px rgba(0,0,0,0.3)'
                            : '0 12px 24px rgba(51, 117, 187, 0.15)',
                        borderColor: plan.name?.toLowerCase().includes('gold')
                          ? '#FFD700'
                          : plan.name?.toLowerCase().includes('silver')
                          ? '#C0C0C0'
                          : theme.palette.primary.main,
                        '& .package-icon': {
                          transform: 'scale(1.05)',
                        },
                        '& .package-button': {
                          transform: 'translateY(-1px)',
                          boxShadow: plan.name?.toLowerCase().includes('gold')
                            ? '0 6px 16px rgba(212, 175, 55, 0.3)'
                            : plan.name?.toLowerCase().includes('silver')
                            ? '0 6px 16px rgba(192, 192, 192, 0.22)'
                            : '0 6px 16px rgba(51, 117, 187, 0.3)',
                        },
                      },
                      animation: `fade-slide-in 0.4s ease-out ${index * 0.1}s both`,
                      '@keyframes fade-slide-in': {
                        '0%': { transform: 'translateY(20px)', opacity: 0 },
                        '100%': { transform: 'translateY(0)', opacity: 1 },
                      },
                    }}
                  >
                    {/* Compact Header Section */}
                    <Box
                      sx={{
                        background: plan.name?.toLowerCase().includes('gold')
                          ? 'linear-gradient(135deg, #FFD700 0%, #FFEF8A 40%, #D4AF37 100%)'
                          : plan.name?.toLowerCase().includes('silver')
                          ? 'linear-gradient(135deg, #C0C0C0 0%, #F8F8FF 40%, #A8A9AD 100%)'
                          : 'linear-gradient(135deg, #3375BB 0%, #2A5F9E 100%)',
                        p: 2.5,
                        borderRadius: '12px 12px 0 0',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        {/* Package Info */}
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{
                              color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : '#fff',
                              textShadow: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '0 1px 2px rgba(255,255,255,0.25)' : '0 1px 2px rgba(0,0,0,0.3)',
                              mb: 0.5,
                            }}
                          >
                            {plan.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : 'rgba(255, 255, 255, 0.9)',
                              fontSize: '0.85rem',
                            }}
                          >
                            {formatCurrency(plan.trading_amount_from)} - {plan.is_unlimited ? 'Unlimited' : formatCurrency(plan.trading_amount_to)}
                          </Typography>
                        </Box>

                        {/* ROI Badge */}
                        <Box
                          className="package-icon"
                          sx={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 2,
                            px: 2,
                            py: 1.5,
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{
                              color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : '#fff',
                              textShadow: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '0 1px 2px rgba(255,255,255,0.25)' : '0 1px 2px rgba(0,0,0,0.3)',
                              lineHeight: 1,
                              mb: 0.5,
                            }}
                          >
                            {getMonthlyRoi(plan).toFixed(2)}%
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : 'rgba(255, 255, 255, 0.9)',
                              fontWeight: 'medium',
                              fontSize: '0.7rem',
                              display: 'block',
                            }}
                          >
                            Monthly ROI
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Compact Content Section */}
                    <Box
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        zIndex: 1,
                        background: mode === 'dark'
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(255, 255, 255, 1)',
                        borderRadius: '0 0 12px 12px',
                        minHeight: '120px',
                      }}
                    >
                      {/* Quick ROI Examples */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: mode === 'dark' ? theme.palette.text.secondary : '#6E7C87',
                            display: 'block',
                            textAlign: 'center',
                            mb: 1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                          }}
                        >
                          Daily Returns Examples
                        </Typography>

                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Box sx={{
                              p: 1,
                              borderRadius: 1.5,
                              backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                              textAlign: 'center',
                              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : undefined }}>
                                {plan.name?.toLowerCase().includes('gold') ? '$5000 →' : '$100 →'}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : '#0ECB81', fontSize: '0.8rem' }}>
                                {plan.name?.toLowerCase().includes('gold')
                                  ? `$${(5000 * (plan.daily_trading_roi / 100)).toFixed(2)}/day`
                                  : `$${(100 * (plan.daily_trading_roi / 100)).toFixed(2)}/day`}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{
                              p: 1,
                              borderRadius: 1.5,
                              backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                              textAlign: 'center',
                              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : undefined }}>
                                {plan.name?.toLowerCase().includes('gold') ? '$10000 →' : '$1000 →'}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver') ? '#222' : '#0ECB81', fontSize: '0.8rem' }}>
                                {plan.name?.toLowerCase().includes('gold')
                                  ? `$${(10000 * (plan.daily_trading_roi / 100)).toFixed(2)}/day`
                                  : `$${(1000 * (plan.daily_trading_roi / 100)).toFixed(2)}/day`}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Key Features - Compact */}
                      {plan.features && plan.features.length > 0 && (
                        <Box sx={{ mb: 2, flex: 1 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                            {plan.features.slice(0, 2).map((feature, index) => (
                              <Typography
                                key={index}
                                variant="caption"
                                sx={{
                                  color: mode === 'dark' ? theme.palette.text.secondary : '#6E7C87',
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                                }}
                              >
                                <span style={{ marginRight: '4px', color: '#0ECB81', fontSize: '0.6rem' }}>✓</span>
                                {feature.replace('Daily ROI', '').replace('Referral Bonus', 'Referral').replace('Minimum', 'Min').replace('Maximum', 'Max').replace('Unlimited', 'No Limit')}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Compact Buy Button */}
                      <Button
                        className="package-button"
                        variant="contained"
                        fullWidth
                        onClick={() => handlePlanSelect(plan)}
                        sx={{
                          background: plan.name?.toLowerCase().includes('gold')
                            ? 'linear-gradient(135deg, #FFD700 0%, #FFEF8A 40%, #D4AF37 100%)'
                            : plan.name?.toLowerCase().includes('silver')
                            ? 'linear-gradient(135deg, #C0C0C0 0%, #F8F8FF 40%, #A8A9AD 100%)'
                            : 'linear-gradient(135deg, #3375BB 0%, #2A5F9E 100%)',
                          color: (plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver')) ? '#222' : '#fff',
                          textShadow: (plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('silver')) ? '0 1px 2px rgba(255,255,255,0.25)' : '0 1px 2px rgba(0,0,0,0.3)',
                          boxShadow: plan.name?.toLowerCase().includes('gold')
                            ? '0 2px 8px rgba(212, 175, 55, 0.25)'
                            : plan.name?.toLowerCase().includes('silver')
                            ? '0 2px 8px rgba(192, 192, 192, 0.18)'
                            : '0 4px 12px rgba(51, 117, 187, 0.2)',
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          border: plan.name?.toLowerCase().includes('gold')
                            ? '1.5px solid #FFD700'
                            : plan.name?.toLowerCase().includes('silver')
                            ? '1.5px solid #C0C0C0'
                            : 'none',
                          backgroundImage: 'none',
                          transition: 'all 0.3s ease',
                          textTransform: 'none',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: plan.name?.toLowerCase().includes('gold')
                              ? '0 15px 30px rgba(212, 175, 55, 0.4)'
                              : plan.name?.toLowerCase().includes('silver')
                              ? '0 15px 30px rgba(192, 192, 192, 0.28)'
                              : '0 15px 30px rgba(51, 117, 187, 0.4)',
                          },
                        }}
                      >
                        Choose {plan.name}
                      </Button>
                    </Box>

                    {/* Recommended Badge */}
                    {plan.extra?.recommended && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#FFD700',
                          color: '#000',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                          animation: 'pulse-gold 2s infinite',
                          '@keyframes pulse-gold': {
                            '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.7)' },
                            '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(255, 215, 0, 0)' },
                            '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 215, 0, 0)' },
                          },
                        }}
                      >
                        ⭐
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Back to Packages Button */}
        {showAmountInput && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                setShowAmountInput(false);
                setSelectedPlan(null);
                setAmount('');
                setError('');

              }}
              sx={{
                borderRadius: 2,
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                color: mode === 'dark' ? '#fff' : '#000',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.1)' : 'rgba(51, 117, 187, 0.05)',
                },
              }}
            >
              Back to Packages
            </Button>
          </Box>
        )}

        {/* Selected Package Details - Only show when amount input is active */}
        {showAmountInput && selectedPlan && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.05)' : 'rgba(255, 255, 255, 1)',
              border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : '#E6E8EA'}`,
              mb: 3,
              boxShadow: mode === 'dark'
                ? '0 8px 20px rgba(0,0,0,0.05)'
                : '0 2px 8px rgba(0, 0, 0, 0.03)',
              animation: 'fadeInUp 0.6s ease-out 0.1s both',
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                color: mode === 'dark' ? theme.palette.primary.main : '#000',
                textShadow: mode === 'dark' ? '0 0 1px rgba(51, 117, 187, 0.2)' : 'none',
                '&::before': {
                  content: '""',
                  display: 'inline-block',
                  width: 4,
                  height: 24,
                  backgroundColor: mode === 'dark' ? theme.palette.primary.main : '#000',
                  marginRight: 1.5,
                  borderRadius: 4,
                  boxShadow: mode === 'dark' ? '0 0 8px rgba(51, 117, 187, 0.5)' : 'none',
                }
              }}
            >
              {selectedPlan.name} Details
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: mode === 'dark' ? theme.palette.text.secondary : '#6E7C87',
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              {selectedPlan.description}
            </Typography>

            {selectedPlan.features && selectedPlan.features.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{
                    mb: 1.5,
                    color: mode === 'dark' ? theme.palette.primary.main : '#000',
                  }}
                >
                  Package Features:
                </Typography>
                <Grid container spacing={1}>
                  {selectedPlan.features.map((feature, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255, 255, 255, 1)',
                            transform: 'translateX(5px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.main,
                            mr: 1,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: mode === 'dark' ? theme.palette.text.primary : '#000',
                            fontSize: '0.75rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {feature}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        )}

        {/* Error Message */}
        {error && (
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setError('')}
            sx={{
              mb: 3,
              borderRadius: 3,
              fontSize: '1rem',
              fontWeight: 'medium',
              boxShadow: '0 8px 24px rgba(244, 67, 54, 0.3)',
              animation: 'error-slide-in 0.5s cubic-bezier(.36,.07,.19,.97) both',
              '@keyframes error-slide-in': {
                '0%': {
                  transform: 'translateY(-20px) scale(0.95)',
                  opacity: 0
                },
                '50%': {
                  transform: 'translateY(5px) scale(1.02)'
                },
                '100%': {
                  transform: 'translateY(0) scale(1)',
                  opacity: 1
                },
              },
              '& .MuiAlert-message': {
                fontSize: '1rem',
                lineHeight: 1.5,
              },
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              },
              '& .MuiAlert-action': {
                alignItems: 'center',
              },
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                Investment Failed
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Modal for Amount Input and Confirmation */}
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: { xs: 2, sm: 3 },
              backgroundColor: mode === 'dark' ? '#181818' : '#fff',
              color: mode === 'dark' ? '#fff' : '#181818',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              minWidth: { xs: '90vw', sm: 400 },
            },
          }}
        >
          <DialogTitle sx={{
            fontWeight: 'bold',
            color: '#FFD700',
            textAlign: 'center',
            pb: 0,
            fontSize: '1.3rem',
            background: 'none',
            letterSpacing: 1,
          }}>
            Buy {selectedPlan?.name} Package
          </DialogTitle>
          <DialogContent sx={{
            color: mode === 'dark' ? '#fff' : '#181818',
            background: 'none',
          }}>
            {selectedPlan && (
              <>
                <Typography variant="body2" sx={{ color: mode === 'dark' ? '#fff' : '#181818', mb: 2 }}>
                  {selectedPlan.description}
                </Typography>
                <TextField
                  fullWidth
                  label="Enter Amount"
                  value={amount}
                  onChange={handleAmountChange}
                  type="number"
                  error={!!error && (error.includes('amount') || error.includes('balance') || error.includes('Minimum') || error.includes('Maximum'))}
                  helperText={
                    error && (error.includes('amount') || error.includes('balance') || error.includes('Minimum') || error.includes('Maximum'))
                      ? error
                      : `Range: ${formatCurrency(selectedPlan?.trading_amount_from || 0)} - ${selectedPlan?.is_unlimited ? 'Unlimited' : formatCurrency(selectedPlan?.trading_amount_to || 0)}`
                  }
                  slotProps={{
                    input: {
                      min: selectedPlan?.trading_amount_from || 0,
                      max: selectedPlan?.is_unlimited ? undefined : selectedPlan?.trading_amount_to,
                      step: "0.01"
                    }
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      backgroundColor: mode === 'dark' ? '#222' : 'rgba(245, 247, 250, 0.8)',
                      color: mode === 'dark' ? '#fff' : '#181818',
                      '& fieldset': {
                        borderColor: '#FFD700',
                      },
                      '&:hover fieldset': {
                        borderColor: '#FFD700',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FFD700',
                        borderWidth: 2,
                      },
                      '&.Mui-error fieldset': {
                        borderColor: '#f44336',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? '#FFD700' : '#181818',
                      '&.Mui-focused': {
                        color: '#FFD700',
                      },
                      '&.Mui-error': {
                        color: '#f44336',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                      marginTop: 1,
                      color: mode === 'dark' ? '#FFD700' : '#181818',
                      '&.Mui-error': {
                        color: '#f44336',
                        fontWeight: 'bold',
                      },
                    },
                  }}
                  placeholder={`Min: ${formatCurrency(selectedPlan?.trading_amount_from || 0)}`}
                />
                {amount && parseFloat(amount) > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color={mode === 'dark' ? '#FFD700' : '#181818'}>
                      Monthly Returns
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#FFD700' }}>
                      {getMonthlyRoi(selectedPlan).toFixed(2)}% ({formatCurrency(parseFloat(amount) * (getMonthlyRoi(selectedPlan) / 100))})
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color={mode === 'dark' ? '#FFD700' : '#181818'}>
                    Available Balance
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#FFD700' }}>
                    {formatCurrency(user?.wallet_topup || 0)}
                  </Typography>
                </Box>
              </>
            )}
            {error && (
              <Alert severity="error" variant="filled" onClose={() => setError('')} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 2, background: 'none' }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!amount || !selectedPlan || investmentLoading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                backgroundColor: '#FFD700',
                color: mode === 'dark' ? '#181818' : '#181818',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 10px 20px rgba(255, 215, 0, 0.15)',
                '&:hover': {
                  backgroundColor: '#FFC300',
                },
                '&.Mui-disabled': {
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                }
              }}
            >
              {investmentLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} />
                  Processing...
                </Box>
              ) : (
                `Buy ${selectedPlan?.name || 'Package'}`
              )}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseModal}
              sx={{
                py: 1.5,
                borderRadius: 2,
                borderColor: '#FFD700',
                color: '#FFD700',
                '&:hover': {
                  borderColor: '#FFC300',
                  backgroundColor: mode === 'dark' ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 215, 0, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default BuyPackage;
