const express = require('express');
const router = express.Router();
const SentenceController = require('../controllers/sentenceController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public routes
router.get('/random', SentenceController.getRandomSentence);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, SentenceController.createSentence);
router.get('/', authMiddleware, adminMiddleware, SentenceController.getAllSentences);
router.get('/statistics', authMiddleware, adminMiddleware, SentenceController.getSentenceStatistics);
router.get('/:sentenceId', authMiddleware, adminMiddleware, SentenceController.getSentence);
router.put('/:sentenceId', authMiddleware, adminMiddleware, SentenceController.updateSentence);
router.delete('/:sentenceId', authMiddleware, adminMiddleware, SentenceController.deleteSentence);

module.exports = router;