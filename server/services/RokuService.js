import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export class RokuService {
  constructor() {
    this.timeout = 5000;
  }

  /**
   * Get device information
   */
  async getDeviceInfo(ip) {
    const url = this._buildUrl(ip, '/query/device-info');
    return this._makeRequest('GET', url);
  }

  /**
   * Get list of installed apps
   */
  async getApps(ip) {
    const url = this._buildUrl(ip, '/query/apps');
    const xml = await this._makeRequest('GET', url);
    return this._parseAppsXml(xml);
  }

  /**
   * Get currently active app
   */
  async getActiveApp(ip) {
    const url = this._buildUrl(ip, '/query/active-app');
    const xml = await this._makeRequest('GET', url);
    return this._parseActiveAppXml(xml);
  }

  /**
   * Send a keypress to the device
   */
  async keypress(ip, key) {
    const url = this._buildUrl(ip, `/keypress/${key}`);
    return this._makeRequest('POST', url, '');
  }

  /**
   * Send text to the device (character by character keypresses)
   */
  async text(ip, text) {
    // For now, we'll send the text as a single payload
    // Roku should accept URL-encoded characters
    const encodedText = encodeURIComponent(text);
    const url = this._buildUrl(ip, '/keypress/Lit_' + encodedText);
    return this._makeRequest('POST', url, '');
  }

  /**
   * Launch an app
   */
  async launch(ip, appId) {
    const url = this._buildUrl(ip, `/launch/${appId}`);
    return this._makeRequest('POST', url, '');
  }

  /**
   * Get media player state
   */
  async getMediaPlayer(ip) {
    const url = this._buildUrl(ip, '/query/media-search');
    try {
      const xml = await this._makeRequest('GET', url);
      return this._parseMediaXml(xml);
    } catch (error) {
      // Media player endpoint may not be available on all devices
      return { available: false, error: error.message };
    }
  }

  /**
   * Build Roku API URL
   */
  _buildUrl(ip, endpoint) {
    // Handle IP with or without port
    const baseUrl = ip.includes(':') ? ip : `${ip}:8060`;
    return `http://${baseUrl}${endpoint}`;
  }

  /**
   * Make HTTP request with error handling
   */
  async _makeRequest(method, url, data = null) {
    try {
      const config = {
        method,
        url,
        timeout: this.timeout,
        validateStatus: () => true // Don't throw on any status
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);

      if (response.status >= 400) {
        throw new Error(`Roku API error: ${response.status} ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Roku device at ${url}. Check IP address and that device is powered on.`);
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        throw new Error(`Connection timeout to Roku device. Check network connectivity.`);
      }
      throw error;
    }
  }

  /**
   * Parse apps XML response
   */
  async _parseAppsXml(xml) {
    try {
      const parsed = await parseStringPromise(xml);
      const apps = parsed.apps?.app || [];
      
      return Array.isArray(apps) ? apps.map(app => ({
        id: app.$.id,
        name: app.$['version'] || app._,
        type: app.$.type,
        version: app.$.version
      })) : [];
    } catch (error) {
      console.error('Error parsing apps XML:', error);
      return [];
    }
  }

  /**
   * Parse active app XML response
   */
  async _parseActiveAppXml(xml) {
    try {
      const parsed = await parseStringPromise(xml);
      const app = parsed['active-app']?.app?.[0];
      
      if (!app) {
        return null; // Home screen active
      }

      return {
        id: app.$.id,
        name: app._,
        type: app.$.type,
        version: app.$.version
      };
    } catch (error) {
      console.error('Error parsing active app XML:', error);
      return null;
    }
  }

  /**
   * Parse media player XML response
   */
  async _parseMediaXml(xml) {
    try {
      const parsed = await parseStringPromise(xml);
      return parsed || { available: false };
    } catch (error) {
      console.error('Error parsing media XML:', error);
      return { available: false };
    }
  }
}
