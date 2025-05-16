// server.js
const express = require('express');               // CommonJS modules :contentReference[oaicite:7]{index=7}
const fs = require('fs');                         // Node file‑system API :contentReference[oaicite:8]{index=8}
const cors = require('cors');                     // CORS middleware :contentReference[oaicite:9]{index=9}
const path = require('path');                     // Path utilities :contentReference[oaicite:10]{index=10}

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────
// Enable CORS for all routes :contentReference[oaicite:11]{index=11}
app.use(cors());

// Parse JSON bodies (built‑in in Express 4.16+) :contentReference[oaicite:12]{index=12}
app.use(express.json());

// Serve static assets from /assets :contentReference[oaicite:13]{index=13}
app.use(express.static('assets'));


// ── HTML Routes ─────────────────────────────────────────────────────
// Serve homepage
app.get(['/', '/index.html'], (req, res, next) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve signup & about
app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});
app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});


// ── Credentials API ─────────────────────────────────────────────────
// Read users
app.get('/credentials', (req, res, next) => {
  fs.readFile(path.join('assets', 'scripts', 'credentials.json'), 'utf8', (err, data) => {
    if (err) return next(err);
    res.json(JSON.parse(data));
  });
});

// Add user
app.post('/credentials', (req, res, next) => {
  const newUser = req.body;
  newUser.ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;  // modern IP lookup :contentReference[oaicite:14]{index=14}

  fs.readFile(path.join('assets','scripts','credentials.json'), 'utf8', (err, data) => {
    if (err) return next(err);
    const users = JSON.parse(data);
    if (users.some(u => u.soldierName === newUser.soldierName)) {
      return res.status(400).send('Soldier name already in use');
    }
    users.push(newUser);
    fs.writeFile(path.join('assets','scripts','credentials.json'), JSON.stringify(users, null, 2), err => {
      if (err) return next(err);
      res.status(201).send('User created');
    });
  });
});


// ── Tracking Endpoint ────────────────────────────────────────────────
app.post('/track', (req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    ...req.body
  };
  fs.appendFile('tracker.log', JSON.stringify(logEntry) + '\n', err => {
    if (err) return next(err);
    res.json({ success: true });
  });
});


// ── Error Handling ──────────────────────────────────────────────────
// Centralized error middleware :contentReference[oaicite:15]{index=15}
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});


// ── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
