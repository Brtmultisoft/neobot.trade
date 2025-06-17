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
  LinearProgress,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Stack
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '../../components/PageHeader';
import RewardService from '../../services/reward.service';

const RewardTracking = () => {
  const theme = useTheme();
  const [rewards, setRewards] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRewards, setTotalRewards] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    reward_type: '',
    limit: 20
  });

  // Dialog states
  const [selectedReward, setSelectedReward] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load rewards data
  const loadRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: filters.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.reward_type && { reward_type: filters.reward_type })
      };

      console.log('Loading rewards with params:', params);
      const response = await RewardService.getAllRewards(params);
      console.log('Rewards API response:', response);

      // Handle null/undefined response (cancelled request or no data)
      if (response === null || response === undefined) {
        console.warn('API returned null/undefined response (possibly cancelled), setting empty rewards');
        setRewards([]);
        setTotalPages(1);
        setTotalRewards(0);
        return; // Don't throw error for cancelled requests
      }

      if (response?.success) {
        const rewardsData = Array.isArray(response.data) ? response.data : [];
        setRewards(rewardsData);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRewards(response.pagination?.totalRewards || 0);
        console.log('Rewards loaded successfully:', rewardsData.length, 'rewards');
      } else {
        console.error('API returned error:', response);
        throw new Error(response?.message || 'Failed to load rewards');
      }
    } catch (err) {
      console.error('Error loading rewards:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError(err.detailedMessage || err.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      console.log('Loading reward statistics...');
      const response = await RewardService.getRewardStatistics();
      console.log('Statistics API response:', response);

      // Handle null/undefined response (cancelled request)
      if (response === null || response === undefined) {
        console.warn('Statistics API returned null/undefined response (possibly cancelled)');
        return; // Don't set error for cancelled requests
      }

      if (response?.success) {
        setStatistics(response.data);
        console.log('Statistics loaded successfully');
      } else {
        console.error('Statistics API returned error:', response);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
      console.error('Statistics error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
    }
  };

  // Initial load
  useEffect(() => {
    loadRewards();
    loadStatistics();
  }, [page, filters]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  // Handle reward action
  const handleRewardAction = async () => {
    if (!selectedReward || !actionType) return;

    try {
      setActionLoading(true);
      let response;

      if (actionType === 'approve') {
        response = await RewardService.approveReward(selectedReward._id, actionNotes);
      } else if (actionType === 'process') {
        response = await RewardService.processReward(selectedReward._id, actionNotes);
      }

      if (response?.success) {
        setActionDialog(false);
        setActionNotes('');
        loadRewards();
        loadStatistics();
      } else {
        throw new Error(response?.message || 'Action failed');
      }
    } catch (err) {
      console.error('Error performing action:', err);
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvContent = RewardService.exportToCSV(rewards);
    RewardService.downloadCSV(csvContent, `rewards_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Trigger reward processing
  const handleTriggerProcessing = async () => {
    try {
      setLoading(true);
      const response = await RewardService.triggerRewardProcessing();
      if (response?.success) {
        loadRewards();
        loadStatistics();
      }
    } catch (err) {
      console.error('Error triggering processing:', err);
      setError(err.message || 'Failed to trigger processing');
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
        await loadRewards();
        await loadStatistics();
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

  // Get reward targets
  const rewardTargets = RewardService.getRewardTargets();

  // Render progress bar with OR logic indication
  const renderProgressBar = (achieved, target, label, isQualifyingTarget = false) => {
    const progress = RewardService.calculateProgress(achieved, target);
    const isComplete = progress >= 100;

    return (
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="textSecondary">
            {label} {isQualifyingTarget && '✅'}
          </Typography>
          <Typography variant="caption" color={isComplete ? 'success.main' : 'textSecondary'}>
            {RewardService.formatCurrency(achieved)} / {RewardService.formatCurrency(target)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: isComplete ? theme.palette.success.main :
                             isQualifyingTarget ? theme.palette.warning.main :
                             theme.palette.primary.main,
              borderRadius: 3
            }
          }}
        />
        <Typography variant="caption" color={isComplete ? 'success.main' : 'textSecondary'}>
          {progress.toFixed(1)}% Complete {isComplete && '(Qualified!)'}
        </Typography>
      </Box>
    );
  };

  // Check if reward qualifies with OR logic
  const checkRewardQualification = (reward) => {
    const selfInvestComplete = reward.self_invest_achieved >= reward.self_invest_target;
    const directBusinessComplete = reward.direct_business_achieved >= reward.direct_business_target;

    return {
      selfInvestComplete,
      directBusinessComplete,
      isQualified: selfInvestComplete || directBusinessComplete
    };
  };

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
        title="Reward Tracking System"
        subtitle="Monitor and manage user reward progress"
        icon={<EmojiEventsIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statistics.rewardStats?.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {rewardTargets[stat._id]?.name || stat._id}
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1 }}>
                    {stat.total}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {stat.statuses?.map((status) => (
                      <Chip
                        key={status.status}
                        label={`${RewardService.getStatusLabel(status.status)}: ${status.count}`}
                        size="small"
                        sx={{
                          backgroundColor: `${RewardService.getStatusColor(status.status)}20`,
                          color: RewardService.getStatusColor(status.status)
                        }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="processed">Processed</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Reward Type"
                value={filters.reward_type}
                onChange={(e) => handleFilterChange('reward_type', e.target.value)}
                size="small"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="goa_tour">Goa Tour</MenuItem>
                <MenuItem value="bangkok_tour">Bangkok Tour</MenuItem>
                <MenuItem value="coupon_code">Coupon Code</MenuItem>
                <MenuItem value="car_reward">Car Reward</MenuItem>
                <MenuItem value="bike_reward">Book Your Bike</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Per Page"
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                size="small"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Refresh Data">
                  <span>
                    <IconButton onClick={loadRewards} disabled={loading}>
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Export CSV">
                  <span>
                    <IconButton onClick={handleExport} disabled={rewards.length === 0}>
                      <DownloadIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Trigger Processing">
                  <span>
                    <IconButton onClick={handleTriggerProcessing} disabled={loading}>
                      <PlayArrowIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                {totalRewards === 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSeedRewards}
                    disabled={loading}
                    sx={{ ml: 1 }}
                  >
                    Seed Test Data
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Rewards Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Rewards ({totalRewards})
          </Typography>
          
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Reward</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Qualified Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
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
                          {reward.user_id?.username?.charAt(0)?.toUpperCase() ||
                           (typeof reward.user_id === 'string' ? reward.user_id.slice(-4) : 'U')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {reward.user_id?.username || `User ${typeof reward.user_id === 'string' ? reward.user_id.slice(-4) : 'Unknown'}`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {reward.user_id?.email || 'No email available'}
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
                      <Box sx={{ minWidth: 200 }}>
                        {(() => {
                          const qualification = checkRewardQualification(reward);
                          return (
                            <>
                              {renderProgressBar(
                                reward.self_invest_achieved,
                                reward.self_invest_target,
                                'Self Investment',
                                qualification.selfInvestComplete
                              )}
                              {renderProgressBar(
                                reward.direct_business_achieved,
                                reward.direct_business_target,
                                'Direct Business',
                                qualification.directBusinessComplete
                              )}
                              <Typography variant="caption" sx={{
                                color: qualification.isQualified ? 'success.main' : 'warning.main',
                                fontWeight: 'bold',
                                fontSize: '0.7rem'
                              }}>
                                {qualification.isQualified ?
                                  '✅ Qualified (Either target met)' :
                                  '⚠️ Need either target to qualify'
                                }
                              </Typography>
                            </>
                          );
                        })()}
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
                        {RewardService.formatDate(reward.qualification_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedReward(reward);
                              setDetailsDialog(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {reward.status === 'qualified' && (
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedReward(reward);
                                setActionType('approve');
                                setActionDialog(true);
                              }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {reward.status === 'approved' && (
                          <Tooltip title="Process">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedReward(reward);
                                setActionType('process');
                                setActionDialog(true);
                              }}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Typography sx={{ px: 2, py: 1 }}>
                  Page {page} of {totalPages}
                </Typography>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Reward' : 'Process Reward'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRewardAction}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RewardTracking;
