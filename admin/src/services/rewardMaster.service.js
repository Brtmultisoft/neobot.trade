import ApiService from './api.service';

const BASE_URL = '/api/admin/reward-master';

function getAdminToken() {
  return localStorage.getItem('admin_token');
}

const RewardMasterService = {
  // Get all reward masters
  getAll: async () => {
    return ApiService.request({ method: 'GET', endpoint: `${BASE_URL}/get-all-reward-masters`, token: getAdminToken() });
  },

  // Get a single reward master by ID
  getById: async (id) => {
    return ApiService.request({ method: 'GET', endpoint: `${BASE_URL}/get-reward-master/${id}`, token: getAdminToken() });
  },

  // Create a new reward master
  create: async (data) => {
    return ApiService.request({ method: 'POST', endpoint: `${BASE_URL}/create-reward-master`, data, token: getAdminToken() });
  },

  // Update a reward master by ID
  update: async (id, data) => {
    return ApiService.request({ method: 'PUT', endpoint: `${BASE_URL}/update-reward-master/${id}`, data, token: getAdminToken() });
  },

  // Delete a reward master by ID
  delete: async (id) => {
    return ApiService.request({ method: 'DELETE', endpoint: `${BASE_URL}/delete-reward-master/${id}`, token: getAdminToken() });
  }
};

export default RewardMasterService; 