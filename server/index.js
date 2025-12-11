import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RokuService } from './services/RokuService.js';
import { DeviceDiscovery } from './services/DeviceDiscovery.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:*').split(',');
    
    if (!origin || allowedOrigins.some(ao => {
      if (ao.includes('*')) {
        const pattern = ao.replace(/\./g, '\\.').replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return ao === origin;
    })) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Services
const rokuService = new RokuService();
const deviceDiscovery = new DeviceDiscovery();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Device Discovery
app.get('/api/devices/discover', async (req, res) => {
  try {
    const timeout = parseInt(req.query.timeout || process.env.DISCOVERY_TIMEOUT || 5000);
    const devices = await deviceDiscovery.discover(timeout);
    res.json({ success: true, devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Device Info
app.get('/api/device/:ip/info', async (req, res) => {
  try {
    const { ip } = req.params;
    const info = await rokuService.getDeviceInfo(ip);
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List Apps
app.get('/api/device/:ip/apps', async (req, res) => {
  try {
    const { ip } = req.params;
    const apps = await rokuService.getApps(ip);
    res.json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Active App
app.get('/api/device/:ip/active', async (req, res) => {
  try {
    const { ip } = req.params;
    const active = await rokuService.getActiveApp(ip);
    res.json({ success: true, data: active });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send Keypress
app.post('/api/device/:ip/keypress', async (req, res) => {
  try {
    const { ip } = req.params;
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ success: false, error: 'Key is required' });
    }
    
    await rokuService.keypress(ip, key);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send Text
app.post('/api/device/:ip/text', async (req, res) => {
  try {
    const { ip } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }
    
    await rokuService.text(ip, text);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Launch App
app.post('/api/device/:ip/launch', async (req, res) => {
  try {
    const { ip } = req.params;
    const { appId } = req.body;
    
    if (!appId) {
      return res.status(400).json({ success: false, error: 'appId is required' });
    }
    
    await rokuService.launch(ip, appId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Media Player State
app.get('/api/device/:ip/media', async (req, res) => {
  try {
    const { ip } = req.params;
    const media = await rokuService.getMediaPlayer(ip);
    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
  });
});

app.listen(port, () => {
  console.log(`🎮 Roku Web Remote server running on http://localhost:${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
  console.log(`🌐 Frontend available at http://localhost:${port}`);
});
