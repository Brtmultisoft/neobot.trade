import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Divider,
  useTheme,
  Grid,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';

const WithdrawalProcessingStatus = ({
  txHash,
  onClose,
  amount,
  fee,
  netAmount
}) => {
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Get blockchain explorer URL
  const getExplorerUrl = () => {
    return `https://bscscan.com/tx/${txHash}`;
  };

  // Open transaction in BSCScan
  const viewOnBscScan = () => {
    window.open(getExplorerUrl(), '_blank');
  };

  // Copy transaction hash to clipboard
  const handleCopyTxHash = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setSnackbarMessage('Transaction hash copied to clipboard!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to copy transaction hash:', err);
      setSnackbarMessage('Failed to copy transaction hash');
      setSnackbarOpen(true);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Withdrawal Processed Successfully
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Success Message */}
      <Alert
        severity="success"
        icon={<CheckCircleIcon fontSize="inherit" />}
        sx={{ mb: 3 }}
      >
        Your withdrawal request has been approved and processed successfully.
      </Alert>

      {/* Amount Information */}
      {amount && parseFloat(amount) > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Amount:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {parseFloat(amount).toFixed(2)} USDT
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Network Fee (10%):
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                {fee ? parseFloat(fee).toFixed(2) : (parseFloat(amount) * 0.1).toFixed(2)} USDT
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Net Amount:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {netAmount ? parseFloat(netAmount).toFixed(2) : (parseFloat(amount) * 0.9).toFixed(2)} USDT
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Transaction Information */}
      {txHash && txHash.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Transaction Hash:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
                p: 1,
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              {txHash}
            </Typography>
            <Tooltip title="Copy Transaction Hash">
              <IconButton
                size="small"
                onClick={handleCopyTxHash}
                color="primary"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LaunchIcon />}
              onClick={viewOnBscScan}
              sx={{ minWidth: 'auto' }}
            >
              BSCScan
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary">
            The transaction has been submitted to the blockchain. You can copy the hash or view details on BSCScan.
          </Typography>
        </Paper>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="success"
        >
          Done
        </Button>
      </Box>

      {/* Snackbar for copy feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

// PropTypes validation
WithdrawalProcessingStatus.propTypes = {
  txHash: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  netAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

WithdrawalProcessingStatus.defaultProps = {
  txHash: '',
  amount: 0,
  fee: null,
  netAmount: null,
};

export default WithdrawalProcessingStatus;
