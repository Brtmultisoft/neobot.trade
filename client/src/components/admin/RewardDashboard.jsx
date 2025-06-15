import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  People as UsersIcon,
  AttachMoney as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Place as MapPinIcon,
  Flight as PlaneIcon
} from '@mui/icons-material';
import { safeAdminRewardService, rewardUtils } from '../../services/reward.service';

const RewardDashboard = () => {
  const [rewards, setRewards] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchRewardData();
    fetchStatistics();
  }, []);

  const fetchRewardData = async () => {
    try {
      const data = await safeAdminRewardService.getAllRewards();
      setRewards(data.data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await safeAdminRewardService.getStatistics();
      setStatistics(data.data || {});
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics({});
    }
  };

  const approveReward = async (rewardId) => {
    try {
      await safeAdminRewardService.approveReward(rewardId, 'Approved by admin');
      fetchRewardData(); // Refresh data
      alert('Reward approved successfully!');
    } catch (error) {
      console.error('Error approving reward:', error);
      alert('Failed to approve reward. Please try again.');
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
          Reward Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Manage and approve Goa Tour and Bangkok Tour reward qualifications for your users
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.08) 0%, rgba(252, 213, 53, 0.08) 100%)',
            border: '2px solid rgba(240, 185, 11, 0.3)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(240, 185, 11, 0.2)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrophyIcon sx={{ fontSize: 40, color: '#F0B90B', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#F0B90B' }}>
                {rewards.filter(r => r.status === 'qualified').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Qualified
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(14, 203, 129, 0.08) 0%, rgba(63, 225, 160, 0.08) 100%)',
            border: '2px solid rgba(14, 203, 129, 0.3)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(14, 203, 129, 0.2)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#0ECB81', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#0ECB81' }}>
                {rewards.filter(r => r.status === 'approved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(240, 185, 11, 0.08) 100%)',
            border: '2px solid rgba(255, 152, 0, 0.3)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(255, 152, 0, 0.2)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MapPinIcon sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#FF9800' }}>
                {rewards.filter(r => r.reward_type === 'goa_tour').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Goa Tours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(240, 185, 11, 0.08) 100%)',
            border: '2px solid rgba(33, 150, 243, 0.3)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(33, 150, 243, 0.2)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PlaneIcon sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#2196F3' }}>
                {rewards.filter(r => r.reward_type === 'bangkok_tour').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bangkok Tours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
          <Tab label="✅ Eligible Users" />
          <Tab label="🎁 All Rewards" />
          <Tab label="📊 Statistics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Eligible Users ({rewards.filter(r => r.status === 'qualified').length})
            </Typography>
            {rewards.filter(r => r.status === 'qualified').length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rewards.filter(r => r.status === 'qualified').map((reward) => (
                  <Paper key={reward._id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {reward.reward_type === 'goa_tour' ?
                          <MapPinIcon sx={{ color: 'orange' }} /> :
                          <PlaneIcon sx={{ color: 'blue' }} />
                        }
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {reward.user_id?.username || reward.user_id?.email || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reward.reward_name} - Qualified: {new Date(reward.qualification_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label="Qualified" color="success" size="small" />
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => approveReward(reward._id)}
                        >
                          Approve
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No users currently eligible for rewards
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              All Rewards ({rewards.length})
            </Typography>
            {rewards.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rewards.map((reward) => (
                  <Paper key={reward._id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {reward.reward_type === 'goa_tour' ?
                          <MapPinIcon sx={{ color: 'orange' }} /> :
                          <PlaneIcon sx={{ color: 'blue' }} />
                        }
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {reward.user_id?.username || reward.user_id?.email || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reward.reward_name} - Qualified: {new Date(reward.qualification_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={reward.status}
                        color={reward.status === 'qualified' ? 'warning' : reward.status === 'approved' ? 'primary' : 'success'}
                        size="small"
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No rewards found
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Reward Statistics</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Goa Tour Progress
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Qualified</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {rewards.filter(r => r.reward_type === 'goa_tour' && r.status === 'qualified').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Approved</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {rewards.filter(r => r.reward_type === 'goa_tour' && r.status === 'approved').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Completed</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {rewards.filter(r => r.reward_type === 'goa_tour' && r.status === 'completed').length}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Bangkok Tour Progress
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Qualified</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {rewards.filter(r => r.reward_type === 'bangkok_tour' && r.status === 'qualified').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Approved</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {rewards.filter(r => r.reward_type === 'bangkok_tour' && r.status === 'approved').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Completed</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {rewards.filter(r => r.reward_type === 'bangkok_tour' && r.status === 'completed').length}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RewardDashboard;
