const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const sentenceRoutes = require('./sentenceRoutes');
const raceRoutes = require('./raceRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/sentences', sentenceRoutes);
router.use('/races', raceRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;