import api from './api';

// Helper function to handle API responses consistently (same as other services)
const handleApiResponse = (response) => {
  return response.data;
};

// Admin Reward Services
export const adminRewardService = {
  // Get all rewards with optional filters
  getAllRewards: async (filters = {}) => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.reward_type) params.reward_type = filters.reward_type;
      if (filters.limit) params.limit = filters.limit;
      if (filters.page) params.page = filters.page;

      const response = await api.get('/admin/rewards', { params });
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Admin rewards API not available:', error);
      return { data: [] };
    }
  },

  // Get reward statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/admin/rewards/statistics');
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Admin statistics API not available:', error);
      return { data: {} };
    }
  },

  // Get specific reward details
  getRewardDetails: async (rewardId) => {
    try {
      const response = await api.get(`/admin/rewards/${rewardId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Admin reward details API not available:', error);
      return { data: null };
    }
  },

  // Approve a reward
  approveReward: async (rewardId, notes = '') => {
    try {
      const response = await api.post(`/admin/rewards/${rewardId}/approve`, { notes });
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Admin approve reward API not available:', error);
      return { success: false, message: 'API not available' };
    }
  },

  // Process a reward
  processReward: async (rewardId, notes = '') => {
    try {
      const response = await api.post(`/admin/rewards/${rewardId}/process`, { notes });
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Admin process reward API not available:', error);
      return { success: false, message: 'API not available' };
    }
  },

  // Get all users' reward progress
  getUsersProgress: async (filters = {}) => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.reward_type) params.reward_type = filters.reward_type;
      if (filters.limit) params.limit = filters.limit;
      if (filters.page) params.page = filters.page;

      const response = await api.get('/admin/users/reward-progress', { params });
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Admin users progress API not available:', error);
      return { data: [] };
    }
  },

  // Trigger manual reward processing
  triggerRewardProcessing: async () => {
    try {
      const response = await api.post('/admin/rewards/trigger');
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Admin trigger processing API not available:', error);
      return { success: false, message: 'API not available' };
    }
  }
};

// User Reward Services
export const userRewardService = {
  // Get user's reward status and progress (calculated from real data)
  getRewardStatus: async () => {
    try {
      console.log('🎯 Starting reward status calculation...');

      // Fetch user's investment data using the same pattern as InvestmentService
      console.log('📊 Fetching user investments...');
      const investmentResponse = await api.get('/get-user-investments');
      console.log('Investment response:', investmentResponse);
      const investmentData = handleApiResponse(investmentResponse);
      console.log('Investment data processed:', investmentData);

      // Fetch user's direct referrals using the same pattern as existing services
      console.log('👥 Fetching direct referrals...');
      const directResponse = await api.get('/get-user-direct');
      console.log('Direct response:', directResponse);
      const directData = handleApiResponse(directResponse);
      console.log('Direct data processed:', directData);

      // Fetch user's direct income using the same pattern as IncomeService
      console.log('💰 Fetching direct income...');
      const incomeResponse = await api.get('/get-direct-incomes');
      console.log('Income response:', incomeResponse);
      const incomeData = handleApiResponse(incomeResponse);
      console.log('Income data processed:', incomeData);

      // Calculate totals from real data (same pattern as existing services)
      console.log('🧮 Calculating totals...');

      // Handle investment data - based on actual API response structure
      let investments = [];
      if (investmentData && investmentData.data && investmentData.data.list) {
        investments = investmentData.data.list;
      } else if (investmentData && investmentData.result && investmentData.result.list) {
        investments = investmentData.result.list;
      } else if (investmentData && investmentData.data && Array.isArray(investmentData.data)) {
        investments = investmentData.data;
      } else if (investmentData && Array.isArray(investmentData)) {
        investments = investmentData;
      }
      console.log('Processed investments:', investments);

      let totalSelfInvestment = investments.reduce((sum, inv) => {
        const amount = parseFloat(inv.amount) || 0;
        console.log(`Investment amount: ${amount}`);
        return sum + amount;
      }, 0);
      console.log('Total self investment calculated:', totalSelfInvestment);

      // Handle direct referrals data - based on actual API response structure
      let directReferrals = [];
      if (directData && directData.data && directData.data.list) {
        directReferrals = directData.data.list;
      } else if (directData && directData.result && directData.result.list) {
        directReferrals = directData.result.list;
      } else if (directData && directData.data && Array.isArray(directData.data)) {
        directReferrals = directData.data;
      } else if (directData && Array.isArray(directData)) {
        directReferrals = directData;
      }
      console.log('Processed direct referrals:', directReferrals);

      // Handle income data - based on actual API response structure
      let directIncomes = [];
      if (incomeData && incomeData.data && incomeData.data.list) {
        directIncomes = incomeData.data.list;
      } else if (incomeData && incomeData.result && incomeData.result.list) {
        directIncomes = incomeData.result.list;
      } else if (incomeData && incomeData.data && Array.isArray(incomeData.data)) {
        directIncomes = incomeData.data;
      } else if (incomeData && Array.isArray(incomeData)) {
        directIncomes = incomeData;
      }
      console.log('Processed direct incomes:', directIncomes);

      // Calculate direct business from referral investments (not just income)
      let totalDirectBusiness = directReferrals.reduce((sum, referral) => {
        const amount = parseFloat(referral.total_investment || referral.totalInvestment) || 0;
        console.log(`Referral ${referral.username || referral.name} investment: ${amount}`);
        return sum + amount;
      }, 0);

      // Also add income from direct incomes if available
      const incomeFromBonuses = directIncomes.reduce((sum, income) => {
        const amount = parseFloat(income.amount) || 0;
        console.log(`Income amount: ${amount}`);
        return sum + amount;
      }, 0);

      // Use the higher value between referral investments and income bonuses
      if (incomeFromBonuses > totalDirectBusiness) {
        totalDirectBusiness = incomeFromBonuses;
        console.log('Using income bonuses as direct business:', totalDirectBusiness);
      } else {
        console.log('Using referral investments as direct business:', totalDirectBusiness);
      }

      console.log('Calculated totals:', {
        totalSelfInvestment,
        totalDirectBusiness,
        directReferralsCount: directReferrals.length
      });

      // Reward targets
      const goaTargets = { self: 1000, direct: 1500 };
      const bangkokTargets = { self: 5000, direct: 10000 };

      // Calculate progress
      const goaProgress = {
        name: "Goa Tour",
        self_invest_target: goaTargets.self,
        direct_business_target: goaTargets.direct,
        current_self_investment: totalSelfInvestment,
        current_direct_business: totalDirectBusiness,
        self_investment_progress: Math.min((totalSelfInvestment / goaTargets.self) * 100, 100),
        direct_business_progress: Math.min((totalDirectBusiness / goaTargets.direct) * 100, 100),
        overall_progress: Math.min(((totalSelfInvestment / goaTargets.self + totalDirectBusiness / goaTargets.direct) / 2) * 100, 100),
        is_qualified: totalSelfInvestment >= goaTargets.self && totalDirectBusiness >= goaTargets.direct,
        status: totalSelfInvestment >= goaTargets.self && totalDirectBusiness >= goaTargets.direct ? "qualified" : "not_qualified",
        remaining_self_investment: Math.max(0, goaTargets.self - totalSelfInvestment),
        remaining_direct_business: Math.max(0, goaTargets.direct - totalDirectBusiness)
      };

      const bangkokProgress = {
        name: "Bangkok Tour",
        self_invest_target: bangkokTargets.self,
        direct_business_target: bangkokTargets.direct,
        current_self_investment: totalSelfInvestment,
        current_direct_business: totalDirectBusiness,
        self_investment_progress: Math.min((totalSelfInvestment / bangkokTargets.self) * 100, 100),
        direct_business_progress: Math.min((totalDirectBusiness / bangkokTargets.direct) * 100, 100),
        overall_progress: Math.min(((totalSelfInvestment / bangkokTargets.self + totalDirectBusiness / bangkokTargets.direct) / 2) * 100, 100),
        is_qualified: totalSelfInvestment >= bangkokTargets.self && totalDirectBusiness >= bangkokTargets.direct,
        status: totalSelfInvestment >= bangkokTargets.self && totalDirectBusiness >= bangkokTargets.direct ? "qualified" : "not_qualified",
        remaining_self_investment: Math.max(0, bangkokTargets.self - totalSelfInvestment),
        remaining_direct_business: Math.max(0, bangkokTargets.direct - totalDirectBusiness)
      };

      return {
        data: {
          user_summary: {
            total_self_investment: totalSelfInvestment,
            total_direct_business: totalDirectBusiness,
            direct_referrals_count: directReferrals.length
          },
          reward_progress: {
            goa_tour: goaProgress,
            bangkok_tour: bangkokProgress
          },
          direct_referrals: directReferrals.map(ref => ({
            username: ref.username,
            email: ref.email,
            totalInvestment: ref.total_investment || 0,
            joinDate: ref.createdAt
          })),
          qualified_rewards: [
            ...(goaProgress.is_qualified ? ['goa_tour'] : []),
            ...(bangkokProgress.is_qualified ? ['bangkok_tour'] : [])
          ]
        }
      };
    } catch (error) {
      console.error('❌ Error calculating reward status:', error);

      // Check if it's an authentication error
      if (error.response && error.response.status === 403) {
        console.error('🔒 Authentication failed - user may need to login');
        throw new Error('Authentication failed. Please login again.');
      }

      if (error.response && error.response.status === 401) {
        console.error('🔒 Unauthorized - token may be expired');
        throw new Error('Session expired. Please login again.');
      }

      if (error.message === 'User not authenticated') {
        throw error;
      }

      // Return default structure if API calls fail for other reasons
      console.warn('⚠️ Returning default reward structure due to API error');
      return {
        data: {
          user_summary: {
            total_self_investment: 0,
            total_direct_business: 0,
            direct_referrals_count: 0
          },
          reward_progress: {
            goa_tour: {
              name: "Goa Tour",
              self_invest_target: 1000,
              direct_business_target: 1500,
              current_self_investment: 0,
              current_direct_business: 0,
              self_investment_progress: 0,
              direct_business_progress: 0,
              overall_progress: 0,
              is_qualified: false,
              status: "not_qualified",
              remaining_self_investment: 1000,
              remaining_direct_business: 1500
            },
            bangkok_tour: {
              name: "Bangkok Tour",
              self_invest_target: 5000,
              direct_business_target: 10000,
              current_self_investment: 0,
              current_direct_business: 0,
              self_investment_progress: 0,
              direct_business_progress: 0,
              overall_progress: 0,
              is_qualified: false,
              status: "not_qualified",
              remaining_self_investment: 5000,
              remaining_direct_business: 10000
            }
          },
          direct_referrals: [],
          qualified_rewards: [],
          error: 'Failed to fetch data from server'
        }
      };
    }
  },

  // Get user's reward history
  getRewardHistory: async () => {
    try {
      const response = await api.get('/user/rewards/history');
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Reward history API not available:', error);
      return { data: [] };
    }
  },

  // Get reward leaderboard
  getLeaderboard: async (rewardType = '', limit = 50) => {
    try {
      const params = {};
      if (rewardType) params.reward_type = rewardType;
      if (limit) params.limit = limit;

      const response = await api.get('/user/rewards/leaderboard', { params });
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Leaderboard API not available:', error);
      return { data: [] };
    }
  },

  // Get reward targets and requirements
  getRewardTargets: async () => {
    try {
      const response = await api.get('/user/rewards/targets');
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Reward targets API not available:', error);
      return {
        data: {
          goa_tour: { self_target: 1000, direct_target: 1500 },
          bangkok_tour: { self_target: 5000, direct_target: 10000 }
        }
      };
    }
  },

  // Get user's direct referrals for reward calculation
  getDirectReferrals: async () => {
    try {
      const response = await api.get('/get-user-direct');
      return response.data || response;
    } catch (error) {
      console.warn('Direct referrals API error:', error);
      return { data: [] };
    }
  }
};

// Investment Services (for reward calculations)
export const investmentService = {
  // Get user's total investments
  getUserInvestments: async () => {
    try {
      const response = await api.get('/get-user-investments');
      return response.data || response;
    } catch (error) {
      console.warn('User investments API error:', error);
      return { data: [] };
    }
  },

  // Get user's direct team investments
  getDirectTeamInvestments: async () => {
    try {
      const response = await api.get('/get-user-direct');
      return response.data || response;
    } catch (error) {
      console.warn('Direct team investments API error:', error);
      return { data: [] };
    }
  }
};

// Utility functions
export const rewardUtils = {
  // Calculate progress percentage
  calculateProgress: (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  // Format date
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Get status color
  getStatusColor: (status) => {
    const colors = {
      qualified: 'green',
      approved: 'blue',
      processed: 'purple',
      completed: 'gray',
      pending: 'yellow',
      rejected: 'red'
    };
    return colors[status] || 'gray';
  },

  // Get reward type icon
  getRewardIcon: (rewardType) => {
    const icons = {
      goa_tour: '🏖️',
      bangkok_tour: '✈️'
    };
    return icons[rewardType] || '🎁';
  },

  // Calculate remaining amount needed
  calculateRemaining: (current, target) => {
    return Math.max(0, target - (current || 0));
  },

  // Check if user is qualified for reward
  isQualified: (selfInvestment, directBusiness, selfTarget, directTarget) => {
    return (selfInvestment >= selfTarget) && (directBusiness >= directTarget);
  }
};

// Error handling wrapper
export const withErrorHandling = (serviceFunction) => {
  return async (...args) => {
    try {
      return await serviceFunction(...args);
    } catch (error) {
      console.error('Service error:', error);
      
      // Handle specific error types
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        // Access denied
        throw new Error('You do not have permission to perform this action');
      }
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        // Resource not found
        throw new Error('The requested resource was not found');
      }
      
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        // Server error
        throw new Error('Server error. Please try again later');
      }
      
      // Network or other errors
      throw error;
    }
  };
};

// Export wrapped services with error handling
export const safeAdminRewardService = Object.keys(adminRewardService).reduce((acc, key) => {
  acc[key] = withErrorHandling(adminRewardService[key]);
  return acc;
}, {});

export const safeUserRewardService = Object.keys(userRewardService).reduce((acc, key) => {
  acc[key] = withErrorHandling(userRewardService[key]);
  return acc;
}, {});

export default {
  admin: safeAdminRewardService,
  user: safeUserRewardService,
  investment: investmentService,
  utils: rewardUtils
};
