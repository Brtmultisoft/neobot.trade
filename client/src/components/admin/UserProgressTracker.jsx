import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  LinearProgress,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  People as UsersIcon,
  AttachMoney as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  Place as MapPinIcon,
  Flight as PlaneIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as EyeIcon
} from '@mui/icons-material';
import { safeAdminRewardService } from '../../services/reward.service';

const UserProgressTracker = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUserProgress();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const fetchUserProgress = async () => {
    try {
      const data = await safeAdminRewardService.getUsersProgress();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };



  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterStatus) {
          case 'qualified':
            return user.qualified_rewards?.length > 0;
          case 'goa_qualified':
            return user.qualified_rewards?.includes('goa_tour');
          case 'bangkok_qualified':
            return user.qualified_rewards?.includes('bangkok_tour');
          case 'no_rewards':
            return !user.qualified_rewards?.length;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const getStatusChip = (user) => {
    if (user.qualified_rewards?.includes('bangkok_tour')) {
      return <Chip label="Bangkok Qualified" color="primary" size="small" />;
    }
    if (user.qualified_rewards?.includes('goa_tour')) {
      return <Chip label="Goa Qualified" color="warning" size="small" />;
    }
    return <Chip label="In Progress" color="default" size="small" />;
  };

  const exportData = () => {
    const csvContent = [
      ['Username', 'Email', 'Self Investment', 'Direct Business', 'Direct Referrals', 'Goa Progress', 'Bangkok Progress', 'Qualified Rewards'],
      ...filteredUsers.map(user => [
        user.username,
        user.email,
        user.total_investment,
        user.direct_business,
        user.direct_referrals,
        `${user.goa_progress}%`,
        `${user.bangkok_progress}%`,
        user.qualified_rewards?.join(', ') || 'None'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_reward_progress.csv';
    a.click();
  };

  const UserCard = ({ user }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{user.username}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(user)}
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              ${user.total_investment?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Self Investment</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              ${user.direct_business?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Direct Business</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {user.direct_referrals}
            </div>
            <div className="text-xs text-gray-600">Direct Referrals</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Goa Tour</span>
              </div>
              <span className="text-sm text-gray-600">{user.goa_progress}%</span>
            </div>
            <Progress value={user.goa_progress} className="h-2" />
            <div className="text-xs text-gray-500 mt-1">
              Target: $1,000 self + $1,500 direct
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Bangkok Tour</span>
              </div>
              <span className="text-sm text-gray-600">{user.bangkok_progress}%</span>
            </div>
            <Progress value={user.bangkok_progress} className="h-2" />
            <div className="text-xs text-gray-500 mt-1">
              Target: $5,000 self + $10,000 direct
            </div>
          </div>
        </div>

        {/* Qualified Rewards */}
        {user.qualified_rewards?.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium text-green-700 mb-2">Qualified Rewards:</div>
            <div className="flex space-x-2">
              {user.qualified_rewards.map((reward) => (
                <Badge key={reward} className="bg-green-100 text-green-800 border border-green-300">
                  {reward === 'goa_tour' ? 'Goa Tour' : 'Bangkok Tour'}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom sx={{
            background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📊 User Progress Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor all users' progress towards reward qualification
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={exportData}
          startIcon={<DownloadIcon />}
          sx={{
            background: 'linear-gradient(135deg, #0ECB81 0%, #3FE1A0 100%)',
            color: '#fff',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #0BA572 0%, #0ECB81 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(14, 203, 129, 0.3)'
            }
          }}
        >
          Export CSV
        </Button>
      </Box>

      {/* Summary Stats */}
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
              <UsersIcon sx={{ fontSize: 40, color: '#F0B90B', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#F0B90B' }}>
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
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
                {users.filter(u => u.qualified_rewards?.includes('goa_tour')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Goa Qualified
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
                {users.filter(u => u.qualified_rewards?.includes('bangkok_tour')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bangkok Qualified
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
              <TrendingUpIcon sx={{ fontSize: 40, color: '#0ECB81', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#0ECB81' }}>
                {users.length > 0 ? Math.round((users.filter(u => u.qualified_rewards?.length > 0).length / users.length) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Qualification Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
              <FilterIcon />
              <FormControl fullWidth size="small">
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="qualified">Any Qualified</MenuItem>
                  <MenuItem value="goa_qualified">Goa Qualified</MenuItem>
                  <MenuItem value="bangkok_qualified">Bangkok Qualified</MenuItem>
                  <MenuItem value="no_rewards">No Rewards</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* User Grid */}
      <Grid container spacing={3}>
        {filteredUsers.map((user) => (
          <Grid item xs={12} md={6} lg={4} key={user._id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {user.username || 'Unknown User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusChip(user)}
                    <Button size="small" variant="outlined" startIcon={<EyeIcon />}>
                      View
                    </Button>
                  </Box>
                </Box>

                {/* Investment Summary */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        ${user.total_investment?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Self Investment
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        ${user.direct_business?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Direct Business
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="secondary" fontWeight="bold">
                        {user.direct_referrals || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Direct Referrals
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Progress Bars */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MapPinIcon sx={{ fontSize: 16, color: 'orange' }} />
                      <Typography variant="body2" fontWeight="medium">Goa Tour</Typography>
                    </Box>
                    <Typography variant="body2">{user.goa_progress || 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={user.goa_progress || 0}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: $1,000 self + $1,500 direct
                  </Typography>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PlaneIcon sx={{ fontSize: 16, color: 'blue' }} />
                      <Typography variant="body2" fontWeight="medium">Bangkok Tour</Typography>
                    </Box>
                    <Typography variant="body2">{user.bangkok_progress || 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={user.bangkok_progress || 0}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: $5,000 self + $10,000 direct
                  </Typography>
                </Box>

                {/* Qualified Rewards */}
                {user.qualified_rewards?.length > 0 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium" color="success.main" sx={{ mb: 1 }}>
                      Qualified Rewards:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {user.qualified_rewards.map((reward) => (
                        <Chip
                          key={reward}
                          label={reward === 'goa_tour' ? 'Goa Tour' : 'Bangkok Tour'}
                          color="success"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredUsers.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No users found matching your criteria.
        </Alert>
      )}
    </Box>
  );
};

export default UserProgressTracker;
