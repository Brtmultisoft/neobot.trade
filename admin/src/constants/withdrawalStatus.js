/**
 * Withdrawal Status Constants for Admin Panel
 * Centralized status mapping for consistency across the admin application
 */

// Status codes
export const WITHDRAWAL_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
};

// Status labels
export const WITHDRAWAL_STATUS_LABELS = {
  [WITHDRAWAL_STATUS.PENDING]: 'Pending',
  [WITHDRAWAL_STATUS.APPROVED]: 'Approved',
  [WITHDRAWAL_STATUS.REJECTED]: 'Rejected'
};

// Status colors for UI components
export const WITHDRAWAL_STATUS_COLORS = {
  [WITHDRAWAL_STATUS.PENDING]: 'warning',
  [WITHDRAWAL_STATUS.APPROVED]: 'success',
  [WITHDRAWAL_STATUS.REJECTED]: 'error'
};

// Helper functions
export const getStatusLabel = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return WITHDRAWAL_STATUS_LABELS[statusCode] || 'Unknown';
};

export const getStatusColor = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return WITHDRAWAL_STATUS_COLORS[statusCode] || 'default';
};

// Check if status is pending
export const isPending = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return statusCode === WITHDRAWAL_STATUS.PENDING;
};

// Check if status is approved
export const isApproved = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return statusCode === WITHDRAWAL_STATUS.APPROVED;
};

// Check if status is rejected
export const isRejected = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return statusCode === WITHDRAWAL_STATUS.REJECTED;
};

export default {
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_LABELS,
  WITHDRAWAL_STATUS_COLORS,
  getStatusLabel,
  getStatusColor,
  isPending,
  isApproved,
  isRejected
};
