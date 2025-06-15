import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Person as PersonIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '../../components/PageHeader';
import RewardService from '../../services/reward.service';

const RewardDetails = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load reward details
  const loadRewardDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await RewardService.getRewardById(id);
      
      if (response?.success) {
        setReward(response.data);
      } else {
        throw new Error(response?.message || 'Failed to load reward details');
      }
    } catch (err) {
      console.error('Error loading reward details:', err);
      setError(err.message || 'Failed to load reward details');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (id) {
      loadRewardDetails();
    }
  }, [id]);

  // Handle reward action
  const handleRewardAction = async () => {
    if (!reward || !actionType) return;

    try {
      setActionLoading(true);
      let response;

      if (actionType === 'approve') {
        response = await RewardService.approveReward(reward._id, actionNotes);
      } else if (actionType === 'process') {
        response = await RewardService.processReward(reward._id, actionNotes);
      }

      if (response?.success) {
        setActionDialog(false);
        setActionNotes('');
        loadRewardDetails();
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

  // Get reward targets
  const rewardTargets = RewardService.getRewardTargets();

  // Render progress section
  const renderProgressSection = () => {
    if (!reward) return null;

    const qualification = RewardService.checkRewardQualification(reward);
    const selfProgress = qualification.selfInvestProgress;
    const businessProgress = qualification.directBusinessProgress;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon />
            Progress Tracking
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  Self Investment {qualification.selfInvestComplete && '✅'}
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={selfProgress}
                    size={120}
                    thickness={6}
                    sx={{
                      color: qualification.selfInvestComplete ? theme.palette.success.main : theme.palette.primary.main
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="h5" component="div" color="text.secondary">
                      {selfProgress.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {RewardService.formatCurrency(reward.self_invest_achieved)} / {RewardService.formatCurrency(reward.self_invest_target)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current: {RewardService.formatCurrency(reward.current_stats?.current_self_investment || 0)}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  Direct Business {qualification.directBusinessComplete && '✅'}
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={businessProgress}
                    size={120}
                    thickness={6}
                    sx={{
                      color: qualification.directBusinessComplete ? theme.palette.success.main : theme.palette.primary.main
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="h5" component="div" color="text.secondary">
                      {businessProgress.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {RewardService.formatCurrency(reward.direct_business_achieved)} / {RewardService.formatCurrency(reward.direct_business_target)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current: {RewardService.formatCurrency(reward.current_stats?.current_direct_business || 0)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Qualification Summary */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: qualification.isQualified ? '#e8f5e8' : '#fff3e0', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 1, color: qualification.isQualified ? 'success.main' : 'warning.main' }}>
              Qualification Status
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Logic:</strong> User qualifies if <strong>EITHER</strong> target is met (OR condition)
            </Typography>
            <Stack direction="row" spacing={2}>
              <Typography variant="body2" sx={{ color: qualification.selfInvestComplete ? 'success.main' : 'text.secondary' }}>
                {qualification.selfInvestComplete ? '✅' : '❌'} Self Investment: {selfProgress.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: qualification.directBusinessComplete ? 'success.main' : 'text.secondary' }}>
                {qualification.directBusinessComplete ? '✅' : '❌'} Direct Business: {businessProgress.toFixed(1)}%
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold', color: qualification.isQualified ? 'success.main' : 'warning.main' }}>
              {qualification.isQualified ? '🎉 QUALIFIED FOR REWARD!' : '⚠️ Not yet qualified - need either target to be met'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !reward) {
    return (
      <Box>
        <PageHeader
          title="Reward Details"
          subtitle="View detailed reward information"
          icon={<EmojiEventsIcon />}
        />
        <Alert severity="error" sx={{ mt: 3 }}>
          {error || 'Reward not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/rewards')}
          sx={{ mt: 2 }}
        >
          Back to Rewards
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Reward Details"
        subtitle={`${reward.reward_name} - ${reward.user_id?.username || 'Unknown User'}`}
        icon={<EmojiEventsIcon />}
      />

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/rewards')}
        sx={{ mb: 3 }}
      >
        Back to Rewards
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* User Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            User Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                  {reward.user_id?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {reward.user_id?.username || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {reward.user_id?.email || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Total Investment:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {RewardService.formatCurrency(reward.user_id?.total_investment || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Direct Referrals:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {reward.current_stats?.direct_referrals_count || 0}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reward Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon />
            Reward Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Reward Name</Typography>
                  <Typography variant="h6">{reward.reward_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Reward Type</Typography>
                  <Chip
                    label={reward.reward_type?.replace('_', ' ').toUpperCase()}
                    sx={{
                      backgroundColor: `${rewardTargets[reward.reward_type]?.color || '#757575'}20`,
                      color: rewardTargets[reward.reward_type]?.color || '#757575'
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={RewardService.getStatusLabel(reward.status)}
                    sx={{
                      backgroundColor: `${RewardService.getStatusColor(reward.status)}20`,
                      color: RewardService.getStatusColor(reward.status)
                    }}
                  />
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Reward Value</Typography>
                  <Typography variant="body1" fontWeight="medium">{reward.reward_value}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Qualification Date</Typography>
                  <Typography variant="body1">{RewardService.formatDate(reward.qualification_date)}</Typography>
                </Box>
                {reward.processed_at && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">Processed Date</Typography>
                    <Typography variant="body1">{RewardService.formatDate(reward.processed_at)}</Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>

          {reward.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary">Notes</Typography>
              <Typography variant="body1">{reward.notes}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      {renderProgressSection()}

      {/* Action Buttons */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
          <Stack direction="row" spacing={2}>
            {reward.status === 'qualified' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  setActionType('approve');
                  setActionDialog(true);
                }}
              >
                Approve Reward
              </Button>
            )}
            {reward.status === 'approved' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  setActionType('process');
                  setActionDialog(true);
                }}
              >
                Process Reward
              </Button>
            )}
            {reward.status === 'completed' && (
              <Chip
                label="Reward Completed"
                color="success"
                variant="outlined"
                size="large"
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Reward' : 'Process Reward'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {actionType === 'approve' 
              ? 'Are you sure you want to approve this reward? This action will mark the reward as approved.'
              : 'Are you sure you want to process this reward? This action will mark the reward as completed.'
            }
          </Typography>
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
            color={actionType === 'approve' ? 'success' : 'primary'}
          >
            {actionLoading ? <CircularProgress size={20} /> : `${actionType === 'approve' ? 'Approve' : 'Process'} Reward`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RewardDetails;
