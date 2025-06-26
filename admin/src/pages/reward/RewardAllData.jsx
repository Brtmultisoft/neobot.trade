import React, { useState, useEffect } from 'react';
import RewardService from '../../services/reward.service';
import {
  Card, CardContent, Typography, Box, Table, TableHead, TableBody, TableRow, TableCell, Select, MenuItem, LinearProgress, FormControl, InputLabel
} from '@mui/material';

const RewardAllData = () => {
  const [rewardTypes, setRewardTypes] = useState([]);
  const [selectedRewardType, setSelectedRewardType] = useState('');
  const [rewardedUsers, setRewardedUsers] = useState([]);

  useEffect(() => {
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
      const rewarded = await RewardService.getRewardedUsersForReward(selectedRewardType);
      setRewardedUsers(rewarded?.data || []);
    }
    fetchUsers();
  }, [selectedRewardType]);

  return (
    <Box p={3}>
      <Card sx={{ maxWidth: 1200, margin: '0 auto', mb: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            All Rewards Data
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="reward-type-label">Reward Type</InputLabel>
              <Select
                labelId="reward-type-label"
                value={selectedRewardType}
                label="Reward Type"
                onChange={e => setSelectedRewardType(e.target.value)}
              >
                {rewardTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Total Rewarded Users: <b>{rewardedUsers.length}</b>
            </Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Self Invest</TableCell>
                <TableCell>Direct Business</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Qualification Date</TableCell>
                <TableCell>Approval/Completion Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rewardedUsers.map(u => (
                <TableRow key={u._id}>
                  <TableCell>{u.user_id?.username}</TableCell>
                  <TableCell>{u.user_id?.email}</TableCell>
                  <TableCell>
                    <Box minWidth={120}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((u.self_invest_achieved / u.self_invest_target) * 100, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          mb: 0.5,
                          backgroundColor: '#e3f2fd',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              (u.self_invest_achieved / u.self_invest_target) >= 1 ? '#43e97b' : '#2196f3',
                          },
                        }}
                      />
                      <Typography variant="caption">
                        {u.self_invest_achieved} / {u.self_invest_target}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={120}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((u.direct_business_achieved / u.direct_business_target) * 100, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          mb: 0.5,
                          backgroundColor: '#e3f2fd',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              (u.direct_business_achieved / u.direct_business_target) >= 1 ? '#43e97b' : '#2196f3',
                          },
                        }}
                      />
                      <Typography variant="caption">
                        {u.direct_business_achieved} / {u.direct_business_target}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>{u.qualification_date ? new Date(u.qualification_date).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{u.processed_at ? new Date(u.processed_at).toLocaleDateString() : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardAllData; 