/**
 * Withdrawal Status Constants for Server-side
 * Centralized status mapping for consistency across the server application
 */

// Status codes - CONSISTENT ACROSS ALL PARTS OF APPLICATION
const WITHDRAWAL_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
};

// Status labels
const WITHDRAWAL_STATUS_LABELS = {
  [WITHDRAWAL_STATUS.PENDING]: 'PENDING',
  [WITHDRAWAL_STATUS.APPROVED]: 'APPROVED',
  [WITHDRAWAL_STATUS.REJECTED]: 'REJECTED'
};

// Helper functions
const getStatusLabel = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return WITHDRAWAL_STATUS_LABELS[statusCode] || 'UNKNOWN';
};

// Check if status is pending
const isPending = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return statusCode === WITHDRAWAL_STATUS.PENDING;
};

// Check if status is approved
const isApproved = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return statusCode === WITHDRAWAL_STATUS.APPROVED;
};

// Check if status is rejected
const isRejected = (status) => {
  const statusCode = typeof status === 'string' ? parseInt(status) : status;
  return statusCode === WITHDRAWAL_STATUS.REJECTED;
};

module.exports = {
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_LABELS,
  getStatusLabel,
  isPending,
  isApproved,
  isRejected
};
