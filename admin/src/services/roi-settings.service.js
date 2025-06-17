import ApiService from './api.service';

/**
 * ROI Settings Service
 * Handles all API calls related to ROI settings management
 */

class ROISettingsService {
  /**
   * Get all ROI settings
   */
  async getROISettings(token) {
    try {
      const response = await ApiService.request({
        endpoint: '/admin/settings/roi-settings',
        token,
        requestId: 'roi_settings'
      });
      return response;
    } catch (error) {
      console.error('Error fetching ROI settings:', error);
      throw error;
    }
  }

  /**
   * Update or create ROI setting
   */
  async updateROISetting(settingData, token) {
    try {
      const response = await ApiService.request({
        method: 'POST',
        endpoint: '/admin/settings/roi-settings',
        data: settingData,
        token,
        useCache: false,
        requestId: `update_roi_setting_${settingData.name}`
      });
      return response;
    } catch (error) {
      console.error('Error updating ROI setting:', error);
      throw error;
    }
  }

  /**
   * Get ROI ranges summary
   */
  async getROIRangesSummary(token) {
    try {
      const response = await ApiService.request({
        endpoint: '/admin/settings/roi-ranges-summary',
        token,
        requestId: 'roi_ranges_summary'
      });
      return response;
    } catch (error) {
      console.error('Error fetching ROI ranges summary:', error);
      throw error;
    }
  }

  /**
   * Test ROI generation for given amount
   */
  async testROIGeneration(amount, token) {
    try {
      const response = await ApiService.request({
        method: 'POST',
        endpoint: '/admin/settings/test-roi-generation',
        data: { amount },
        token,
        useCache: false,
        requestId: `test_roi_${amount}`
      });
      return response;
    } catch (error) {
      console.error('Error testing ROI generation:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple ROI settings
   */
  async batchUpdateROISettings(settings, token) {
    try {
      const promises = settings.map(setting => this.updateROISetting(setting, token));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      return {
        success: failed.length === 0,
        successful: successful.length,
        failed: failed.length,
        results: results
      };
    } catch (error) {
      console.error('Error batch updating ROI settings:', error);
      throw error;
    }
  }

  /**
   * Validate ROI setting value
   */
  validateROISetting(name, value) {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return { valid: false, message: 'Value must be a valid number' };
    }

    if (name.includes('roi')) {
      if (numValue < 0.01 || numValue > 100) {
        return { valid: false, message: 'ROI value must be between 0.01% and 100%' };
      }
    } else if (name.includes('amount_threshold')) {
      if (numValue < 100 || numValue > 100000) {
        return { valid: false, message: 'Amount threshold must be between $100 and $100,000' };
      }
    } else if (name === 'withdrawal_fee_percentage') {
      if (numValue < 0 || numValue > 50) {
        return { valid: false, message: 'Withdrawal fee must be between 0% and 50%' };
      }
    } else if (name === 'minimum_withdrawal_amount') {
      if (numValue < 1 || numValue > 1000) {
        return { valid: false, message: 'Minimum withdrawal amount must be between $1 and $1,000' };
      }
    }

    return { valid: true, message: 'Valid' };
  }

  /**
   * Calculate daily ROI from monthly ROI
   */
  calculateDailyROI(monthlyROI) {
    return (parseFloat(monthlyROI) / 30).toFixed(3);
  }

  /**
   * Calculate monthly ROI from daily ROI
   */
  calculateMonthlyROI(dailyROI) {
    return (parseFloat(dailyROI) * 30).toFixed(2);
  }

  /**
   * Get default ROI settings configuration
   */
  getDefaultROISettings() {
    return [
      {
        key: 'silver_package_monthly_roi_min',
        label: 'Silver Package Min ROI (%)',
        description: 'Minimum monthly ROI percentage for Silver package',
        category: 'Silver Package',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 20
      },
      {
        key: 'silver_package_monthly_roi_max',
        label: 'Silver Package Max ROI (%)',
        description: 'Maximum monthly ROI percentage for Silver package',
        category: 'Silver Package',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 30
      },
      {
        key: 'gold_package_monthly_roi_min',
        label: 'Gold Package Min ROI (%)',
        description: 'Minimum monthly ROI percentage for Gold package',
        category: 'Gold Package',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 30
      },
      {
        key: 'gold_package_monthly_roi_max',
        label: 'Gold Package Max ROI (%)',
        description: 'Maximum monthly ROI percentage for Gold package',
        category: 'Gold Package',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 40
      },
      {
        key: 'silver_package_amount_threshold',
        label: 'Amount Threshold ($)',
        description: 'Investment amount threshold to determine Silver vs Gold package',
        category: 'General',
        type: 'number',
        min: 100,
        max: 100000,
        defaultValue: 5000
      },
      {
        key: 'withdrawal_fee_percentage',
        label: 'Withdrawal Fee (%)',
        description: 'Withdrawal fee percentage charged on all withdrawals',
        category: 'Withdrawal Settings',
        type: 'number',
        min: 0,
        max: 50,
        defaultValue: 10
      },
      {
        key: 'minimum_withdrawal_amount',
        label: 'Minimum Withdrawal ($)',
        description: 'Minimum withdrawal amount allowed in USD',
        category: 'Withdrawal Settings',
        type: 'number',
        min: 1,
        max: 1000,
        defaultValue: 20
      }
    ];
  }

  /**
   * Format ROI setting for display
   */
  formatROISetting(setting, config) {
    const value = setting?.value || 'Not Set';
    const isROI = config.key.includes('roi') || config.key.includes('percentage');
    const isAmount = config.key.includes('amount');

    return {
      ...setting,
      formattedValue: value === 'Not Set' ? value : `${value}${isROI ? '%' : isAmount ? ' USD' : ''}`,
      dailyEquivalent: config.key.includes('monthly_roi') && value !== 'Not Set' ? this.calculateDailyROI(value) : null,
      config
    };
  }
}

// Create and export a singleton instance
const roiSettingsService = new ROISettingsService();
export default roiSettingsService;
