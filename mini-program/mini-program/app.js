// app.js - Enhanced with authentication and error handling
App({
  onLaunch() {
    console.log('TimeClock App Launched');
    this.initApp();
  },

  onShow(options) {
    // Handle app show from different scenarios
    if (options.query && options.query.scene) {
      this.handleDeepLink(options.query);
    }
  },

  onHide() {
    console.log('App hidden');
  },

  globalData: {
    userInfo: null,
    userRole: 'employee', // 'employee', 'manager', 'admin'
    isAuthenticated: false,
    currentStatus: 'out',
    clockRecords: [],
    apiUrl: 'https://your-api.com/api/v1',
    appVersion: '1.0.0'
  },

  // Initialize application
  async initApp() {
    try {
      await this.checkAuthStatus();
      await this.loadUserData();
      this.registerPushMessage();
    } catch (error) {
      console.error('App init failed:', error);
      wx.showToast({
        title: 'Initialization failed',
        icon: 'error'
      });
    }
  },

  // Authentication
  async checkAuthStatus() {
    const token = wx.getStorageSync('authToken');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.isAuthenticated = true;
      this.globalData.userInfo = userInfo;
      this.globalData.userRole = userInfo.role || 'employee';
      
      // Verify token validity
      const isValid = await this.verifyToken(token);
      if (!isValid) {
        await this.logout();
      }
    }
  },

  // WeChat Login
  async login() {
    try {
      const { code } = await this.getLoginCode();
      const userData = await this.exchangeCodeForToken(code);
      
      this.globalData.userInfo = userData;
      this.globalData.isAuthenticated = true;
      this.globalData.userRole = userData.role || 'employee';
      
      wx.setStorageSync('authToken', userData.token);
      wx.setStorageSync('userInfo', userData);
      
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Authentication failed');
    }
  },

  // Get WeChat login code
  getLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject,
        timeout: 10000
      });
    });
  },

  // Exchange code for user data (backend call)
  async exchangeCodeForToken(code) {
    const response = await this.request({
      url: '/auth/wechat-login',
      method: 'POST',
      data: { code }
    });
    return response.data;
  },

  // Verify token
  async verifyToken(token) {
    try {
      const response = await this.request({
        url: '/auth/verify',
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      });
      return response.statusCode === 200;
    } catch {
      return false;
    }
  },

  // Logout
  async logout() {
    this.globalData.isAuthenticated = false;
    this.globalData.userInfo = null;
    this.globalData.userRole = 'employee';
    
    wx.removeStorageSync('authToken');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('clockRecords');
    
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // Load user data
  async loadUserData() {
    try {
      const records = await this.getClockRecords();
      const status = wx.getStorageSync('currentStatus') || 'out';
      
      this.globalData.clockRecords = records;
      this.globalData.currentStatus = status;
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  },

  // Clock operations
  async clockAction() {
    if (!this.globalData.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const status = this.globalData.currentStatus;
    const action = status === 'out' ? 'clock_in' : 'clock_out';
    
    try {
      const record = await this.createClockRecord(action);
      
      // Update local state
      this.globalData.clockRecords.unshift(record);
      this.globalData.currentStatus = action === 'clock_in' ? 'in' : 'out';
      
      // Persist to storage
      wx.setStorageSync('clockRecords', this.globalData.clockRecords);
      wx.setStorageSync('currentStatus', this.globalData.currentStatus);
      
      // Show success feedback
      wx.showToast({
        title: action === 'clock_in' ? 'Clocked In Successfully' : 'Clocked Out Successfully',
        icon: 'success',
        duration: 2000
      });

      return record;
    } catch (error) {
      console.error('Clock action failed:', error);
      wx.showToast({
        title: 'Operation failed',
        icon: 'error'
      });
      throw error;
    }
  },

  // Create clock record (API call)
  async createClockRecord(action) {
    const location = await this.getCurrentLocation();
    
    const record = {
      action,
      timestamp: Date.now(),
      date: this.formatDate(Date.now()),
      location,
      userId: this.globalData.userInfo.id
    };

    // Save to backend
    const response = await this.request({
      url: '/clock/records',
      method: 'POST',
      data: record,
      header: { Authorization: `Bearer ${wx.getStorageSync('authToken')}` }
    });

    return { ...record, id: response.data.id };
  },

  // Get clock records
  async getClockRecords(options = {}) {
    const params = {
      ...options,
      userId: this.globalData.userInfo.id
    };

    const response = await this.request({
      url: '/clock/records',
      method: 'GET',
      data: params,
      header: { Authorization: `Bearer ${wx.getStorageSync('authToken')}` }
    });

    return response.data.records || [];
  },

  // Get current location
  async getCurrentLocation() {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'wgs84',
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy
          });
        },
        fail: () => {
          resolve(null);
        }
      });
    });
  },

  // Utility functions
  formatDate(timestamp) {
    return new Date(timestamp).toISOString().split('T')[0];
  },

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  },

  // Calculate worked hours
  calculateWorkedHours(records) {
    let totalMinutes = 0;
    for (let i = 0; i < records.length - 1; i += 2) {
      if (records[i]?.action === 'clock_in' && records[i + 1]?.action === 'clock_out') {
        const inTime = new Date(records[i].timestamp);
        const outTime = new Date(records[i + 1].timestamp);
        totalMinutes += (outTime - inTime) / (1000 * 60);
      }
    }
    return Math.round(totalMinutes / 60 * 100) / 100;
  },

  // HTTP Request wrapper
  async request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || 'Request failed'}`));
          }
        },
        fail: reject,
        timeout: options.timeout || 10000
      });
    });
  },

  // Push notifications
  registerPushMessage() {
    if (wx.onPushMessage) {
      wx.onPushMessage((res) => {
        if (res.type === 'clock_reminder') {
          wx.showModal({
            title: 'Clock Reminder',
            content: 'Time to clock in/out!',
            confirmText: 'Clock Now',
            success: () => {
              wx.switchTab({ url: '/pages/index/index' });
            }
          });
        }
      });
    }
  },

  // Deep link handling
  handleDeepLink(query) {
    if (query.action === 'clock') {
      wx.switchTab({ url: '/pages/index/index' });
    } else if (query.action === 'timesheet') {
      wx.switchTab({ url: '/pages/timesheet/timesheet' });
    }
  }
});
