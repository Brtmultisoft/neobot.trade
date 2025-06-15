import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Tabs,
  Tab,
  Grid,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Place as MapPinIcon,
  Flight as PlaneIcon,
  AttachMoney as DollarSignIcon,
  People as UsersIcon
} from '@mui/icons-material';
import { safeUserRewardService } from '../../services/reward.service';

const RewardLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      const rewardTypes = ['', 'goa_tour', 'bangkok_tour'];
      const rewardType = rewardTypes[activeTab];
      const data = await safeUserRewardService.getLeaderboard(rewardType, 50);
      setLeaderboard(data.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
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
          🏆 Reward Leaderboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Celebrating our top achievers who qualified for exclusive Goa Tour and Bangkok Tour rewards
        </Typography>
      </Box>

      {/* Statistics Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
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
                {leaderboard.filter(entry => entry.rank === 1).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Champions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
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
                {leaderboard.filter(entry => entry.reward_type === 'goa_tour').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Goa Tours</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
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
                {leaderboard.filter(entry => entry.reward_type === 'bangkok_tour').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Bangkok Tours</Typography>
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
          <Tab label="🏆 All Rewards" />
          <Tab label="🏖️ Goa Tour" />
          <Tab label="✈️ Bangkok Tour" />
        </Tabs>
      </Box>

      {/* Leaderboard Content */}
      {leaderboard.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {leaderboard.map((entry, index) => (
            <Card key={`${entry._id}-${index}`} sx={{
              border: entry.rank <= 3 ? '2px solid #F0B90B' : '1px solid rgba(240, 185, 11, 0.2)',
              background: entry.rank <= 3
                ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.08) 0%, rgba(252, 213, 53, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(30, 35, 41, 0.5) 0%, rgba(43, 49, 57, 0.5) 100%)',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 32px rgba(240, 185, 11, 0.15)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Rank */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {entry.rank === 1 && <TrophyIcon sx={{ color: '#F0B90B', fontSize: 32 }} />}
                      {entry.rank === 2 && <TrophyIcon sx={{ color: '#C0C0C0', fontSize: 28 }} />}
                      {entry.rank === 3 && <TrophyIcon sx={{ color: '#CD7F32', fontSize: 24 }} />}
                      <Chip
                        label={`#${entry.rank}`}
                        sx={{
                          backgroundColor: entry.rank <= 3 ? '#F0B90B' : 'rgba(240, 185, 11, 0.2)',
                          color: entry.rank <= 3 ? '#000' : '#F0B90B',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>

                    {/* User Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {entry.reward_type === 'goa_tour' ?
                        <MapPinIcon sx={{ color: 'orange' }} /> :
                        <PlaneIcon sx={{ color: 'blue' }} />
                      }
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {entry.user?.username || entry.user?.email || 'Anonymous'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.reward_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qualified: {new Date(entry.qualification_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Achievement Details */}
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={entry.status}
                      color={entry.status === 'qualified' ? 'success' : entry.status === 'approved' ? 'primary' : 'default'}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DollarSignIcon sx={{ fontSize: 16, color: 'green' }} />
                        <Typography variant="caption">
                          Self: ${entry.self_invest_achieved?.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <UsersIcon sx={{ fontSize: 16, color: 'blue' }} />
                        <Typography variant="caption">
                          Direct: ${entry.direct_business_achieved?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Special highlighting for top 3 */}
                {entry.rank <= 3 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'warning.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="warning.dark" fontWeight="medium">
                      {entry.rank === 1 ? '🏆 Champion' :
                       entry.rank === 2 ? '🥈 Runner-up' :
                       '🥉 Third Place'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Alert severity="info">
          {activeTab === 0 ? 'No reward achievers yet. Be the first to qualify!' :
           activeTab === 1 ? 'No Goa Tour achievers yet. Target: $1,000 self + $1,500 direct business!' :
           'No Bangkok Tour achievers yet. Target: $5,000 self + $10,000 direct business!'}
        </Alert>
      )}

      {/* Motivation Footer */}
      <Card sx={{ mt: 4, background: 'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)', border: '1px solid #9c27b0' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <TrophyIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" color="secondary" sx={{ mb: 2 }}>
            Ready to Join the Leaderboard?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start building your investment and team to qualify for exclusive rewards!
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, border: 1, borderColor: 'secondary.light' }}>
                <MapPinIcon sx={{ fontSize: 32, color: 'orange', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold">Goa Tour</Typography>
                <Typography variant="body2" color="text.secondary">$1,000 self + $1,500 direct</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, border: 1, borderColor: 'secondary.light' }}>
                <PlaneIcon sx={{ fontSize: 32, color: 'blue', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold">Bangkok Tour</Typography>
                <Typography variant="body2" color="text.secondary">$5,000 self + $10,000 direct</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardLeaderboard;
