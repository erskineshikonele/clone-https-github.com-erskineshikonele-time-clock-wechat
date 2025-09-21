// Centralized API client
const app = getApp();

class TimeClockAPI {
  constructor() {
    this.baseURL = app.globalData.apiUrl;
    this.token = wx.getStorageSync('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    wx.setStorageSync('authToken', token);
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaults = {
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      timeout: 10000
    };

    const config = { ...defaults, ...options, url };

    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          ...config,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode >= 400) {
        throw new Error(`HTTP ${response.statusCode}: ${response.data?.message || 'Server error'}`);
      }

      return response.data;
    } catch (error) {
      // Handle token expiration
      if (error.message.includes('401')) {
        await app.logout();
        wx.navigateTo({ url: '/pages/login/login' });
      }
      throw error;
    }
  }

  // Authentication
  async login(code) {
    const response = await this.request('/auth/wechat-login', {
      method: 'POST',
      data: { code }
    });
    this.setToken(response.token);
    return response.user;
  }

  // Clock operations
  async createClockRecord(record) {
    return this.request('/clock/records', {
      method: 'POST',
      data: record
    });
  }

  async getClockRecords(params = {}) {
    return this.request('/clock/records', {
      method: 'GET',
      data: params
    });
  }

  async updateClockRecord(id, updates) {
    return this.request(`/clock/records/${id}`, {
      method: 'PATCH',
      data: updates
    });
  }

  async deleteClockRecord(id) {
    return this.request(`/clock/records/${id}`, {
      method: 'DELETE'
    });
  }

  // Timesheet operations
  async getTimesheetSummary(dateRange) {
    return this.request('/timesheet/summary', {
      method: 'GET',
      data: dateRange
    });
  }

  async exportTimesheet(format = 'csv', dateRange) {
    return this.request('/timesheet/export', {
      method: 'GET',
      data: { format, ...dateRange }
    });
  }

  // Admin operations
  async getTeamRecords(teamId, dateRange) {
    return this.request(`/admin/team/${teamId}/records`, {
      method: 'GET',
      data: dateRange
    });
  }

  async approveTimesheet(recordId) {
    return this.request(`/admin/timesheets/${recordId}/approve`, {
      method: 'POST'
    });
  }

  // User management
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(updates) {
    return this.request('/user/profile', {
      method: 'PATCH',
      data: updates
    });
  }

  // Reports
  async generateReport(type, params) {
    return this.request(`/reports/${type}`, {
      method: 'GET',
      data: params
    });
  }
}

// Export singleton instance
module.exports = new TimeClockAPI();
