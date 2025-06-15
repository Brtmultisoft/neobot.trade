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
  Star as StarIcon
} from '@mui/icons-material';
import { safeUserRewardService, rewardUtils } from '../../services/reward.service';

const RewardTargets = () => {
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProgress();
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



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

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
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f5f5f5 0%, #e3f2fd 100%)', border: '2px solid #2196f3' }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ color: 'primary.main' }} />
            Your Current Progress
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  ${(userProgress?.current_self_investment || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Self Investment
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ${(userProgress?.current_direct_business || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Direct Business
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {userProgress?.direct_referrals_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Direct Referrals
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reward Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Goa Tour Card */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ border: '2px solid orange', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapPinIcon sx={{ color: 'orange', fontSize: 32 }} />
                  <Typography variant="h5" fontWeight="bold">Goa Tour</Typography>
                </Box>
                <Chip
                  label={userProgress?.goa_qualified ? "Qualified" : "In Progress"}
                  color={userProgress?.goa_qualified ? "success" : "default"}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Experience the beautiful beaches and culture of Goa
              </Typography>

              {/* Self Investment Progress */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Self Investment: ${(userProgress?.current_self_investment || 0).toLocaleString()} / $1,000
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((userProgress?.current_self_investment || 0) / 1000) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* Direct Business Progress */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Direct Business: ${(userProgress?.current_direct_business || 0).toLocaleString()} / $1,500
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((userProgress?.current_direct_business || 0) / 1500) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {userProgress?.goa_qualified ? (
                <Alert severity="success">
                  <Typography variant="body2">
                    🎉 Congratulations! You're qualified for the Goa Tour!
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2">
                    Keep investing and building your team to qualify for this amazing reward!
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bangkok Tour Card */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ border: '2px solid blue', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlaneIcon sx={{ color: 'blue', fontSize: 32 }} />
                  <Typography variant="h5" fontWeight="bold">Bangkok Tour</Typography>
                </Box>
                <Chip
                  label={userProgress?.bangkok_qualified ? "Qualified" : "In Progress"}
                  color={userProgress?.bangkok_qualified ? "success" : "default"}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Explore the vibrant city of Bangkok, Thailand
              </Typography>

              {/* Self Investment Progress */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Self Investment: ${(userProgress?.current_self_investment || 0).toLocaleString()} / $5,000
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((userProgress?.current_self_investment || 0) / 5000) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* Direct Business Progress */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Direct Business: ${(userProgress?.current_direct_business || 0).toLocaleString()} / $10,000
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((userProgress?.current_direct_business || 0) / 10000) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {userProgress?.bangkok_qualified ? (
                <Alert severity="success">
                  <Typography variant="body2">
                    🎉 Congratulations! You're qualified for the Bangkok Tour!
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2">
                    Keep investing and building your team to qualify for this premium reward!
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Motivation Section */}
      <Card sx={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)', border: '1px solid #9c27b0' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <MapPinIcon sx={{ fontSize: 40, color: 'orange' }} />
            <PlaneIcon sx={{ fontSize: 40, color: 'blue' }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="secondary" sx={{ mb: 2 }}>
            Start Your Journey Today!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            These exclusive travel rewards are waiting for you. Build your investment and team to unlock amazing experiences.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" sx={{ bgcolor: 'orange', '&:hover': { bgcolor: '#e65100' } }}>
              <MapPinIcon sx={{ mr: 1 }} />
              Target Goa Tour
            </Button>
            <Button variant="contained" color="primary">
              <PlaneIcon sx={{ mr: 1 }} />
              Target Bangkok Tour
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardTargets;
