import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  TableView as TableViewIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import TradingPackageService from '../../services/tradingpackage.service';
import useAuth from '../../hooks/useAuth';

const TradingPackageManagement = () => {
  const { getToken } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [viewDialog, setViewDialog] = useState(false);
  const [viewPackage, setViewPackage] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    trading_amount_from: '',
    trading_amount_to: '',
    daily_trading_roi: '',
    description: '',
    features: [],
    is_unlimited: false,
    status: true
  });

  // Remove hardcoded API URL - using service instead

  useEffect(() => {
    fetchPackages();
  }, [page, rowsPerPage, statusFilter, searchTerm]);



  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showSnackbar('Authentication required. Please log in again.', 'error');
        return;
      }

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { name: searchTerm })
      };

      const response = await TradingPackageService.getAllTradingPackages(params, token);

      if (response && response.status) {
        // Handle different response structures like other admin pages
        const result = response?.result || response?.data;

        if (result && result.data) {
          // If the response has nested data structure
          const packages = result.data.packages || [];
          const pagination = result.data.pagination || {};

          setPackages(packages);
          setTotalCount(pagination.totalCount || 0);
        } else if (result) {
          // If the response has direct structure
          const packages = result.packages || result.docs || result.list || [];
          const total = result.totalCount || result.totalDocs || result.total || 0;

          setPackages(packages);
          setTotalCount(total);
        } else {
          setPackages([]);
          setTotalCount(0);
        }
      } else {
        setPackages([]);
        setTotalCount(0);
      }
    } catch (error) {
      showSnackbar(
        error.detailedMessage || error.response?.data?.msg || 'Failed to fetch trading packages',
        'error'
      );

      setPackages([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (packageData = null) => {
    if (packageData) {
      setEditMode(true);
      setSelectedPackage(packageData);
      setFormData({
        ...packageData,
        features: packageData.features || []
      });
    } else {
      setEditMode(false);
      setSelectedPackage(null);
      setFormData({
        name: '',
        trading_amount_from: '',
        trading_amount_to: '',
        daily_trading_roi: '',
        description: '',
        features: [],
        is_unlimited: false,
        status: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedPackage(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (features) => {
    const featuresArray = features.split('\n').filter(f => f.trim());
    setFormData(prev => ({
      ...prev,
      features: featuresArray
    }));
  };

  const handleSubmit = async () => {
    // Enhanced validation
    const validationErrors = [];

    // Required fields validation
    if (!formData.name?.trim()) {
      validationErrors.push('Package name is required');
    } else if (formData.name.trim().length < 2) {
      validationErrors.push('Package name must be at least 2 characters long');
    } else if (formData.name.trim().length > 100) {
      validationErrors.push('Package name cannot exceed 100 characters');
    }

    if (!formData.trading_amount_from) {
      validationErrors.push('Minimum trading amount is required');
    } else {
      const minAmount = parseFloat(formData.trading_amount_from);
      if (minAmount < 1) {
        validationErrors.push('Minimum trading amount must be at least $1');
      } else if (minAmount > 1000000) {
        validationErrors.push('Minimum trading amount cannot exceed $1,000,000');
      }
    }

    if (!formData.is_unlimited && !formData.trading_amount_to) {
      validationErrors.push('Maximum trading amount is required for limited packages');
    } else if (!formData.is_unlimited && formData.trading_amount_to) {
      const maxAmount = parseFloat(formData.trading_amount_to);
      const minAmount = parseFloat(formData.trading_amount_from);
      if (maxAmount < 1) {
        validationErrors.push('Maximum trading amount must be at least $1');
      } else if (maxAmount > 10000000) {
        validationErrors.push('Maximum trading amount cannot exceed $10,000,000');
      } else if (maxAmount <= minAmount) {
        validationErrors.push('Maximum trading amount must be greater than minimum trading amount');
      }
    }

    if (!formData.daily_trading_roi) {
      validationErrors.push('Daily trading ROI is required');
    } else {
      const roi = parseFloat(formData.daily_trading_roi);
      if (roi < 0.01) {
        validationErrors.push('Daily trading ROI must be at least 0.01%');
      } else if (roi > 100) {
        validationErrors.push('Daily trading ROI cannot exceed 100%');
      }
    }

    // Features validation
    if (formData.features && formData.features.length > 10) {
      validationErrors.push('Cannot have more than 10 features');
    }

    if (formData.features) {
      formData.features.forEach((feature, index) => {
        if (feature && feature.length > 200) {
          validationErrors.push(`Feature ${index + 1} cannot exceed 200 characters`);
        }
      });
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      validationErrors.push('Description cannot exceed 500 characters');
    }

    if (validationErrors.length > 0) {
      showSnackbar(validationErrors[0], 'error');
      return;
    }

    try {
      setLoading(true);

      const token = getToken();
      if (!token) {
        showSnackbar('Authentication required. Please log in again.', 'error');
        return;
      }

      const payload = {
        ...formData,
        name: formData.name.trim(),
        trading_amount_from: parseFloat(formData.trading_amount_from),
        trading_amount_to: formData.is_unlimited ? null : parseFloat(formData.trading_amount_to),
        daily_trading_roi: parseFloat(formData.daily_trading_roi),
        description: formData.description?.trim() || '',
        features: formData.features?.filter(f => f && f.trim()) || []
      };

      if (editMode && selectedPackage) {
        payload.id = getPackageId(selectedPackage);
      }

      const response = editMode
        ? await TradingPackageService.updateTradingPackage(payload, token)
        : await TradingPackageService.createTradingPackage(payload, token);

      if (response && response.status) {
        showSnackbar(
          editMode ? 'Package updated successfully!' : 'Package created successfully!',
          'success'
        );
        handleCloseDialog();
        fetchPackages();
      } else {
        showSnackbar(
          response?.msg || response?.message || 'Failed to save package',
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving package:', error);
      showSnackbar(
        error.detailedMessage || error.response?.data?.result?.msg || 'Failed to save package',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (packageId, currentStatus) => {
    if (!packageId) {
      showSnackbar('Package ID is missing. Cannot update status.', 'error');
      return;
    }

    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    // Confirmation for status change
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this package?\n\n${newStatus ? 'Activating' : 'Deactivating'} this package will ${newStatus ? 'make it visible to clients' : 'hide it from clients'}.`
    );

    if (!confirmed) return;

    try {
      const token = getToken();
      if (!token) {
        showSnackbar('Authentication required. Please log in again.', 'error');
        return;
      }

      setLoading(true);

      const response = await TradingPackageService.updateTradingPackageStatus(
        packageId,
        newStatus,
        token
      );

      if (response && response.status) {
        showSnackbar(
          `Package ${newStatus ? 'activated' : 'deactivated'} successfully!`,
          'success'
        );
        fetchPackages();
      } else {
        showSnackbar(
          response?.msg || response?.message || 'Failed to update package status',
          'error'
        );
      }
    } catch (error) {
      let errorMessage = 'Failed to update package status';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Package not found. It may have been deleted.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (error.response.data?.msg) {
          errorMessage = error.response.data.msg;
        }
      } else if (error.detailedMessage) {
        errorMessage = error.detailedMessage;
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (packageId) => {
    if (!packageId) {
      showSnackbar('Package ID is missing. Cannot delete package.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete this package?\n\nThis action will:\n- Set the package status to inactive\n- Hide it from client view\n- Preserve all data for reporting\n\nClick OK to confirm deletion.`
    );

    if (!confirmed) return;

    try {
      const token = getToken();
      if (!token) {
        showSnackbar('Authentication required. Please log in again.', 'error');
        return;
      }

      setLoading(true);

      const response = await TradingPackageService.deleteTradingPackage(packageId, token);

      if (response && response.status) {
        showSnackbar('Package deleted successfully! The package has been deactivated.', 'success');
        await fetchPackages();
      } else {
        showSnackbar(
          response?.msg || response?.message || response?.result?.msg || 'Failed to delete package',
          'error'
        );
      }
    } catch (error) {
      let errorMessage = 'Failed to delete package';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Package not found. It may have already been deleted.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (error.response.data?.msg) {
          errorMessage = error.response.data.msg;
        }
      } else if (error.detailedMessage) {
        errorMessage = error.detailedMessage;
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Utility function to safely get package ID
  const getPackageId = (pkg) => {
    return pkg._id || pkg.id;
  };



  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewPackage = (pkg) => {
    setViewPackage(pkg);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setViewPackage(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Trading Package Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: 'linear-gradient(45deg, #f0b90b, #f8d12f)',
                color: '#000',
                fontWeight: 'bold'
              }}
            >
              Add Package
            </Button>
          </Box>

          {/* Filters and View Toggle */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
                fullWidth
              >
                <ToggleButton value="table" aria-label="table view">
                  <TableViewIcon sx={{ mr: 1 }} />
                  Table
                </ToggleButton>
                <ToggleButton value="cards" aria-label="card view">
                  <ViewModuleIcon sx={{ mr: 1 }} />
                  Cards
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  Total: {totalCount} packages
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Table View */}
          {!loading && viewMode === 'table' && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Amount Range</TableCell>
                    <TableCell>Daily ROI</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={getPackageId(pkg)}>
                      <TableCell>{pkg.name}</TableCell>
                      <TableCell>
                        ${pkg.trading_amount_from.toLocaleString()} -
                        {pkg.is_unlimited ? ' Unlimited' : ` $${pkg.trading_amount_to.toLocaleString()}`}
                      </TableCell>
                      <TableCell>{pkg.daily_trading_roi}%</TableCell>
                      <TableCell>
                        <Chip
                          label={pkg.status ? 'Active' : 'Inactive'}
                          color={pkg.status ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handleViewPackage(pkg)} size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(pkg)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={pkg.status ? 'Disable Package' : 'Enable Package'}>
                          <IconButton
                            onClick={() => handleToggleStatus(getPackageId(pkg), pkg.status)}
                            size="small"
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                backgroundColor: pkg.status ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)'
                              }
                            }}
                          >
                            {pkg.status ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="disabled" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Package (Soft Delete)">
                          <IconButton
                            onClick={() => handleDelete(getPackageId(pkg))}
                            size="small"
                            color="error"
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Card View */}
          {!loading && viewMode === 'cards' && (
            <Grid container spacing={3}>
              {packages.map((pkg) => (
                <Grid item xs={12} md={6} lg={4} key={getPackageId(pkg)}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: pkg.status ? '2px solid #4caf50' : '2px solid #f44336',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {pkg.name}
                        </Typography>
                        <Chip
                          label={pkg.status ? 'Active' : 'Inactive'}
                          color={pkg.status ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>



                      <Box sx={{ my: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {pkg.daily_trading_roi}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Daily ROI
                        </Typography>
                      </Box>

                      <Box sx={{ my: 2 }}>
                        <Typography variant="body1" fontWeight="medium">
                          Investment Range
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${pkg.trading_amount_from.toLocaleString()} -
                          {pkg.is_unlimited ? ' Unlimited' : ` $${pkg.trading_amount_to.toLocaleString()}`}
                        </Typography>
                      </Box>

                      {pkg.description && (
                        <Box sx={{ my: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {pkg.description}
                          </Typography>
                        </Box>
                      )}

                      {pkg.features && pkg.features.length > 0 && (
                        <Box sx={{ my: 2 }}>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Features:
                          </Typography>
                          <List dense>
                            {pkg.features.slice(0, 3).map((feature, index) => (
                              <ListItem key={index} sx={{ py: 0, px: 0 }}>
                                <ListItemText
                                  primary={`• ${feature}`}
                                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                />
                              </ListItem>
                            ))}
                            {pkg.features.length > 3 && (
                              <ListItem sx={{ py: 0, px: 0 }}>
                                <ListItemText
                                  primary={`... and ${pkg.features.length - 3} more`}
                                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', fontStyle: 'italic' }}
                                />
                              </ListItem>
                            )}
                          </List>
                        </Box>
                      )}
                    </CardContent>

                    <Divider />

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewPackage(pkg)}
                      >
                        View
                      </Button>

                      <Box>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(pkg)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={pkg.status ? 'Disable Package' : 'Enable Package'}>
                          <IconButton
                            onClick={() => handleToggleStatus(getPackageId(pkg), pkg.status)}
                            size="small"
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                backgroundColor: pkg.status ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)'
                              }
                            }}
                          >
                            {pkg.status ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="disabled" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Package (Soft Delete)">
                          <IconButton
                            onClick={() => handleDelete(getPackageId(pkg))}
                            size="small"
                            color="error"
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Empty State */}
          {!loading && packages.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No trading packages found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Get started by creating your first trading package'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  background: 'linear-gradient(45deg, #f0b90b, #f8d12f)',
                  color: '#000',
                  fontWeight: 'bold'
                }}
              >
                Add First Package
              </Button>
            </Box>
          )}

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Trading Package' : 'Add New Trading Package'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Package Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Trading Amount From ($)"
                type="number"
                value={formData.trading_amount_from}
                onChange={(e) => handleInputChange('trading_amount_from', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trading Amount To ($)"
                type="number"
                value={formData.trading_amount_to}
                onChange={(e) => handleInputChange('trading_amount_to', e.target.value)}
                disabled={formData.is_unlimited}
                required={!formData.is_unlimited}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Daily Trading ROI (%)"
                type="number"
                step="0.01"
                value={formData.daily_trading_roi}
                onChange={(e) => handleInputChange('daily_trading_roi', e.target.value)}
                required
                helperText={
                  formData.daily_trading_roi
                    ? `Monthly ROI: ${(parseFloat(formData.daily_trading_roi) * 30).toFixed(2)}%`
                    : 'Enter daily ROI percentage'
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features (one per line)"
                multiline
                rows={4}
                value={formData.features.join('\n')}
                onChange={(e) => handleFeatureChange(e.target.value)}
                placeholder="Enter features, one per line"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_unlimited}
                    onChange={(e) => handleInputChange('is_unlimited', e.target.checked)}
                  />
                }
                label="Unlimited Package"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.checked)}
                  />
                }
                label="Active Status"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #f0b90b, #f8d12f)',
              color: '#000',
              fontWeight: 'bold'
            }}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Package Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Package Details: {viewPackage?.name}
            </Typography>
            <Chip
              label={viewPackage?.status ? 'Active' : 'Inactive'}
              color={viewPackage?.status ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewPackage && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Basic Information
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Package Name</Typography>
                      <Typography variant="body1" fontWeight="medium">{viewPackage.name}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Daily ROI</Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {viewPackage.daily_trading_roi}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Monthly: {(viewPackage.daily_trading_roi * 30).toFixed(2)}%
                      </Typography>
                    </Box>

                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Investment Range
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Minimum Amount</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${viewPackage.trading_amount_from.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Maximum Amount</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewPackage.is_unlimited ? 'Unlimited' : `$${viewPackage.trading_amount_to.toLocaleString()}`}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Package Type</Typography>
                      <Chip
                        label={viewPackage.is_unlimited ? 'Unlimited' : 'Limited'}
                        color={viewPackage.is_unlimited ? 'primary' : 'default'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {viewPackage.description && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {viewPackage.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {viewPackage.features && viewPackage.features.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Features ({viewPackage.features.length})
                      </Typography>
                      <List>
                        {viewPackage.features.map((feature, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={`• ${feature}`}
                              primaryTypographyProps={{ variant: 'body1' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Timestamps
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Created At</Typography>
                      <Typography variant="body1">
                        {viewPackage.created_at ? new Date(viewPackage.created_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="body1">
                        {viewPackage.updated_at ? new Date(viewPackage.updated_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button
            onClick={() => {
              handleCloseViewDialog();
              handleOpenDialog(viewPackage);
            }}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{
              background: 'linear-gradient(45deg, #f0b90b, #f8d12f)',
              color: '#000',
              fontWeight: 'bold'
            }}
          >
            Edit Package
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TradingPackageManagement;
