import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import RewardService from '../../services/reward.service';

const RewardApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

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
      fetchApplications();
    } catch (err) {
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
      setRejectDialogOpen(false);
      setRejectingId(null);
      setRejectReason('');
      fetchApplications();
    } catch (err) {
      setError('Failed to reject');
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectReason('');
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>All Reward Applications</Typography>
      <Grid container spacing={3}>
        {applications.map(app => (
          <Grid item xs={12} md={6} key={app._id}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{app.reward_name}</Typography>
                <Typography variant="body2">User: {app.user?.username || '-'}</Typography>
                <Typography variant="body2">Name: {app.user?.name || '-'}</Typography>
                <Typography variant="body2">Email: {app.user?.email || '-'}</Typography>
                <Typography variant="body2">Phone: {app.user?.phone_number || '-'}</Typography>
                <Typography variant="body2">Total Investment: {app.user?.total_investment ?? '-'}</Typography>
                <Typography variant="body2">Self Invested: {app.user?.total_self_invested ?? '-'}</Typography>
                <Typography variant="body2">Direct Business: {app.user?.total_direct_business ?? '-'}</Typography>
                <Typography variant="body2">Direct Referrals: {app.user?.direct_referrals_count ?? '-'}</Typography>
                <Typography variant="body2">Status: <Chip label={app.status} color={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'error' : app.status === 'qualified' ? 'warning' : 'default'} /></Typography>
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
    </Box>
  );
};

// Patch RewardService.rejectReward to accept reason
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
if (!RewardService._originalRejectReward) {
  RewardService._originalRejectReward = RewardService.rejectReward;
}

export default RewardApplications; 