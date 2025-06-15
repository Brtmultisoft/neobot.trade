import ApiService from './api.service';

/**
 * Trading Package Service for Admin Panel
 * Handles all trading package related API calls
 */
const TradingPackageService = {
  /**
   * Get all trading packages with pagination and filters
   * @param {Object} params - Query parameters
   * @param {string} token - Optional auth token (will get from localStorage if not provided)
   * @returns {Promise} API response
   */
  async getAllTradingPackages(params = {}, token = null) {
    const authToken = token || localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'GET',
      endpoint: '/admin/get-all-trading-packages',
      params,
      token: authToken,
      useCache: false, // Don't cache admin data for real-time updates
      requestId: 'get-all-trading-packages'
    });
  },

  /**
   * Get single trading package by ID
   * @param {string} id - Package ID
   * @returns {Promise} API response
   */
  async getTradingPackageById(id) {
    const token = localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'GET',
      endpoint: `/admin/get-trading-package/${id}`,
      token,
      useCache: false,
      requestId: `get-trading-package-${id}`
    });
  },

  /**
   * Create new trading package
   * @param {Object} packageData - Package data
   * @param {string} token - Optional auth token
   * @returns {Promise} API response
   */
  async createTradingPackage(packageData, token = null) {
    const authToken = token || localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'POST',
      endpoint: '/admin/add-trading-package',
      data: packageData,
      token: authToken,
      requestId: 'create-trading-package'
    });
  },

  /**
   * Update existing trading package
   * @param {Object} packageData - Package data with ID
   * @param {string} token - Optional auth token
   * @returns {Promise} API response
   */
  async updateTradingPackage(packageData, token = null) {
    const authToken = token || localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'PUT',
      endpoint: '/admin/update-trading-package',
      data: packageData,
      token: authToken,
      requestId: `update-trading-package-${packageData.id}`
    });
  },

  /**
   * Delete trading package (soft delete)
   * @param {string} id - Package ID
   * @param {string} token - Optional auth token
   * @returns {Promise} API response
   */
  async deleteTradingPackage(id, token = null) {
    const authToken = token || localStorage.getItem('admin_token');

    return ApiService.request({
      method: 'DELETE',
      endpoint: `/admin/delete-trading-package/${id}`,
      token: authToken,
      requestId: `delete-trading-package-${id}`
    });
  },

  /**
   * Update trading package status (enable/disable)
   * @param {string} id - Package ID
   * @param {boolean} status - New status
   * @param {string} token - Optional auth token
   * @returns {Promise} API response
   */
  async updateTradingPackageStatus(id, status, token = null) {
    const authToken = token || localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'PUT',
      endpoint: '/admin/update-trading-package-status',
      data: { id, status },
      token: authToken,
      requestId: `update-package-status-${id}`
    });
  },

  /**
   * Get trading package statistics
   * @returns {Promise} API response
   */
  async getTradingPackageStats() {
    const token = localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'GET',
      endpoint: '/admin/trading-package-stats',
      token,
      useCache: true,
      requestId: 'trading-package-stats'
    });
  },

  /**
   * Bulk update trading packages
   * @param {Array} packages - Array of package updates
   * @returns {Promise} API response
   */
  async bulkUpdateTradingPackages(packages) {
    const token = localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'PUT',
      endpoint: '/admin/bulk-update-trading-packages',
      data: { packages },
      token,
      requestId: 'bulk-update-trading-packages'
    });
  },

  /**
   * Export trading packages data
   * @param {Object} filters - Export filters
   * @returns {Promise} API response
   */
  async exportTradingPackages(filters = {}) {
    const token = localStorage.getItem('admin_token');
    
    return ApiService.request({
      method: 'GET',
      endpoint: '/admin/export-trading-packages',
      params: filters,
      token,
      useCache: false,
      requestId: 'export-trading-packages'
    });
  }
};

export default TradingPackageService;
