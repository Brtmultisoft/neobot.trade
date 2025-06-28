import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RewardService from '../../services/reward.service';

const RewardApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await RewardService.getAllRewards();
      setApplications((res && res.data) || []);
    } catch (err) {
      console.log(err);
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await RewardService.approveReward(id);
      setApplications(applications =>
        applications.map(app =>
          app._id === id ? { ...app, status: 'approved' } : app
        )
      );
    } catch (err) {
      console.log(err);
      setError('Failed to approve');
    }
  };

  const handleReject = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    try {
      await RewardService.rejectReward(rejectingId, rejectReason);
      setApplications(applications =>
        applications.map(app =>
          app._id === rejectingId
            ? { ...app, status: 'rejected', notes: rejectReason }
            : app
        )
      );
      setRejectDialogOpen(false);
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      console.log(err);
      setError('Failed to reject');
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectReason('');
  };

  // Helper to copy user ID
  const handleCopyUserId = (userId) => {
    navigator.clipboard.writeText(userId);
    setCopySuccess(true);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>All Reward Applications</Typography>
      <Grid container spacing={3}>
        {applications.map(app => (
          <Grid item xs={12} md={6} key={app._id}>
            <Card
              sx={{
                mb: 3,
                borderRadius: 3,
                boxShadow: 3,
                borderLeft: 6,
                borderLeftStyle: 'solid',
                borderLeftColor:
                  app.status === 'approved'
                    ? 'success.main'
                    : app.status === 'rejected'
                    ? 'error.main'
                    : app.status === 'qualified'
                    ? 'warning.main'
                    : 'grey.400',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 8 }
              }}
            >
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                  {app.reward_name}
                </Typography>
                <Box sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>User Info</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      User ID: <Box component="span" sx={{ fontSize: 12, ml: 0.5, fontFamily: 'monospace' }}>{app.user?._id || '-'}</Box>
                      {app.user?._id && (
                        <Tooltip title="Copy User ID">
                          <IconButton size="small" onClick={() => handleCopyUserId(app.user._id)} sx={{ ml: 0.5 }}>
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Typography>
                    <Typography variant="body2">Name: <b>{app.user?.name || '-'}</b></Typography>
                    <Typography variant="body2">Email: <b>{app.user?.email || '-'}</b></Typography>
                    <Typography variant="body2">Phone: <b>{app.user?.phone_number || '-'}</b></Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Investment Info</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="body2">Total Investment: <b>{app.user?.total_investment ?? '-'}</b></Typography>
                    <Typography variant="body2">Self Invested: <b>{app.user?.total_self_invested ?? '-'}</b></Typography>
                    <Typography variant="body2">Direct Business: <b>{app.user?.total_direct_business ?? '-'}</b></Typography>
                    <Typography variant="body2">Direct Referrals: <b>{app.user?.direct_referrals_count ?? '-'}</b></Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" component="span">Status:</Typography>
                  <Chip label={app.status} color={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'error' : app.status === 'qualified' ? 'warning' : 'default'} />
                </Box>
                {app.status === 'rejected' && app.notes && (
                  <Typography variant="body2" color="error">Rejection Reason: {app.notes}</Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  {app.status === 'qualified' && (
                    <Button variant="contained" color="success" onClick={() => handleApprove(app._id)}>Approve</Button>
                  )}
                  {app.status === 'qualified' && (
                    <Button variant="outlined" color="error" onClick={() => handleReject(app._id)}>Reject</Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel}>
        <DialogTitle>Reject Reward Application</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for rejection"
            type="text"
            fullWidth
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel}>Cancel</Button>
          <Button onClick={handleRejectConfirm} color="error" disabled={!rejectReason.trim()}>Reject</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={copySuccess}
        autoHideDuration={1500}
        onClose={() => setCopySuccess(false)}
        message="User ID copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

// Patch RewardService.rejectReward to accept reason
if (!RewardService._originalRejectReward) {
  RewardService._originalRejectReward = RewardService.rejectReward;
}
RewardService.rejectReward = async (id, notes = '') => {
  return RewardService._originalRejectReward
    ? RewardService._originalRejectReward(id, notes)
    : RewardService.request({
        method: 'POST',
        endpoint: `/admin/rewards/${id}/reject`,
        data: { notes },
        token: localStorage.getItem('admin_token'),
        useCache: false
      });
};

export default RewardApplications; 