import React, { useState, useEffect } from 'react';
import RewardService from '../../services/reward.service';
import {
  Card, CardContent, Typography, Box, Table, TableHead, TableBody, TableRow, TableCell, Select, MenuItem, LinearProgress, FormControl, InputLabel, Chip
} from '@mui/material';

const RewardEligibleUsers = () => {
  const [rewardTypes, setRewardTypes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userRewards, setUserRewards] = useState([]);

  useEffect(() => {
    async function fetchRewardTypes() {
      const res = await RewardService.getAllRewards();
      if (res && res.data) {
        const types = Array.from(new Set(res.data.map(r => r.reward_type)));
        setRewardTypes(types);
      }
    }
    fetchRewardTypes();
  }, []);

  useEffect(() => {
    async function fetchAllUsersWithRewards() {
      // Fetch all users who have any reward record (qualified, approved, completed, etc.)
      // We'll use getAllRewards with no filters to get all reward records, then group by user
      const res = await RewardService.getAllRewards();
      if (res && res.data) {
        setUserRewards(res.data);
        // Build a unique user list
        const users = [];
        const seen = new Set();
        res.data.forEach(r => {
          if (r.user_id && !seen.has(r.user_id._id)) {
            users.push(r.user_id);
            seen.add(r.user_id._id);
          }
        });
        setAllUsers(users);
      }
    }
    fetchAllUsersWithRewards();
  }, []);

  // Helper to get a user's reward record for a given type
  const getUserReward = (userId, rewardType) =>
    userRewards.find(r => r.user_id?._id === userId && r.reward_type === rewardType);

  return (
    <Box p={3}>
      <Card sx={{ maxWidth: 1400, margin: '0 auto', mb: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            All Users & Reward Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Total Users: <b>{allUsers.length}</b>
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Reward Type</TableCell>
                <TableCell>Self Invest</TableCell>
                <TableCell>Direct Business</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Qualification Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allUsers.map(user => (
                rewardTypes.map(type => {
                  const reward = getUserReward(user._id, type);
                  const selfProgress = reward ? Math.min((reward.self_invest_achieved / reward.self_invest_target) * 100, 100) : 0;
                  const directProgress = reward ? Math.min((reward.direct_business_achieved / reward.direct_business_target) * 100, 100) : 0;
                  const isQualified = reward && reward.status === 'qualified';
                  return (
                    <TableRow key={user._id + '-' + type}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{type}</TableCell>
                      <TableCell>
                        <Box minWidth={120}>
                          <LinearProgress
                            variant="determinate"
                            value={selfProgress}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              mb: 0.5,
                              backgroundColor: '#e3f2fd',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: selfProgress >= 100 ? '#43e97b' : '#2196f3',
                              },
                            }}
                          />
                          <Typography variant="caption">
                            {reward ? `${reward.self_invest_achieved} / ${reward.self_invest_target}` : '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box minWidth={120}>
                          <LinearProgress
                            variant="determinate"
                            value={directProgress}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              mb: 0.5,
                              backgroundColor: '#e3f2fd',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: directProgress >= 100 ? '#43e97b' : '#2196f3',
                              },
                            }}
                          />
                          <Typography variant="caption">
                            {reward ? `${reward.direct_business_achieved} / ${reward.direct_business_target}` : '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {isQualified ? (
                          <Chip label="Eligible" color="success" size="small" />
                        ) : (
                          <Chip label="In Progress" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{reward && reward.qualification_date ? new Date(reward.qualification_date).toLocaleDateString() : ''}</TableCell>
                    </TableRow>
                  );
                })
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardEligibleUsers; 