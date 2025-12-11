/**
 * Roku Web Remote - Browser API Client
 * Handles all communication with the backend server
 */

class RokuAPI {
  constructor(baseUrl = '') {
    // Auto-detect base URL if not in same origin
    this.baseUrl = baseUrl || this._detectBaseUrl();
    this.currentDevice = null;
  }

  _detectBaseUrl() {
    // If running on same server, use relative paths
    if (typeof window !== 'undefined' && window.location.port === '3000') {
      return 'http://localhost:3000';
    }
    return '';
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Discover Roku devices on network
   */
  async discoverDevices(timeout = 5000) {
    try {
      const response = await this.request(`/devices/discover?timeout=${timeout}`);
      return response.devices || [];
    } catch (error) {
      console.error('Discovery error:', error);
      return [];
    }
  }

  /**
   * Connect to a Roku device
   */
  async connectDevice(ip) {
    try {
      const response = await this.request(`/device/${ip}/info`);
      if (response.success && response.data) {
        this.currentDevice = { ip, ...response.data };
        return this.currentDevice;
      }
      throw new Error('Failed to connect to device');
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(ip) {
    const response = await this.request(`/device/${ip}/info`);
    return response.data;
  }

  /**
   * Get list of installed apps
   */
  async getApps(ip) {
    const response = await this.request(`/device/${ip}/apps`);
    return response.data || [];
  }

  /**
   * Get currently active app
   */
  async getActiveApp(ip) {
    try {
      const response = await this.request(`/device/${ip}/active`);
      return response.data;
    } catch (error) {
      console.error('Error getting active app:', error);
      return null;
    }
  }

  /**
   * Send keypress to device
   */
  async keypress(ip, key) {
    return this.request(`/device/${ip}/keypress`, {
      method: 'POST',
      body: JSON.stringify({ key })
    });
  }

  /**
   * Send text to device
   */
  async sendText(ip, text) {
    return this.request(`/device/${ip}/text`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  /**
   * Launch an app
   */
  async launchApp(ip, appId) {
    return this.request(`/device/${ip}/launch`, {
      method: 'POST',
      body: JSON.stringify({ appId })
    });
  }

  /**
   * Get media player state
   */
  async getMediaPlayer(ip) {
    try {
      const response = await this.request(`/device/${ip}/media`);
      return response.data;
    } catch (error) {
      console.error('Error getting media state:', error);
      return null;
    }
  }
}

// Create global API instance
const roku = new RokuAPI();
