const express = require('express');
const router = express.Router();
const RaceController = require('../controllers/raceController');
const authMiddleware = require('../middleware/auth');

// All race routes require authentication
router.use(authMiddleware);

// Competitive race routes
router.post('/', RaceController.createRace);
router.get('/available', RaceController.getAvailableRaces);
router.get('/:raceId', RaceController.getRace);
router.post('/:raceId/join', RaceController.joinRace);
router.post('/:raceId/start', RaceController.startRace);
router.get('/:raceId/results', RaceController.getRaceResults);

// Practice race routes
router.post('/practice', RaceController.createPracticeRace);

module.exports = router;