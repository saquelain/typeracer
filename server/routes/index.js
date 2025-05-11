const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');

// Mount routes
router.use('/auth', authRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;