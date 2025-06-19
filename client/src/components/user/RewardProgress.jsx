import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  AttachMoney as DollarSignIcon,
  People as UsersIcon,
  Place as MapPinIcon,
  Flight as PlaneIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import { safeUserRewardService } from '../../services/reward.service';

const RewardProgress = ({ userId }) => {
  const [rewardStatus, setRewardStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchRewardStatus();
  }, [userId]);

  const fetchRewardStatus = async () => {
    try {
      console.log('Fetching reward data...');
      const data = await safeUserRewardService.getRewardStatus();
      console.log('Reward data received:', data);
      setRewardStatus(data.data);
    } catch (error) {
      console.error('Error fetching reward status:', error);

      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || error.message.includes('Session expired')) {
        // Redirect to login page
        window.location.href = '/login?expired=1';
        return;
      }

      // Set default structure if API fails for other reasons
      setRewardStatus({
        user_summary: {
          total_self_investment: 0,
          total_direct_business: 0,
          direct_referrals_count: 0
        },
        reward_progress: {
          goa_tour: {
            name: "Goa Tour",
            self_invest_target: 1000,
            direct_business_target: 1500,
            current_self_investment: 0,
            current_direct_business: 0,
            self_investment_progress: 0,
            direct_business_progress: 0,
            overall_progress: 0,
            is_qualified: false,
            status: "not_qualified",
            remaining_self_investment: 1000,
            remaining_direct_business: 1500
          },
          bangkok_tour: {
            name: "Bangkok Tour",
            self_invest_target: 5000,
            direct_business_target: 10000,
            current_self_investment: 0,
            current_direct_business: 0,
            self_investment_progress: 0,
            direct_business_progress: 0,
            overall_progress: 0,
            is_qualified: false,
            status: "not_qualified",
            remaining_self_investment: 5000,
            remaining_direct_business: 10000
          }
        },
        direct_referrals: [],
        qualified_rewards: [],
        error: 'Failed to load data. Please try refreshing the page.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status, isQualified) => {
    if (isQualified && status === 'not_qualified') {
      return (
        <Chip
          label="Qualified"
          sx={{
            backgroundColor: '#0ECB81',
            color: '#fff',
            fontWeight: 600,
            '& .MuiChip-label': { fontWeight: 600 }
          }}
        />
      );
    }

    const statusConfig = {
      qualified: { bg: '#0ECB81', color: '#fff', text: 'Qualified' },
      approved: { bg: '#F0B90B', color: '#000', text: 'Approved' },
      completed: { bg: '#2B3139', color: '#F0B90B', text: 'Completed' },
      not_qualified: { bg: 'rgba(240, 185, 11, 0.1)', color: '#F0B90B', text: 'Not Qualified' }
    };

    const config = statusConfig[status] || statusConfig.not_qualified;
    return (
      <Chip
        label={config.text}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          '& .MuiChip-label': { fontWeight: 600 }
        }}
      />
    );
  };

  const rewardTypeMeta = {
    goa_tour: {
      color: '#F0B90B',
      icon: <MapPinIcon sx={{ color: '#F0B90B' }} />,
    },
    bangkok_tour: {
      color: '#F0B90B',
      icon: <PlaneIcon sx={{ color: '#F0B90B' }} />,
    },
    coupon_code: {
      color: '#F0B90B',
      icon: <DollarSignIcon sx={{ color: '#F0B90B' }} />,
    },
    car_reward: {
      color: '#F0B90B',
      icon: <EmojiEventsIcon sx={{ color: '#F0B90B' }} />,
    },
    bike_reward: {
      color: '#F0B90B',
      icon: <EmojiEventsIcon sx={{ color: '#F0B90B' }} />,
    },
  };

  const RewardCard = ({ rewardType, rewardData }) => {
    const meta = rewardTypeMeta[rewardType] || rewardTypeMeta.goa_tour;
    const gold = meta.color;
    const icon = meta.icon;
    const cardBg = '#181A20';
    const borderColor = '#23272F';
    const textColor = '#F5F6FA';
    const subTextColor = '#B0BEC5';

    return (
      <Card sx={{
        mb: 2,
        background: cardBg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 4,
        boxShadow: '0 2px 16px #000A',
        transition: 'all 0.3s',
        color: textColor,
        '&:hover': {
          transform: 'translateY(-6px) scale(1.02)',
          boxShadow: `0 8px 32px ${gold}22`,
          borderColor: gold
        }
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                p: 1.5,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${gold}22 0%, #23272F 100%)`,
                color: gold,
                boxShadow: `0 2px 8px ${gold}22`
              }}>
                {icon}
              </Box>
              <Typography variant="h6" sx={{ color: gold, fontWeight: 700, letterSpacing: 0.5 }}>
                {rewardData?.name}
              </Typography>
            </Box>
            {rewardData?.is_qualified && (
              <Chip
                label="Qualified"
                sx={{
                  background: `linear-gradient(90deg, ${gold} 60%, #fff2 100%)`,
                  color: '#181A20',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 2,
                  boxShadow: `0 2px 8px ${gold}44`
                }}
              />
            )}
            {!rewardData?.is_qualified && getStatusChip(rewardData?.status, rewardData?.is_qualified)}
          </Box>

          {/* Self Investment Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ color: gold }}>
                <DollarSignIcon sx={{ fontSize: 16, mr: 0.5, color: gold }} />
                Self Investment
              </Typography>
              <Typography variant="body2" sx={{ color: gold, fontWeight: 700 }}>
                ${rewardData?.current_self_investment?.toLocaleString() || 0} / ${rewardData?.self_invest_target?.toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={rewardData?.self_investment_progress || 0}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: '#23272F',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${gold} 0%, #fff2 100%)`,
                  borderRadius: 5
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: subTextColor }}>
                {(rewardData?.self_investment_progress || 0).toFixed(1)}% Complete
              </Typography>
              {(rewardData?.remaining_self_investment || 0) > 0 && (
                <Typography variant="caption" sx={{ color: '#F6465D', fontWeight: 600 }}>
                  Need ${rewardData?.remaining_self_investment?.toLocaleString()} more
                </Typography>
              )}
            </Box>
          </Box>

          {/* Direct Business Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ color: gold }}>
                <UsersIcon sx={{ fontSize: 16, mr: 0.5, color: gold }} />
                Direct Business
              </Typography>
              <Typography variant="body2" sx={{ color: gold, fontWeight: 700 }}>
                ${rewardData?.current_direct_business?.toLocaleString() || 0} / ${rewardData?.direct_business_target?.toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={rewardData?.direct_business_progress || 0}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: '#23272F',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${gold} 0%, #fff2 100%)`,
                  borderRadius: 5
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: subTextColor }}>
                {(rewardData?.direct_business_progress || 0).toFixed(1)}% Complete
              </Typography>
              {(rewardData?.remaining_direct_business || 0) > 0 && (
                <Typography variant="caption" sx={{ color: '#F6465D', fontWeight: 600 }}>
                  Need ${rewardData?.remaining_direct_business?.toLocaleString()} more
                </Typography>
              )}
            </Box>
          </Box>

          {/* Overall Progress */}
          <Box sx={{ pt: 2, borderTop: 1, borderColor: borderColor, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ color: textColor }}>Overall Progress</Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color: gold }}>
                {(rewardData?.overall_progress || 0).toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={rewardData?.overall_progress || 0}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: '#23272F',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${gold} 0%, #fff2 100%)`,
                  borderRadius: 6
                }
              }}
            />
          </Box>

          {/* Remarks (if any) */}
          {rewardData?.remarks && rewardData.remarks.trim() !== '' && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              background: '#23272F',
              borderLeft: `4px solid ${gold}`,
              borderRadius: 2,
              px: 2,
              py: 1,
              mb: 2
            }}>
              <EmojiEventsIcon sx={{ color: gold, fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: textColor, fontStyle: 'italic', fontWeight: 500 }}>
                {rewardData.remarks}
              </Typography>
            </Box>
          )}

          {/* Qualification Status */}
          {rewardData?.is_qualified && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon />
                <Typography variant="body2" fontWeight="medium">
                  Congratulations! You're qualified for {rewardData.name}
                </Typography>
              </Box>
              {rewardData.qualification_date && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Qualified on: {new Date(rewardData.qualification_date).toLocaleDateString()}
                </Typography>
              )}
            </Alert>
          )}

          {/* Requirements */}
          {!rewardData?.is_qualified && (
            <Alert severity="warning">
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                Requirements to Qualify:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {(rewardData?.remaining_self_investment || 0) > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DollarSignIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      Invest ${rewardData?.remaining_self_investment?.toLocaleString()} more yourself
                    </Typography>
                  </Box>
                )}
                {(rewardData?.remaining_direct_business || 0) > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UsersIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      Get ${rewardData?.remaining_direct_business?.toLocaleString()} more direct business
                    </Typography>
                  </Box>
                )}
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const SummaryCard = () => {
    if (!rewardStatus) return null;

    return (
      <Card sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #1E2329 0%, #2B3139 100%)',
        border: '2px solid #F0B90B',
        boxShadow: '0 4px 16px rgba(240, 185, 11, 0.15)'
      }}>
        <CardContent>
          <Typography variant="h5" align="center" sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: '#F0B90B',
            fontWeight: 600
          }}>
            <TrophyIcon sx={{ color: '#F0B90B' }} />
            Your Reward Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(240, 185, 11, 0.08)',
                border: '1px solid rgba(240, 185, 11, 0.2)'
              }}>
                <Typography variant="h4" sx={{ color: '#F0B90B', fontWeight: 'bold' }}>
                  ${rewardStatus.user_summary?.total_self_investment?.toLocaleString() || '0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Self Investment
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(14, 203, 129, 0.08)',
                border: '1px solid rgba(14, 203, 129, 0.2)'
              }}>
                <Typography variant="h4" sx={{ color: '#0ECB81', fontWeight: 'bold' }}>
                  ${rewardStatus.user_summary?.total_direct_business?.toLocaleString() || '0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Direct Business
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(240, 185, 11, 0.08)',
                border: '1px solid rgba(240, 185, 11, 0.2)'
              }}>
                <Typography variant="h4" sx={{ color: '#F0B90B', fontWeight: 'bold' }}>
                  {rewardStatus.user_summary?.direct_referrals_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Direct Referrals
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message if there's an authentication or data loading error
  if (rewardStatus?.error) {
    return (
      <Box sx={{ width: '100%' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ Unable to Load Reward Data
          </Typography>
          <Typography variant="body2">
            {rewardStatus.error}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mr: 2 }}
            >
              Refresh Page
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.href = '/login'}
            >
              Login Again
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (!rewardStatus) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Unable to load reward status. Please try again later.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom sx={{
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          <TrophyIcon sx={{ color: '#F0B90B', fontSize: 40 }} />
          Reward Progress
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Track your progress towards exclusive Goa Tour and Bangkok Tour rewards. Build your investment and team to unlock amazing travel experiences!
        </Typography>
      </Box>

      {/* Summary Card */}
      <SummaryCard />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(240, 185, 11, 0.2)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#F0B90B',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#F0B90B',
              height: 3,
              borderRadius: 2
            }
          }}
        >
          <Tab label="🎯 Reward Progress" />
          <Tab label="👥 Direct Referrals" />
          <Tab label="🏆 Reward History" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert
            severity="info"
            sx={{
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(240, 185, 11, 0.08) 100%)',
              border: '1px solid rgba(240, 185, 11, 0.2)',
              '& .MuiAlert-message': { color: 'text.primary' }
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              🎯 <strong>Reward Qualification:</strong> Meet either self investment or direct business targets to qualify for rewards.
            </Typography>
            <Typography variant="body2">
              💡 <strong>Direct Business Calculation:</strong> Your direct business amount is calculated from the total investments made by your direct referrals. Each person you refer who invests contributes to your direct business target.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {Object.entries(rewardStatus.reward_progress || {}).map(([key, rewardData]) => (
              <Grid item xs={12} lg={6} key={key}>
                <RewardCard
                  rewardType={key}
                  rewardData={rewardData}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Referral Link Section */}
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(14, 203, 129, 0.05) 0%, rgba(240, 185, 11, 0.05) 100%)',
            border: '1px solid rgba(14, 203, 129, 0.3)',
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#0ECB81', fontWeight: 600 }}>
                🔗 Your Referral Link
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share this link to invite new members to your team. Each person who joins and invests will contribute to your direct business rewards!
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: 1,
                p: 2,
                background: 'rgba(240, 185, 11, 0.08)',
                borderRadius: 2,
                border: '1px solid rgba(240, 185, 11, 0.2)'
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    color: '#F0B90B',
                    wordBreak: 'break-all'
                  }}
                >
                  {`${window.location.origin}/register?ref=${localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data'))?.username || 'your-username' : 'your-username'}`}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    const referralLink = `${window.location.origin}/register?ref=${localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data'))?.username || 'your-username' : 'your-username'}`;
                    navigator.clipboard.writeText(referralLink);
                    // You can add a toast notification here
                  }}
                  sx={{
                    backgroundColor: '#0ECB81',
                    '&:hover': { backgroundColor: '#0BB574' },
                    minWidth: 'auto',
                    px: 2
                  }}
                >
                  📋 Copy
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Direct Referrals Summary */}
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.05) 0%, rgba(30, 35, 41, 0.5) 100%)',
            border: '1px solid rgba(240, 185, 11, 0.2)',
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#F0B90B', fontWeight: 600 }}>
                <UsersIcon sx={{ color: '#F0B90B' }} />
                👥 Your Direct Team Overview
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(240, 185, 11, 0.08)',
                    border: '1px solid rgba(240, 185, 11, 0.2)'
                  }}>
                    <Typography variant="h3" sx={{ color: '#F0B90B', fontWeight: 'bold' }}>
                      {rewardStatus.direct_referrals?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Direct Referrals
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(14, 203, 129, 0.08)',
                    border: '1px solid rgba(14, 203, 129, 0.2)'
                  }}>
                    <Typography variant="h3" sx={{ color: '#0ECB81', fontWeight: 'bold' }}>
                      {rewardStatus.direct_referrals?.filter(ref => (ref.total_investment || ref.totalInvestment || 0) > 0).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Investors
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(33, 150, 243, 0.08)',
                    border: '1px solid rgba(33, 150, 243, 0.2)'
                  }}>
                    <Typography variant="h3" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                      ${rewardStatus.direct_referrals?.reduce((sum, ref) => sum + (ref.total_investment || ref.totalInvestment || 0), 0).toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Total Investment
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                      (Counts as Direct Business)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Direct Referrals List */}
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.05) 0%, rgba(30, 35, 41, 0.5) 100%)',
            border: '1px solid rgba(240, 185, 11, 0.2)',
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#F0B90B', fontWeight: 600 }}>
                <UsersIcon sx={{ color: '#F0B90B' }} />
                📋 Direct Referrals Details ({rewardStatus.direct_referrals?.length || 0})
              </Typography>

              {rewardStatus.direct_referrals?.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {rewardStatus.direct_referrals.map((referral, index) => (
                    <Paper key={index} sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.08) 0%, rgba(30, 35, 41, 0.8) 100%)',
                      border: '1px solid rgba(240, 185, 11, 0.2)',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(240, 185, 11, 0.15)'
                      }
                    }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000',
                              fontWeight: 'bold',
                              fontSize: '1.2rem'
                            }}>
                              {(referral.name || referral.username || referral.email || 'U').charAt(0).toUpperCase()}
                            </Box>
                            <Box>
                              <Typography variant="body1" fontWeight="medium" sx={{ color: '#F0B90B' }}>
                                {referral.name || referral.username || 'Unknown User'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{referral.username} • #{index + 1} Direct Referral
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" sx={{ color: '#0ECB81', fontWeight: 'bold' }}>
                              ${(referral.total_investment || referral.totalInvestment || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total Investment
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Box textAlign="center">
                            <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 'medium' }}>
                              {referral.created_at ? new Date(referral.created_at).toLocaleDateString() :
                               referral.joinDate ? new Date(referral.joinDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Join Date
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Box textAlign="center">
                            <Chip
                              label={(referral.total_investment || referral.totalInvestment || 0) > 0 ? "Active Investor" : "Not Invested"}
                              sx={{
                                backgroundColor: (referral.total_investment || referral.totalInvestment || 0) > 0 ? '#0ECB81' : '#F6465D',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(240, 185, 11, 0.08) 100%)',
                    border: '1px solid rgba(240, 185, 11, 0.2)',
                    '& .MuiAlert-message': { color: 'text.primary' }
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    🎯 <strong>No direct referrals yet!</strong>
                  </Typography>
                  <Typography variant="body2">
                    Share your referral link to start building your team and earn direct business rewards. Each active referral contributes to your reward qualification!
                  </Typography>
                  <Box sx={{ mt: 2, p: 2, background: 'rgba(240, 185, 11, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      💡 <strong>Pro Tip:</strong> Focus on quality referrals who will invest and stay active. Active investors contribute more to your direct business targets!
                    </Typography>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 2 && (
        <Card sx={{
          background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.05) 0%, rgba(30, 35, 41, 0.5) 100%)',
          border: '1px solid rgba(240, 185, 11, 0.2)',
          borderRadius: 3
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#F0B90B', fontWeight: 600 }}>
              🏆 Your Reward History
            </Typography>
            {rewardStatus.qualified_rewards?.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rewardStatus.qualified_rewards.map((reward, index) => (
                  <Paper key={index} sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(14, 203, 129, 0.08) 0%, rgba(240, 185, 11, 0.08) 100%)',
                    border: '1px solid rgba(14, 203, 129, 0.3)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {reward === 'goa_tour' ?
                        <MapPinIcon sx={{ color: '#FF9800' }} /> :
                        <PlaneIcon sx={{ color: '#2196F3' }} />
                      }
                      <Box>
                        <Typography variant="body1" fontWeight="medium" sx={{ color: '#F0B90B' }}>
                          {reward === 'goa_tour' ? '🏖️ Goa Tour' : '✈️ Bangkok Tour'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qualified for exclusive reward experience
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="Qualified"
                      sx={{
                        backgroundColor: '#0ECB81',
                        color: '#fff',
                        fontWeight: 600
                      }}
                    />
                  </Paper>
                ))}
              </Box>
            ) : (
              <Alert
                severity="info"
                sx={{
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(240, 185, 11, 0.08) 100%)',
                  border: '1px solid rgba(240, 185, 11, 0.2)',
                  '& .MuiAlert-message': { color: 'text.primary' }
                }}
              >
                No qualified rewards yet. Keep building your investment and team to unlock amazing travel experiences!
                <br />
                <strong>Targets:</strong> Goa Tour ($1,000 self + $1,500 direct) | Bangkok Tour ($5,000 self + $10,000 direct)
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RewardProgress;
