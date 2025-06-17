import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Stack
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import RewardService from '../../services/reward.service';

const RewardsList = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load rewards data
  const loadRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading rewards...');
      const response = await RewardService.getAllRewards({ limit: 50 });
      console.log('Rewards response:', response);

      if (response === null || response === undefined) {
        console.warn('API returned null/undefined response');
        setRewards([]);
        return;
      }

      if (response?.success) {
        const rewardsData = Array.isArray(response.data) ? response.data : [];
        setRewards(rewardsData);
        console.log('Rewards loaded successfully:', rewardsData.length, 'rewards');
      } else {
        console.error('API returned error:', response);
        setError(response?.message || 'Failed to load rewards');
      }
    } catch (err) {
      console.error('Error loading rewards:', err);
      setError(err.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  // Seed sample rewards for testing
  const handleSeedRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('admin_token');
      console.log('Seeding rewards with token:', token ? 'Present' : 'Missing');

      const response = await fetch('/api/admin/rewards/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Seed response status:', response.status);
      console.log('Seed response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      console.log('Seed result:', result);

      if (result?.success) {
        await loadRewards(); // Reload rewards after seeding
        setError(null);
        console.log('Rewards seeded successfully:', result.message);
      } else {
        throw new Error(result?.message || 'Failed to seed rewards');
      }
    } catch (err) {
      console.error('Error seeding rewards:', err);
      setError(err.message || 'Failed to seed rewards');
    } finally {
      setLoading(false);
    }
  };

  // Test server connectivity
  const testServerConnection = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/health', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Server health check:', result);
        setError(null);
        return true;
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (err) {
      console.error('Server connection test failed:', err);
      setError(`Server connection failed: ${err.message}`);
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    loadRewards();
  }, []);

  // Get reward targets
  const rewardTargets = RewardService.getRewardTargets();

  if (loading && rewards.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Rewards Management"
        subtitle="View and manage user rewards"
        icon={<EmojiEventsIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadRewards}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              onClick={testServerConnection}
              disabled={loading}
              size="small"
            >
              Test Connection
            </Button>
            {rewards.length === 0 && (
              <Button
                variant="contained"
                onClick={handleSeedRewards}
                disabled={loading}
              >
                Seed Test Rewards
              </Button>
            )}
            <Typography variant="body2" color="textSecondary">
              Total Rewards: {rewards.length}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Rewards Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Rewards List
          </Typography>
          
          {loading && <CircularProgress sx={{ mb: 2 }} />}
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Reward</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Self Investment</TableCell>
                  <TableCell>Direct Business</TableCell>
                  <TableCell>Qualified Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rewards.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                        No Rewards Found
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        There are no rewards in the system yet. You can seed some test data to get started.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleSeedRewards}
                        disabled={loading}
                      >
                        Seed Test Rewards
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  rewards.map((reward) => (
                    <TableRow key={reward._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {reward.user_id?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {reward.user_id?.username || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {reward.user_id?.email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {reward.reward_name}
                          </Typography>
                          <Chip
                            label={reward.reward_type?.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: `${rewardTargets[reward.reward_type]?.color || '#757575'}20`,
                              color: rewardTargets[reward.reward_type]?.color || '#757575'
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={RewardService.getStatusLabel(reward.status)}
                          size="small"
                          sx={{
                            backgroundColor: `${RewardService.getStatusColor(reward.status)}20`,
                            color: RewardService.getStatusColor(reward.status)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {RewardService.formatCurrency(reward.self_invest_achieved)} / {RewardService.formatCurrency(reward.self_invest_target)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {RewardService.calculateProgress(reward.self_invest_achieved, reward.self_invest_target).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {RewardService.formatCurrency(reward.direct_business_achieved)} / {RewardService.formatCurrency(reward.direct_business_target)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {RewardService.calculateProgress(reward.direct_business_achieved, reward.direct_business_target).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {RewardService.formatDate(reward.qualification_date)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardsList;
