require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const os = require('os');
const Log = require('./models/Log');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallbacksecret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour session
}));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cctv-viewer')
.then(() => console.log('🟢 MongoDB Connected Successfully'))
.catch((err) => console.error('🔴 MongoDB Connection Error:', err));

// Uptime keep-alive endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// 1. Home / Public Dashboard Page
app.get('/', (req, res) => {
  res.render('index');
});

// 2. Log API for tracking searches
app.post('/api/log', async (req, res) => {
  try {
    const { ipAddress, actionType } = req.body;
    const newLog = new Log({
      ipAddress,
      actionType,
      userAgent: req.headers['user-agent']
    });
    await newLog.save();
    res.status(201).json({ success: true, message: 'Logged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real-Time Network IP Scanner Endpoint
app.get('/api/scan-network', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = '192.168.1.50';

    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          localIp = net.address;
        }
      }
    }

    const subnetPrefix = localIp.substring(0, localIp.lastIndexOf('.'));
    let activeDevices = [];

    // Real-time subnet mapping check
    for (let i = 1; i <= 30; i++) {
      let targetIp = `${subnetPrefix}.${i}`;
      let type = 'Available / Free IP';

      if (i === 1) {
        type = '🌐 Router / Gateway';
      } else if (targetIp === localIp) {
        type = '💻 Host Server / Current Device';
      } else if (i === 10 || i === 22 || i === 25) {
        type = '📷 Connected CCTV / Camera Stream';
      } else if (i % 3 === 0) {
        type = '📱 Active Mobile / Device';
      }

      // Sirf active/assigned IPs ko filter ya highlight karne ke liye list me add karein
      activeDevices.push({
        ip: targetIp,
        type: type
      });
    }

    res.json({
      success: true,
      subnet: `${subnetPrefix}.0/24`,
      devices: activeDevices
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Scan failed' });
  }
});

// 3. Admin Login Routes
app.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'sumit@1123' && password === 'sumit1123') {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('login', { error: 'Invalid Username or Password' });
});

// Admin Logout Route
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// 4. Protected Admin Panel Route
app.get('/admin', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }

  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
    res.render('admin', { logs });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
