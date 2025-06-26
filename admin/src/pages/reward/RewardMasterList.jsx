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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import RewardMasterService from '../../services/rewardMaster.service';
import PageHeader from '../../components/PageHeader';
import RewardService from '../../services/reward.service';
import { Link, useLocation } from 'react-router-dom';

const defaultForm = {
  reward_name: '',
  reward_value: '',
  self_invest_target: '',
  direct_business_target: '',
  description: '',
  active: true,
  extra: {}
};

const RewardMasterList = () => {
  const [rewardMasters, setRewardMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedRewardType, setSelectedRewardType] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [rewardedUsers, setRewardedUsers] = useState([]);
  const [rewardTypes, setRewardTypes] = useState([]);

  const location = useLocation();

  const loadRewardMasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await RewardMasterService.getAll();
      if (res?.status && Array.isArray(res.result)) {
        setRewardMasters(res.result);
      } else {
        setError(res?.message || 'Failed to load reward masters');
      }
    } catch (err) {
      setError(err.message || 'Failed to load reward masters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardMasters();
  }, []);

  useEffect(() => {
    // Fetch reward types from the reward master list or API
    async function fetchRewardTypes() {
      const res = await RewardService.getAllRewards();
      if (res && res.data) {
        const types = Array.from(new Set(res.data.map(r => r.reward_type)));
        setRewardTypes(types);
        if (types.length > 0 && !selectedRewardType) setSelectedRewardType(types[0]);
      }
    }
    fetchRewardTypes();
  }, []);

  useEffect(() => {
    if (!selectedRewardType) return;
    async function fetchUsers() {
      const eligible = await RewardService.getEligibleUsersForReward(selectedRewardType);
      setEligibleUsers(eligible?.data || []);
      const rewarded = await RewardService.getRewardedUsersForReward(selectedRewardType);
      setRewardedUsers(rewarded?.data || []);
    }
    fetchUsers();
  }, [selectedRewardType]);

  const handleOpenDialog = (rewardMaster = defaultForm) => {
    setForm({ ...defaultForm, ...rewardMaster });
    setEditId(rewardMaster._id || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setForm(defaultForm);
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        // Update
        await RewardMasterService.update(editId, form);
      } else {
        // Create
        await RewardMasterService.create(form);
      }
      await loadRewardMasters();
      handleCloseDialog();
    } catch (err) {
      setError(err.message || 'Failed to save reward master');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reward master?')) return;
    setSaving(true);
    setError(null);
    try {
      await RewardMasterService.delete(id);
      await loadRewardMasters();
    } catch (err) {
      setError(err.message || 'Failed to delete reward master');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <nav style={{ marginBottom: 24 }}>
        <Link to="/reward-master-list" style={{ marginRight: 16, fontWeight: location.pathname === '/reward-master-list' ? 'bold' : 'normal' }}>Reward Master List</Link>
        <Link to="/reward-eligible-users" style={{ marginRight: 16, fontWeight: location.pathname === '/reward-eligible-users' ? 'bold' : 'normal' }}>Eligible Users</Link>
        <Link to="/reward-all-data" style={{ fontWeight: location.pathname === '/reward-all-data' ? 'bold' : 'normal' }}>All Rewards Data</Link>
      </nav>
      <Box>
        <PageHeader
          title="Reward Master Management"
          subtitle="View and manage all reward master data"
          icon={<Add />}
        />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                disabled={saving}
              >
                Add Reward Master
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadRewardMasters}
                disabled={loading || saving}
              >
                Refresh
              </Button>
              <Typography variant="body2" color="textSecondary">
                Total: {rewardMasters.length}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Reward Master List
            </Typography>
            {loading ? (
              <CircularProgress sx={{ mb: 2 }} />
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Self Invest Target</TableCell>
                      <TableCell>Direct Business Target</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rewardMasters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No Reward Masters Found
                        </TableCell>
                      </TableRow>
                    ) : (
                      rewardMasters.map((rm) => (
                        <TableRow key={rm._id} hover>
                          <TableCell>{rm.reward_name}</TableCell>
                          <TableCell>{rm.reward_value}</TableCell>
                          <TableCell>{rm.self_invest_target}</TableCell>
                          <TableCell>{rm.direct_business_target}</TableCell>
                          <TableCell>{rm.description}</TableCell>
                          <TableCell>{rm.active ? 'Yes' : 'No'}</TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleOpenDialog(rm)} size="small"><Edit /></IconButton>
                            <IconButton onClick={() => handleDelete(rm._id)} size="small"><Delete /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? 'Edit Reward Master' : 'Add Reward Master'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Reward Name"
                name="reward_name"
                value={form.reward_name}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Reward Value"
                name="reward_value"
                value={form.reward_value}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Self Invest Target"
                name="self_invest_target"
                value={form.self_invest_target}
                onChange={handleChange}
                type="number"
                fullWidth
                required
              />
              <TextField
                label="Direct Business Target"
                name="direct_business_target"
                value={form.direct_business_target}
                onChange={handleChange}
                type="number"
                fullWidth
                required
              />
              <TextField
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />
              <FormControlLabel
                control={<Switch checked={form.active} onChange={handleChange} name="active" />}
                label="Active"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={20} /> : (editId ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
};

export default RewardMasterList; 