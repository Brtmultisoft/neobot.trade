import api from './api';
import { API_ENDPOINTS } from '../config/api';

/**
 * Trading Package Service
 * Handles all trading package related API calls
 *
 * Public endpoints (no auth): View packages, calculate returns
 * Private endpoints (auth required): Purchase packages
 */
class TradingPackageService {

  /**
   * Helper method for public API calls (no authentication required)
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {object} body - Request body for POST requests
   * @returns {Promise} API response
   */
  static async makePublicApiCall(endpoint, method = 'GET', body = null) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2015/api/v1';
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${baseUrl}${endpoint}`, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error making public API call to ${endpoint}:`, error);
      throw error;
    }
  }
  /**
   * Get all active trading packages (Public endpoint - no auth required)
   * @returns {Promise} API response with trading packages
   */
  static async getAllTradingPackages() {
    try {
      // Use the new public routes that bypass all authentication
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2015/api/v1';
      const publicUrl = baseUrl.replace('/api/v1', '/public');

      const response = await fetch(`${publicUrl}/trading-packages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching trading packages:', error);
      throw error;
    }
  }

  /**
   * Get trading package by ID (Public endpoint - no auth required)
   * @param {string} id - Package ID
   * @returns {Promise} API response with trading package
   */
  static async getTradingPackageById(id) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2015/api/v1';
      const publicUrl = baseUrl.replace('/api/v1', '/public');

      const response = await fetch(`${publicUrl}/trading-packages/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching trading package by ID:', error);
      throw error;
    }
  }

  /**
   * Find trading package by investment amount (Public endpoint - no auth required)
   * @param {number} amount - Investment amount
   * @returns {Promise} API response with matching trading package
   */
  static async findPackageByAmount(amount) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2015/api/v1';
      const publicUrl = baseUrl.replace('/api/v1', '/public');

      const response = await fetch(`${publicUrl}/trading-packages/find-by-amount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error finding trading package by amount:', error);
      throw error;
    }
  }

  /**
   * Calculate potential returns for an investment amount (Public endpoint - no auth required)
   * @param {number} amount - Investment amount
   * @param {number} days - Number of days (default: 30)
   * @returns {Promise} API response with calculated returns
   */
  static async calculateReturns(amount, days = 30) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2015/api/v1';
      const publicUrl = baseUrl.replace('/api/v1', '/public');

      const response = await fetch(`${publicUrl}/trading-packages/calculate-returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ amount, days }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calculating returns:', error);
      throw error;
    }
  }

  /**
   * Purchase trading package (Private endpoint - authentication required)
   * @param {object} purchaseData - Purchase data (amount, package_id, etc.)
   * @returns {Promise} API response
   */
  static async purchaseTradingPackage(purchaseData) {
    try {
      const response = await api.post(API_ENDPOINTS.INVESTMENT.ADD_TRADING_PACKAGE, purchaseData);
      return response.data;
    } catch (error) {
      console.error('Error purchasing trading package:', error);
      throw error.response?.data || error;
    }
  }
}

export default TradingPackageService;
