const Race = require('../models/Race');
const Sentence = require('../models/Sentence');

class RaceController {
  // Create a new race
  static async createRace(req, res) {
    try {
      const { sentenceId, raceType, maxParticipants } = req.body;
      
      let finalSentenceId = sentenceId;
      
      // If no sentence provided, get a random one
      if (!finalSentenceId) {
        const randomSentence = await Sentence.getRandomSentence();
        if (!randomSentence) {
          return res.status(404).json({
            success: false,
            message: 'No sentences available'
          });
        }
        finalSentenceId = randomSentence.sentence_id;
      }
      
      // Create race
      const raceId = await Race.create({
        createdBy: req.user.user_id,
        sentenceId: finalSentenceId,
        raceType: raceType || 'competitive',
        maxParticipants: maxParticipants || 5
      });
      
      // Automatically join the creator
      await Race.addParticipant(raceId, req.user.user_id);
      
      // Get race details
      const race = await Race.findById(raceId);
      const participants = await Race.getParticipants(raceId);
      
      // Emit race created event
      if (req.io) {
        req.io.emit('race-created', {
          race,
          participants
        });
      }
      
      res.status(201).json({
        success: true,
        race: {
          ...race,
          participants
        }
      });
    } catch (error) {
      console.error('Create race error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating race'
      });
    }
  }
  
  // Get available races
  static async getAvailableRaces(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const races = await Race.findAvailable(parseInt(limit));
      
      res.json({
        success: true,
        races
      });
    } catch (error) {
      console.error('Get available races error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching races'
      });
    }
  }
  
  // Get single race details
  static async getRace(req, res) {
    try {
      const { raceId } = req.params;
      
      const race = await Race.findById(raceId);
      if (!race) {
        return res.status(404).json({
          success: false,
          message: 'Race not found'
        });
      }
      
      const participants = await Race.getParticipants(raceId);
      
      res.json({
        success: true,
        race: {
          ...race,
          participants
        }
      });
    } catch (error) {
      console.error('Get race error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching race'
      });
    }
  }
  
  // Join a race
  static async joinRace(req, res) {
    try {
      const { raceId } = req.params;
      
      // Add participant
      await Race.addParticipant(raceId, req.user.user_id);
      
      // Get updated race details
      const race = await Race.findById(raceId);
      const participants = await Race.getParticipants(raceId);
      
      // Only emit participant joined event - no user-left-room
      if (req.io) {
        req.io.to(`race-${raceId}`).emit('participant-joined', {
          raceId,
          participants,
          newParticipant: {
            user_id: req.user.user_id,
            username: req.user.username
          }
        });
        
        console.log(`${req.user.username} joined race ${raceId} - total participants: ${participants.length}`);
      }
      
      res.json({
        success: true,
        race: {
          ...race,
          participants
        }
      });
    } catch (error) {
      console.error('Join race error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error joining race'
      });
    }
  }

  
  // Start a race
  static async startRace(req, res) {
    try {
      const { raceId } = req.params;
      
      // Check if user is the creator
      const race = await Race.findById(raceId);
      if (!race) {
        return res.status(404).json({
          success: false,
          message: 'Race not found'
        });
      }
      
      if (race.created_by !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the race creator can start the race'
        });
      }
      
      if (race.started) {
        return res.status(200).json({
          success: false,
          message: 'Race has already started'
        });
      }
      
      // Start race
      await Race.startRace(raceId);
      
      // Emit race started event
      if (req.io) {
        req.io.to(`race-${raceId}`).emit('race-starting', {
          raceId,
          countdown: 3 // 3 second countdown
        });
      }
      
      res.json({
        success: true,
        message: 'Race started'
      });
    } catch (error) {
      console.error('Start race error:', error);
      res.status(500).json({
        success: false,
        message: 'Error starting race'
      });
    }
  }
  
  // Get race results
  static async getRaceResults(req, res) {
    try {
      const { raceId } = req.params;
      
      const race = await Race.findById(raceId);
      if (!race) {
        return res.status(404).json({
          success: false,
          message: 'Race not found'
        });
      }
      
      if (!race.finished) {
        return res.status(400).json({
          success: false,
          message: 'Race has not finished yet'
        });
      }
      
      const results = await Race.getRaceResults(raceId);
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Get race results error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching results'
      });
    }
  }
  
  // Create a practice race
  static async createPracticeRace(req, res) {
    try {
      const { sentenceId } = req.body;
      
      let finalSentenceId = sentenceId;
      
      // If no sentence provided, get a random one
      if (!finalSentenceId) {
        const randomSentence = await Sentence.getRandomSentence();
        if (!randomSentence) {
          return res.status(404).json({
            success: false,
            message: 'No sentences available'
          });
        }
        finalSentenceId = randomSentence.sentence_id;
      }
      
      // Create solo practice race
      const raceId = await Race.create({
        createdBy: req.user.user_id,
        sentenceId: finalSentenceId,
        raceType: 'practice',
        maxParticipants: 1
      });
      
      // Automatically join the creator
      await Race.addParticipant(raceId, req.user.user_id);
      
      // Automatically start the practice race
      await Race.startRace(raceId);
      
      // Get race details
      const race = await Race.findById(raceId);
      
      res.status(201).json({
        success: true,
        race
      });
    } catch (error) {
      console.error('Create practice race error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating practice race'
      });
    }
  }
}

module.exports = RaceController;