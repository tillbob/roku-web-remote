import mdns from 'multicast-dns';

export class DeviceDiscovery {
  constructor() {
    this.discoveredDevices = new Map();
    this.maxDevices = parseInt(process.env.MAX_DISCOVERY_DEVICES || 10);
  }

  /**
   * Discover Roku devices on the network using mDNS
   */
  async discover(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const discoveredMap = new Map();
      const mDns = mdns();

      const timer = setTimeout(() => {
        mDns.destroy();
        const devices = Array.from(discoveredMap.values())
          .slice(0, this.maxDevices)
          .map(device => this._normalizeDevice(device));
        resolve(devices);
      }, timeout);

      // Listen for mDNS responses
      mDns.on('response', (response) => {
        if (discoveredMap.size >= this.maxDevices) {
          clearTimeout(timer);
          mDns.destroy();
          const devices = Array.from(discoveredMap.values())
            .map(device => this._normalizeDevice(device));
          resolve(devices);
          return;
        }

        // Look for Roku devices (check for roku service or specific records)
        this._processResponse(response, discoveredMap);
      });

      mDns.on('error', (error) => {
        clearTimeout(timer);
        mDns.destroy();
        // Don't reject, just return what we found
        const devices = Array.from(discoveredMap.values())
          .map(device => this._normalizeDevice(device));
        resolve(devices.length > 0 ? devices : []);
      });

      // Query for Roku devices
      mDns.query({
        questions: [
          { type: 'PTR', name: '_ecp-server._tcp.local' },
          { type: 'PTR', name: '_http._tcp.local' }
        ]
      });
    });
  }

  /**
   * Process mDNS response for Roku devices
   */
  _processResponse(response, discoveredMap) {
    const allRecords = [
      ...(response.answers || []),
      ...(response.additionals || [])
    ];

    allRecords.forEach(record => {
      // Look for Roku-specific service records
      if (record.name && record.name.includes('Roku')) {
        // Extract device info from the record
        const device = this._extractDeviceInfo(record, allRecords);
        if (device && device.ip) {
          discoveredMap.set(device.ip, device);
        }
      }

      // Also look for A records (IP addresses) that might be Roku devices
      if (record.type === 'A' && record.data) {
        const device = {
          name: record.name,
          ip: record.data,
          port: 8060,
          type: 'roku'
        };
        // Heuristic: if it looks like it could be a Roku device, add it
        if (!discoveredMap.has(device.ip)) {
          discoveredMap.set(device.ip, device);
        }
      }
    });
  }

  /**
   * Extract device information from mDNS records
   */
  _extractDeviceInfo(record, allRecords) {
    const device = {
      name: record.name,
      type: 'roku',
      port: 8060
    };

    // Try to find corresponding A record for IP
    const aRecord = allRecords.find(r => 
      r.type === 'A' && 
      r.name === record.name
    );

    if (aRecord) {
      device.ip = aRecord.data;
    }

    // Try to extract device name from TXT records
    const txtRecord = allRecords.find(r => 
      r.type === 'TXT' && 
      r.name === record.name
    );

    if (txtRecord && txtRecord.data) {
      device.text = txtRecord.data;
    }

    return device.ip ? device : null;
  }

  /**
   * Normalize device object for API response
   */
  _normalizeDevice(device) {
    return {
      ip: device.ip,
      name: device.name || 'Unknown Roku Device',
      port: device.port || 8060,
      type: device.type || 'roku',
      url: `http://${device.ip}:${device.port || 8060}`
    };
  }
}
