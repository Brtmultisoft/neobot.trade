import React, { useState, useEffect, useMemo } from 'react';
import ApiService from '../../services/api.service';
import {
  Card, CardContent, Typography, Box, Table, TableHead, TableBody, TableRow, TableCell,
  TableSortLabel, TablePagination, TextField, Alert, Chip, useMediaQuery, Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const RewardEligibleUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('self_investment');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch all users with their investment summary (with eligibleRewards from backend)
  useEffect(() => {
    async function fetchAllUsersWithInvestmentSummary() {
      try {
        const token = localStorage.getItem('admin_token');
        const requestId = '/admin/get-investment-summary-' + Date.now();
        const res = await ApiService.request({
          method: 'GET',
          endpoint: '/admin/get-investment-summary',
          token,
          requestId,
        });
        if (res && res.data && res.data.data) {
          setAllUsers(res.data.data);
        } else if (res && res.data) {
          setAllUsers(res.data);
        } else {
          setError('No data in response');
        }
      } catch (err) {
        setError('API error: ' + (err?.message || err));
      }
    }
    fetchAllUsersWithInvestmentSummary();
  }, []);

  // Filtering, sorting, and pagination
  const processedUsers = useMemo(() => {
    let users = allUsers;
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    users = [...users].sort((a, b) => {
      let vA, vB;
      switch (sortBy) {
        case 'username':
          vA = a.username?.toLowerCase() || '';
          vB = b.username?.toLowerCase() || '';
          break;
        case 'email':
          vA = a.email?.toLowerCase() || '';
          vB = b.email?.toLowerCase() || '';
          break;
        case 'self_investment':
          vA = a.self_investment || 0;
          vB = b.self_investment || 0;
          break;
        case 'direct_business':
          vA = a.direct_business || 0;
          vB = b.direct_business || 0;
          break;
        default:
          vA = 0; vB = 0;
      }
      if (vA < vB) return sortDirection === 'asc' ? -1 : 1;
      if (vA > vB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return users;
  }, [allUsers, search, sortBy, sortDirection]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return processedUsers.slice(start, start + rowsPerPage);
  }, [processedUsers, page, rowsPerPage]);

  // Summary
  const totalSelfInvestment = processedUsers.reduce((sum, u) => sum + (u.self_investment || 0), 0);
  const totalDirectBusiness = processedUsers.reduce((sum, u) => sum + (u.direct_business || 0), 0);

  // Handlers
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={{ xs: 1, sm: 3 }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" mb={1} textAlign="center">
        User Reward Tracking
      </Typography>
      <Typography variant={isMobile ? 'body2' : 'subtitle1'} color="text.secondary" mb={3} textAlign="center">
        Track all users' self investment, direct business, and reward eligibility. Use search, sorting, and filters for admin insights.
      </Typography>
      <Card sx={{ maxWidth: 1200, margin: '0 auto', mb: 4, boxShadow: 3 }}>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={2}
            justifyContent="space-between"
            alignItems={isMobile ? 'stretch' : 'center'}
            mb={2}
          >
            <Typography variant="body1" fontWeight="bold">
              Total Users: {processedUsers.length}
            </Typography>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search by username or email"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              sx={{ minWidth: isMobile ? 0 : 260, width: isMobile ? '100%' : undefined }}
            />
          </Stack>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortBy === 'username' ? sortDirection : false} sx={{ minWidth: 120 }}>
                    <TableSortLabel
                      active={sortBy === 'username'}
                      direction={sortBy === 'username' ? sortDirection : 'asc'}
                      onClick={() => handleSort('username')}
                    >
                      Username
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortBy === 'email' ? sortDirection : false} sx={{ minWidth: 160 }}>
                    <TableSortLabel
                      active={sortBy === 'email'}
                      direction={sortBy === 'email' ? sortDirection : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortBy === 'self_investment' ? sortDirection : false} align="right" sx={{ minWidth: 100 }}>
                    <TableSortLabel
                      active={sortBy === 'self_investment'}
                      direction={sortBy === 'self_investment' ? sortDirection : 'desc'}
                      onClick={() => handleSort('self_investment')}
                    >
                      Self Invest
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortBy === 'direct_business' ? sortDirection : false} align="right" sx={{ minWidth: 120 }}>
                    <TableSortLabel
                      active={sortBy === 'direct_business'}
                      direction={sortBy === 'direct_business' ? sortDirection : 'desc'}
                      onClick={() => handleSort('direct_business')}
                    >
                      Direct Business
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Eligible Rewards</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">No users found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map(user => (
                    <TableRow key={user._id}>
                      <TableCell sx={{ wordBreak: 'break-word' }}>{user.username}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>{user.email}</TableCell>
                      <TableCell align="right">{user.self_investment}</TableCell>
                      <TableCell align="right">{user.direct_business}</TableCell>
                      <TableCell>
                        {user.eligibleRewards && user.eligibleRewards.length > 0 ? user.eligibleRewards.map(rw => (
                          <Chip
                            key={rw.reward_id || rw.reward_name}
                            label={rw.reward_name}
                            color="success"
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )) : <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {/* Summary row */}
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell colSpan={2} align="right"><b>Total</b></TableCell>
                  <TableCell align="right"><b>{totalSelfInvestment}</b></TableCell>
                  <TableCell align="right"><b>{totalDirectBusiness}</b></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={processedUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[20, 50, 100]}
            sx={{
              '.MuiTablePagination-toolbar': {
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? 1 : 0,
              },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: isMobile ? '0.9rem' : undefined,
              },
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardEligibleUsers; 