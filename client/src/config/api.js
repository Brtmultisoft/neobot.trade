/**
 * API Configuration for Client
 * Centralized configuration for all API endpoints and settings
 */

// Get API base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:2015/api/v1';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/user/login',
    SIGNUP: '/user/signup',
    LOGOUT: '/user/logout',
    REFRESH: '/user/refresh-token',
    FORGOT_PASSWORD: '/user/forgot/password',
    RESET_PASSWORD: '/user/reset/password',
    VERIFY_EMAIL: '/user/verify-email',
    VERIFY_2FA: '/user/verify-2fa-otp',
  },

  // User endpoints
  USER: {
    PROFILE: '/user/get-profile',
    UPDATE_PROFILE: '/user/update-profile',
    CHANGE_PASSWORD: '/user/change-password',
    GET_WALLET: '/user/get-wallet',
    UPDATE_SETTINGS: '/user/update-settings',
  },

  // Trading Package endpoints (Public - No auth required)
  TRADING_PACKAGES: {
    GET_ALL: '/user/trading-packages',
    GET_BY_ID: '/user/trading-packages',
    FIND_BY_AMOUNT: '/user/trading-packages/find-by-amount',
    CALCULATE_RETURNS: '/user/trading-packages/calculate-returns',
  },

  // Investment endpoints
  INVESTMENT: {
    GET_ALL: '/user/get-all-investments',
    GET_BY_ID: '/user/get-investment',
    ADD_TRADING_PACKAGE: '/user/add-trading-package',
    GET_USER_INVESTMENTS: '/user/get-user-investments',
    GET_INVESTMENT_SUM: '/user/get-investment-sum',
  },

  // Income endpoints
  INCOME: {
    GET_ALL: '/user/get-all-incomes',
    GET_DAILY_ROI: '/user/get-daily-roi-income',
    GET_REFERRAL: '/user/get-referral-income',
    GET_LEVEL: '/user/get-level-income',
  },

  // Team endpoints
  TEAM: {
    GET_DIRECT_REFERRALS: '/user/get-direct-referrals',
    GET_TEAM_STRUCTURE: '/user/get-team-structure',
    GET_TEAM_STATS: '/user/get-team-stats',
  },

  // Wallet endpoints
  WALLET: {
    GET_BALANCE: '/user/get-wallet-balance',
    ADD_FUNDS: '/user/add-funds',
    WITHDRAW: '/user/withdraw',
    GET_TRANSACTIONS: '/user/get-transactions',
  },

  // Dashboard endpoints
  DASHBOARD: {
    GET_STATS: '/user/get-dashboard-stats',
    GET_RECENT_ACTIVITIES: '/user/get-recent-activities',
  },

  // Notification endpoints
  NOTIFICATIONS: {
    GET_ALL: '/user/get-notifications',
    MARK_READ: '/user/mark-notification-read',
    MARK_ALL_READ: '/user/mark-all-notifications-read',
  },

  // Reward endpoints
  REWARDS: {
    GET_ALL: '/user/get-rewards',
    GET_ELIGIBILITY: '/user/get-reward-eligibility',
  },
};

// API configuration settings
export const API_CONFIG = {
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000,
  },
  
  // Cache configuration
  CACHE: {
    ENABLED: true,
    TTL: 5 * 60 * 1000, // 5 minutes
  },
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token = null) => {
  const authToken = token || localStorage.getItem('token');
  return {
    ...API_CONFIG.HEADERS,
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
  };
};

// Export default configuration
export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS,
  CONFIG: API_CONFIG,
  buildUrl: buildApiUrl,
  getAuthHeaders,
};
