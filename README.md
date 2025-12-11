# 🎮 Roku Web Remote

**A production-grade web-based Roku remote control system that works directly in your browser.**

![GitHub License](https://img.shields.io/badge/license-MIT-green)
![Node Version](https://img.shields.io/badge/node-10+-blue)
![Platform](https://img.shields.io/badge/platform-Web-brightgreen)

---

## Why This Project?

The original `node-roku-client` library had limitations for browser-based usage:

❌ **CORS Issues** - Roku devices don't set CORS headers, making direct browser requests impossible  
❌ **No UDP** - Browsers can't send UDP packets needed for SSDP discovery  
❌ **XML Parsing** - `xml2js` doesn't work in browsers  

✅ **This project solves it all** by using:
- Lightweight Node.js backend as CORS proxy
- mDNS device discovery on backend
- Modern ES6+ frontend with no dependencies
- Real-time device state updates
- Responsive mobile-first design

---

## Features

### 🎯 Core Functionality
- ✅ **Device Discovery** - Automatically find Roku devices on your network
- ✅ **Full Remote Control** - D-pad, volume, power, apps, playback controls
- ✅ **Text Input** - Send text directly to searchable fields
- ✅ **App Management** - View installed apps and launch them
- ✅ **Live Status** - See active app and device info in real-time
- ✅ **Persistent Connections** - Remember your last device

### 🛠 Technical Features
- Responsive design (desktop, tablet, mobile)
- Dark mode support (automatic OS preference)
- No external dependencies in frontend (vanilla JS)
- Error handling and status messages
- Auto-refresh of device state (5s polling)
- Lightweight backend (~4KB minified)

---

## Quick Start

### Prerequisites
- Node.js 10+
- Roku device on same network
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone or download the repository
git clone https://github.com/tillbob/roku-web-remote.git
cd roku-web-remote

# Install dependencies
npm install

# Create .env file (optional, uses defaults)
cp .env.example .env

# Start the server
npm start
```

Server will run on `http://localhost:3000`

### Usage

1. **Open browser** → `http://localhost:3000`
2. **Discover devices** → Click "🔍 Discover" button
3. **Select device** → Click "Connect"
4. **Control** → Use remote buttons or text input

### Manual Connection

If auto-discovery doesn't work:
1. Find your Roku IP (Settings → Network → IP address)
2. Enter IP in the input field (e.g., `192.168.1.100`)
3. Click "Connect"

---

## API Endpoints

### Device Discovery
```
GET /api/devices/discover?timeout=5000
```
Discover Roku devices on network. Returns array of devices with IP, name, port.

### Device Info
```
GET /api/device/:ip/info
```
Get device information (model, serial, friendly name, etc.)

### Apps
```
GET /api/device/:ip/apps
```
List all installed apps.

### Active App
```
GET /api/device/:ip/active
```
Get currently running app (null if home screen).

### Send Key
```
POST /api/device/:ip/keypress
Body: { "key": "Home" }
```
Send a key press. Valid keys:
- Navigation: `Up`, `Down`, `Left`, `Right`, `Select`
- Media: `Home`, `Back`, `Enter`, `Info`
- Playback: `Play`, `Pause`, `Fwd`, `Rev`
- Volume: `VolumeUp`, `VolumeDown`, `VolumeMute`
- Power: `Power`

### Send Text
```
POST /api/device/:ip/text
Body: { "text": "Breaking Bad" }
```
Send text to device (for search fields, etc.).

### Launch App
```
POST /api/device/:ip/launch
Body: { "appId": "12" }
```
Launch an app by ID.

### Media Status
```
GET /api/device/:ip/media
```
Get current media player state (if available).

---

## Architecture

### Backend (Node.js + Express)

```
server/
├── index.js                 # Express app & routes
└── services/
    ├── RokuService.js       # ECP protocol implementation
    └── DeviceDiscovery.js   # mDNS device discovery
```

**Key Design Decisions:**
- **Express** - Lightweight HTTP framework for CORS proxy
- **Axios** - Promise-based HTTP client with timeout support
- **multicast-dns** - Pure JS mDNS implementation (no external tools needed)
- **xml2js** - Parses Roku XML responses

### Frontend (Vanilla JavaScript)

```
public/
├── index.html       # Semantic HTML structure
├── api.js           # API client (fetch wrapper)
├── app.js           # Application logic & UI state
└── styles.css       # Responsive design with dark mode
```

**Key Design Decisions:**
- **Zero dependencies** - Pure ES6+ JavaScript
- **Fetch API** - Native HTTP client
- **LocalStorage** - Persist last device IP
- **CSS Variables** - Easy theming & dark mode

---

## Configuration

### Environment Variables

Create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# CORS (wildcard patterns supported)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://192.168.*

# Discovery
DISCOVERY_TIMEOUT=5000
MAX_DISCOVERY_DEVICES=10
```

### Advanced Usage

#### Custom Backend URL

If running frontend and backend on different hosts:

```javascript
// In app.js, change:
const roku = new RokuAPI('http://your-server:3000');
```

#### Production Deployment

```bash
# Build
NODE_ENV=production npm install

# Run
NODE_ENV=production npm start
```

For hosting, ensure:
- Backend accessible from frontend origin
- Port 3000 exposed (or configure with PORT env var)
- Roku device accessible from server network

---

## Comparison: Old vs New

| Feature | node-roku-client | Roku Web Remote |
|---------|------------------|------------------|
| **Browser Support** | ❌ Node only | ✅ All modern browsers |
| **CORS Handling** | ❌ No solution | ✅ Backend proxy |
| **Device Discovery** | ⚠️ Node.js only | ✅ Works in browser |
| **UI** | ❌ None | ✅ Full remote interface |
| **Frontend Deps** | N/A | ✅ Zero dependencies |
| **Mobile Friendly** | ❌ No | ✅ Responsive design |
| **Live Status** | ❌ Manual polling | ✅ Auto-refresh |
| **Ease of Use** | ⚠️ Programmatic | ✅ Web interface |

---

## Troubleshooting

### "Cannot connect to Roku device"

1. Verify device is **powered on**
2. Check **IP address** is correct (Settings → Network → IP address)
3. Ensure **same network** (not on VPN)
4. Try adding `:8060` to IP (e.g., `192.168.1.100:8060`)
5. Restart device: Hold power button 30+ seconds

### Discovery not finding devices

1. Check **mDNS enabled** on router (usually default)
2. Verify **firewall** allows mDNS (port 5353 UDP)
3. Try **manual IP entry** instead
4. Look for Roku IP: Settings → Network → IP address

### Text input not working

- Current implementation uses URL encoding. For special characters, try:
  - Navigate to search field first
  - Then send text
  - Some apps don't support text input via ECP

### Dark mode not applying

- Check OS preferences (Settings → Display)
- Or force in DevTools: `document.documentElement.style.colorScheme = 'dark'`

---

## Development

### Running in Development Mode

```bash
# Terminal 1 - Backend with auto-reload
npm run dev

# Terminal 2 - Frontend development server (optional)
python -m http.server 8000  # or any simple server
```

### Testing

```javascript
// Test in browser console
await roku.discoverDevices();
await roku.connectDevice('192.168.1.100');
await roku.keypress('192.168.1.100', 'Home');
```

### Adding New Features

1. **Add backend API**: `server/index.js` + `RokuService.js`
2. **Add client method**: `public/api.js`
3. **Update UI**: `public/app.js` + `public/index.html`
4. **Style**: `public/styles.css`

Example: Adding Search Command

```javascript
// RokuService.js
async search(ip, query) {
  const url = this._buildUrl(ip, `/search/browse?query=${encodeURIComponent(query)}`);
  return this._makeRequest('POST', url, '');
}

// api.js
async search(ip, query) {
  return this.request(`/device/${ip}/search`, {
    method: 'POST',
    body: JSON.stringify({ query })
  });
}

// app.js
async performSearch(query) {
  await roku.search(this.elements.ipInput.value, query);
}
```

---

## Roku ECP Reference

- **Official Docs**: https://developer.roku.com/docs/developer-program/dev-tools/external-control-api.md
- **Port**: 8060 (HTTP, no HTTPS)
- **Protocol**: REST API with XML responses
- **Authentication**: None (local network only)

---

## Security Notes

⚠️ **Local Network Only**
- Roku devices don't authenticate - any device on network can control them
- Never expose this service to the internet
- Use firewall to restrict access

✅ **Safe Practices**
- Keep backend on internal network only
- Use VPN if accessing remotely
- Consider IP whitelisting in production

---

## Contributing

Contributions welcome! Areas of interest:

- Additional Roku models/compatibility testing
- Extended app management features
- Custom macro recording
- Multi-device control
- Performance optimizations
- Translation support

---

## License

MIT License - Free for personal and commercial use

---

## Acknowledgments

Built on top of:
- Roku's External Control Protocol (ECP)
- Original `node-roku-client` by bschlenk (inspiration)
- Modern JavaScript practices and standards

---

## Support

For issues, questions, or ideas:
1. Check **Troubleshooting** section above
2. Review **API Endpoints** documentation
3. Test with browser DevTools (F12) console
4. Check server logs: `npm start` output

---

**Made with ❤️ for Roku enthusiasts**
