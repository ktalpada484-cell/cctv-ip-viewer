require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const Log = require('./models/Log');

const app = express();
const PORT = process.env.PORT || 3000;

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
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('🟢 MongoDB Connected Successfully'))
.catch((err) => console.error('🔴 MongoDB Connection Error:', err));

// Uptime keep-alive endpoint (Render sleep prevention)
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

