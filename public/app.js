/**
 * Roku Web Remote - Frontend Application
 * Manages UI state and user interactions
 */

class RokuRemoteApp {
  constructor() {
    this.currentDevice = null;
    this.autoRefreshInterval = null;
    this.initializeElements();
    this.attachEventListeners();
    this.loadSavedDevice();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      app: document.getElementById('app'),
      discoverBtn: document.getElementById('discoverBtn'),
      ipInput: document.getElementById('ipInput'),
      connectBtn: document.getElementById('connectBtn'),
      discoveryModal: document.getElementById('discoveryModal'),
      closeDiscoveryBtn: document.getElementById('closeDiscoveryBtn'),
      devicesList: document.getElementById('devicesList'),
      mainContent: document.getElementById('mainContent'),
      emptyState: document.getElementById('emptyState'),
      status: document.getElementById('status'),
      statusText: document.getElementById('statusText'),
      deviceName: document.getElementById('deviceName'),
      deviceIp: document.getElementById('deviceIp'),
      activeAppName: document.getElementById('activeAppName'),
      textInput: document.getElementById('textInput'),
      sendTextBtn: document.getElementById('sendTextBtn'),
      appsList: document.getElementById('appsList')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Connection buttons
    this.elements.discoverBtn.addEventListener('click', () => this.discover());
    this.elements.connectBtn.addEventListener('click', () => this.connect());
    this.elements.ipInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.connect();
    });

    // Discovery modal
    this.elements.closeDiscoveryBtn.addEventListener('click', () => this.closeDiscovery());
    this.elements.discoveryModal.addEventListener('click', (e) => {
      if (e.target === this.elements.discoveryModal) this.closeDiscovery();
    });

    // Text input
    this.elements.sendTextBtn.addEventListener('click', () => this.sendText());
    this.elements.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendText();
    });

    // Remote control buttons
    document.querySelectorAll('[data-key]').forEach(btn => {
      btn.addEventListener('click', () => this.sendKey(btn.dataset.key));
    });
  }

  /**
   * Load saved device from localStorage
   */
  loadSavedDevice() {
    const saved = localStorage.getItem('roku_device_ip');
    if (saved) {
      this.elements.ipInput.value = saved;
      // Auto-connect if we have a saved device
      setTimeout(() => this.connect(), 500);
    }
  }

  /**
   * Discover devices on network
   */
  async discover() {
    this.showStatus('Searching for Roku devices...', 'info');
    this.elements.discoverBtn.disabled = true;

    try {
      const devices = await roku.discoverDevices();
      
      if (devices.length === 0) {
        this.showStatus('No Roku devices found. Try entering IP manually.', 'error');
        return;
      }

      this.displayDiscoveryResults(devices);
      this.showStatus(`Found ${devices.length} device(s)`, 'success');
    } catch (error) {
      this.showStatus(`Discovery failed: ${error.message}`, 'error');
    } finally {
      this.elements.discoverBtn.disabled = false;
    }
  }

  /**
   * Display discovered devices in modal
   */
  displayDiscoveryResults(devices) {
    this.elements.devicesList.innerHTML = devices.map(device => `
      <div class="device-item">
        <div class="device-info">
          <strong>${device.name || 'Roku Device'}</strong>
          <p>${device.ip}:${device.port || 8060}</p>
        </div>
        <button class="btn btn-small" onclick="app.selectDevice('${device.ip}')">Connect</button>
      </div>
    `).join('');
    
    this.elements.discoveryModal.style.display = 'flex';
  }

  /**
   * Select device from discovery list
   */
  selectDevice(ip) {
    this.elements.ipInput.value = ip;
    this.closeDiscovery();
    this.connect();
  }

  /**
   * Close discovery modal
   */
  closeDiscovery() {
    this.elements.discoveryModal.style.display = 'none';
  }

  /**
   * Connect to device
   */
  async connect() {
    const ip = this.elements.ipInput.value.trim();
    
    if (!ip) {
      this.showStatus('Please enter a Roku IP address', 'error');
      return;
    }

    this.showStatus('Connecting...', 'info');
    this.elements.connectBtn.disabled = true;

    try {
      this.currentDevice = await roku.connectDevice(ip);
      localStorage.setItem('roku_device_ip', ip);
      
      this.showStatus('Connected!', 'success');
      this.updateUI();
      this.startAutoRefresh();
    } catch (error) {
      this.showStatus(`Connection failed: ${error.message}`, 'error');
      this.currentDevice = null;
    } finally {
      this.elements.connectBtn.disabled = false;
    }
  }

  /**
   * Update UI to show device is connected
   */
  updateUI() {
    const ip = this.elements.ipInput.value.trim();
    
    // Show main content, hide empty state
    this.elements.mainContent.style.display = 'block';
    this.elements.emptyState.style.display = 'none';

    // Update device info
    this.elements.deviceIp.textContent = ip;
    if (this.currentDevice && this.currentDevice['device-id']) {
      this.elements.deviceName.textContent = this.currentDevice['friendly-device-name'] || 'Roku Device';
    }

    // Refresh apps and active app
    this.refreshApps();
    this.refreshActiveApp();
  }

  /**
   * Refresh apps list
   */
  async refreshApps() {
    try {
      const ip = this.elements.ipInput.value.trim();
      const apps = await roku.getApps(ip);
      
      if (apps.length === 0) {
        this.elements.appsList.innerHTML = '<p class="secondary-text">No apps found</p>';
        return;
      }

      this.elements.appsList.innerHTML = apps.map(app => `
        <div class="app-item">
          <div class="app-info">
            <strong>${app.name || app.id}</strong>
            <p class="secondary-text">${app.type || 'App'}</p>
          </div>
          <button class="btn btn-small" onclick="app.launchApp('${app.id}')">Launch</button>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error refreshing apps:', error);
    }
  }

  /**
   * Refresh active app
   */
  async refreshActiveApp() {
    try {
      const ip = this.elements.ipInput.value.trim();
      const active = await roku.getActiveApp(ip);
      
      if (active) {
        this.elements.activeAppName.textContent = active.name || 'Unknown';
      } else {
        this.elements.activeAppName.textContent = 'Home Screen';
      }
    } catch (error) {
      console.error('Error refreshing active app:', error);
    }
  }

  /**
   * Send a key command
   */
  async sendKey(key) {
    try {
      const ip = this.elements.ipInput.value.trim();
      await roku.keypress(ip, key);
      // Visual feedback
      event.target.classList.add('active');
      setTimeout(() => event.target.classList.remove('active'), 100);
    } catch (error) {
      console.error('Error sending key:', error);
      this.showStatus(`Key error: ${error.message}`, 'error');
    }
  }

  /**
   * Send text to device
   */
  async sendText() {
    const text = this.elements.textInput.value.trim();
    
    if (!text) {
      this.showStatus('Please enter text', 'error');
      return;
    }

    try {
      const ip = this.elements.ipInput.value.trim();
      await roku.sendText(ip, text);
      this.showStatus('Text sent!', 'success');
      this.elements.textInput.value = '';
    } catch (error) {
      console.error('Error sending text:', error);
      this.showStatus(`Send error: ${error.message}`, 'error');
    }
  }

  /**
   * Launch an app
   */
  async launchApp(appId) {
    try {
      const ip = this.elements.ipInput.value.trim();
      await roku.launchApp(ip, appId);
      this.showStatus('App launching...', 'success');
      // Refresh active app after a delay
      setTimeout(() => this.refreshActiveApp(), 1000);
    } catch (error) {
      console.error('Error launching app:', error);
      this.showStatus(`Launch error: ${error.message}`, 'error');
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    this.elements.status.style.display = 'block';
    this.elements.status.className = `status-bar status-${type}`;
    this.elements.statusText.textContent = message;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.elements.status.style.display = 'none';
    }, 3000);
  }

  /**
   * Start auto-refresh of device state
   */
  startAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    // Refresh active app every 5 seconds
    this.autoRefreshInterval = setInterval(() => {
      this.refreshActiveApp();
    }, 5000);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new RokuRemoteApp();
});
