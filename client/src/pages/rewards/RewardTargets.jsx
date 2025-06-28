import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Place as MapPinIcon,
  Flight as PlaneIcon,
  AttachMoney as DollarSignIcon,
  People as UsersIcon,
  GpsFixed as TargetIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  CardGiftcard as GiftIcon,
  Star as StarIcon,
  AttachMoney as AttachMoneyIcon,
  SwapHoriz as SwapHorizIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { safeUserRewardService, rewardUtils } from '../../services/reward.service';

const RewardTargets = () => {
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rewardMasters, setRewardMasters] = useState([]);
  const [appliedRewards, setAppliedRewards] = useState({});

  useEffect(() => {
    fetchUserProgress();
    fetchRewardMasters();
    fetchAppliedRewards();
    const interval = setInterval(() => {
      fetchUserProgress();
      fetchRewardMasters();
      fetchAppliedRewards();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUserProgress = async () => {
    try {
      const data = await safeUserRewardService.getRewardStatus();

      // Extract relevant data from the response
      const rewardData = data.data;
      setUserProgress({
        current_self_investment: rewardData?.user_summary?.total_self_investment || 0,
        current_direct_business: rewardData?.user_summary?.total_direct_business || 0,
        direct_referrals_count: rewardData?.user_summary?.direct_referrals_count || 0,
        goa_qualified: rewardData?.reward_progress?.goa_tour?.is_qualified || false,
        bangkok_qualified: rewardData?.reward_progress?.bangkok_tour?.is_qualified || false
      });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Set default values on error
      setUserProgress({
        current_self_investment: 0,
        current_direct_business: 0,
        direct_referrals_count: 0,
        goa_qualified: false,
        bangkok_qualified: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardMasters = async () => {
    try {
      const res = await safeUserRewardService.getActiveRewards();
      if (res?.status && Array.isArray(res.result)) {
        setRewardMasters(res.result);
      } else {
        setRewardMasters([]);
      }
    } catch (err) {
      setRewardMasters([]);
    }
  };

  const fetchAppliedRewards = async () => {
    try {
      const res = await safeUserRewardService.getRewardApplications();
      const map = {};
      if (Array.isArray(res)) {
        res.forEach(app => {
          const type = (app.reward_type && app.reward_type.trim() !== '')
            ? app.reward_type
            : (app.reward_name ? app.reward_name.toLowerCase().replace(/ /g, '_') : '');
          map[type] = app.status;
        });
      }
      setAppliedRewards(map);
    } catch (err) {
      setAppliedRewards({});
    }
  };

  const handleApplyReward = async (rewardId) => {
    try {
      await safeUserRewardService.applyForReward(rewardId);
      fetchAppliedRewards();
    } catch (err) {
      // Optionally show error to user
      console.log(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Debug: Show appliedRewards object
  console.log('appliedRewards:', appliedRewards);

  // Helper to normalize reward_type
  const getRewardType = (reward) => {
    return (reward.reward_type && reward.reward_type.trim() !== '')
      ? reward.reward_type
      : reward.reward_name.toLowerCase().replace(/ /g, '_');
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          🎯 Reward Targets
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Achieve these targets to qualify for exclusive travel rewards
        </Typography>
      </Box>

      {/* Current Status Summary */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 2, overflow: 'visible' }}>
        <Box
          sx={{
            background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 100%)',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            px: 3,
            py: 2.5,
            boxShadow: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <TrendingUpIcon sx={{ color: 'white', fontSize: 32 }} />
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: 'white', letterSpacing: 1, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            Your Current Progress
          </Typography>
        </Box>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#43e97b', mb: 0.5 }}>
                  ${(userProgress?.current_self_investment || 0).toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <AttachMoneyIcon sx={{ color: '#43e97b' }} />
                  <Typography variant="body2" color="text.secondary">
                    Self Investment
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#2196f3', mb: 0.5 }}>
                  ${(userProgress?.current_direct_business || 0).toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <SwapHorizIcon sx={{ color: '#2196f3' }} />
                  <Typography variant="body2" color="text.secondary">
                    Direct Business
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff9800', mb: 0.5 }}>
                  {userProgress?.direct_referrals_count || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <PeopleIcon sx={{ color: '#ff9800' }} />
                  <Typography variant="body2" color="text.secondary">
                    Direct Referrals
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reward Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {rewardMasters.filter(r => r.active).map((reward) => {
          // Calculate progress for this reward
          const selfFulfilled = (userProgress?.current_self_investment || 0) >= reward.self_invest_target;
          const directFulfilled = (userProgress?.current_direct_business || 0) >= reward.direct_business_target;
          const qualified = selfFulfilled || directFulfilled;
          const appliedStatus = appliedRewards[getRewardType(reward)];
          // Debug: Log reward_type and appliedStatus for each card
          console.log('CARD:', reward.reward_name, '| reward_type:', getRewardType(reward), '| appliedStatus:', appliedStatus);
          return (
            <Grid item xs={12} lg={6} key={reward._id}>
              <Card sx={{ border: '2px solid orange', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GiftIcon sx={{ color: 'orange', fontSize: 32 }} />
                      <Box>
                        <Typography variant="h5" fontWeight="bold">{reward.reward_name}</Typography>
                        {reward.reward_type && (
                          <Chip label={reward.reward_type} size="small" sx={{ mt: 0.5, ml: 0.5, fontSize: 12, background: '#f5f5f5' }} />
                        )}
                      </Box>
                    </Box>
                    <Chip
                      label={qualified ? "Qualified" : "In Progress"}
                      color={qualified ? "success" : "default"}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {reward.description || 'Achieve the targets to qualify for this reward.'}
                  </Typography>
                  {/* Self Investment Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                      Self Investment: ${(userProgress?.current_self_investment || 0).toLocaleString()} / ${reward.self_invest_target}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(((userProgress?.current_self_investment || 0) / reward.self_invest_target) * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  {/* Direct Business Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                      Direct Business: ${(userProgress?.current_direct_business || 0).toLocaleString()} / ${reward.direct_business_target}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(((userProgress?.current_direct_business || 0) / reward.direct_business_target) * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  {/* Status/Action Section */}
                  {!qualified && (
                    <Alert severity="info" sx={{ mt: 2 }}>In Progress</Alert>
                  )}
                  {qualified && !appliedStatus && (
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={() => handleApplyReward(reward._id)}
                    >
                      Apply
                    </Button>
                  )}
                  {qualified && appliedStatus && (
                    <Button
                      variant="outlined"
                      color="success"
                      sx={{ mt: 2 }}
                      disabled
                    >
                      Applied
                    </Button>
                  )}
                  {appliedStatus === 'pending' && (
                    <Alert severity="info" sx={{ mt: 2 }}>Applied (Pending Approval)</Alert>
                  )}
                  {appliedStatus === 'approved' && (
                    <Alert severity="success" sx={{ mt: 2 }}>Reward Approved!</Alert>
                  )}
                  {appliedStatus === 'rejected' && (
                    <Alert severity="error" sx={{ mt: 2 }}>Application Rejected</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

    </Box>
  );
};

export default RewardTargets;
