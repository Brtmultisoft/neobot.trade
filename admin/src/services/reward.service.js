import ApiService from './api.service';

/**
 * Reward Service for Admin Panel
 * Handles all reward-related API calls
 */
const RewardService = {
  /**
   * Get all rewards with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getAllRewards(params = {}) {
    try {
      const token = localStorage.getItem('admin_token');
      console.log('RewardService: Making getAllRewards request with params:', params);
      console.log('RewardService: Using token:', token ? 'Token present' : 'No token');

      const response = await ApiService.request({
        method: 'GET',
        endpoint: '/admin/rewards',
        params,
        token,
        requestId: 'get-all-rewards'
      });

      console.log('RewardService: getAllRewards response:', response);
      return response;
    } catch (error) {
      console.error('RewardService: getAllRewards error:', error);
      throw error;
    }
  },

  /**
   * Get reward statistics
   * @returns {Promise} API response
   */
  async getRewardStatistics() {
    try {
      const token = localStorage.getItem('admin_token');
      console.log('RewardService: Making getRewardStatistics request');
      console.log('RewardService: Using token:', token ? 'Token present' : 'No token');

      const response = await ApiService.request({
        method: 'GET',
        endpoint: '/admin/rewards/statistics',
        token,
        requestId: 'get-reward-statistics'
      });

      console.log('RewardService: getRewardStatistics response:', response);
      return response;
    } catch (error) {
      console.error('RewardService: getRewardStatistics error:', error);
      throw error;
    }
  },

  /**
   * Get reward details by ID
   * @param {string} id - Reward ID
   * @returns {Promise} API response
   */
  async getRewardById(id) {
    const token = localStorage.getItem('admin_token');
    return ApiService.request({
      method: 'GET',
      endpoint: `/admin/rewards/${id}`,
      token,
      requestId: `get-reward-${id}`
    });
  },

  /**
   * Approve a reward
   * @param {string} id - Reward ID
   * @param {string} notes - Admin notes
   * @returns {Promise} API response
   */
  async approveReward(id, notes = '') {
    const token = localStorage.getItem('admin_token');
    return ApiService.request({
      method: 'POST',
      endpoint: `/admin/rewards/${id}/approve`,
      data: { notes: notes || '' },
      token,
      useCache: false,
      requestId: `approve-reward-${id}`
    });
  },

  /**
   * Process a reward (mark as completed)
   * @param {string} id - Reward ID
   * @param {string} notes - Admin notes
   * @returns {Promise} API response
   */
  async processReward(id, notes = '') {
    const token = localStorage.getItem('admin_token');
    return ApiService.request({
      method: 'POST',
      endpoint: `/admin/rewards/${id}/process`,
      data: { notes: notes || '' },
      token,
      useCache: false,
      requestId: `process-reward-${id}`
    });
  },

  /**
   * Trigger reward processing manually
   * @returns {Promise} API response
   */
  async triggerRewardProcessing() {
    const token = localStorage.getItem('admin_token');
    return ApiService.request({
      method: 'POST',
      endpoint: '/admin/rewards/trigger-processing',
      data: {},
      token,
      useCache: false,
      requestId: 'trigger-reward-processing'
    });
  },

  /**
   * Get reward targets configuration
   * @returns {Object} Reward targets
   */
  getRewardTargets() {
    return {
      goa_tour: {
        name: "Goa Tour",
        self_invest_target: 1000,
        direct_business_target: 1500,
        reward_value: "Goa Tour Package",
        color: "#4CAF50"
      },
      bangkok_tour: {
        name: "Bangkok Tour",
        self_invest_target: 5000,
        direct_business_target: 10000,
        reward_value: "Bangkok Tour Package",
        color: "#FF9800"
      }
    };
  },

  /**
   * Get status color for reward status
   * @param {string} status - Reward status
   * @returns {string} Color code
   */
  getStatusColor(status) {
    const colors = {
      qualified: '#2196F3',
      approved: '#4CAF50',
      processed: '#FF9800',
      completed: '#9C27B0'
    };
    return colors[status] || '#757575';
  },

  /**
   * Get status label for reward status
   * @param {string} status - Reward status
   * @returns {string} Status label
   */
  getStatusLabel(status) {
    const labels = {
      qualified: 'Qualified',
      approved: 'Approved',
      processed: 'Processed',
      completed: 'Completed'
    };
    return labels[status] || status;
  },

  /**
   * Calculate progress percentage
   * @param {number} achieved - Achieved amount
   * @param {number} target - Target amount
   * @returns {number} Progress percentage
   */
  calculateProgress(achieved, target) {
    if (!target || target === 0) return 0;
    const progress = (achieved / target) * 100;
    return Math.min(progress, 100);
  },

  /**
   * Check if reward qualifies with OR logic
   * @param {Object} reward - Reward object
   * @returns {Object} Qualification details
   */
  checkRewardQualification(reward) {
    const selfInvestComplete = reward.self_invest_achieved >= reward.self_invest_target;
    const directBusinessComplete = reward.direct_business_achieved >= reward.direct_business_target;

    return {
      selfInvestComplete,
      directBusinessComplete,
      isQualified: selfInvestComplete || directBusinessComplete,
      selfInvestProgress: this.calculateProgress(reward.self_invest_achieved, reward.self_invest_target),
      directBusinessProgress: this.calculateProgress(reward.direct_business_achieved, reward.direct_business_target)
    };
  },

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  },

  /**
   * Format date
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Export rewards data to CSV
   * @param {Array} rewards - Rewards data
   * @returns {string} CSV content
   */
  exportToCSV(rewards) {
    const headers = [
      'User ID',
      'Username',
      'Email',
      'Reward Type',
      'Reward Name',
      'Self Investment Target',
      'Self Investment Achieved',
      'Direct Business Target',
      'Direct Business Achieved',
      'Status',
      'Qualification Date',
      'Processed Date'
    ];

    const csvContent = [
      headers.join(','),
      ...rewards.map(reward => [
        reward.user_id?._id || '',
        reward.user_id?.username || '',
        reward.user_id?.email || '',
        reward.reward_type || '',
        reward.reward_name || '',
        reward.self_invest_target || 0,
        reward.self_invest_achieved || 0,
        reward.direct_business_target || 0,
        reward.direct_business_achieved || 0,
        reward.status || '',
        this.formatDate(reward.qualification_date),
        this.formatDate(reward.processed_at)
      ].join(','))
    ].join('\n');

    return csvContent;
  },

  /**
   * Download CSV file
   * @param {string} csvContent - CSV content
   * @param {string} filename - File name
   */
  downloadCSV(csvContent, filename = 'rewards_export.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default RewardService;
