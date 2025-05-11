const Sentence = require('../models/Sentence');

class SentenceController {
  // Admin only - Create new sentence
  static async createSentence(req, res) {
    try {
      const { content, difficulty } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Sentence content is required'
        });
      }
      
      const sentenceId = await Sentence.create({
        content: content.trim(),
        difficulty: difficulty || 'medium',
        createdBy: req.user.user_id
      });
      
      const newSentence = await Sentence.findById(sentenceId);
      
      res.status(201).json({
        success: true,
        message: 'Sentence created successfully',
        sentence: newSentence
      });
    } catch (error) {
      console.error('Create sentence error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating sentence'
      });
    }
  }
  
  // Admin only - Get all sentences with pagination
  static async getAllSentences(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        difficulty,
        search
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      const [sentences, total] = await Promise.all([
        Sentence.findAll({
          difficulty,
          search,
          limit: limit,
          offset: offset
        }),
        Sentence.getCount({ difficulty, search })
      ]);
      
      res.json({
        success: true,
        sentences,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get sentences error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sentences'
      });
    }
  }
  
  // Admin only - Get single sentence
  static async getSentence(req, res) {
    try {
      const { sentenceId } = req.params;
      
      const sentence = await Sentence.findById(sentenceId);
      
      if (!sentence) {
        return res.status(404).json({
          success: false,
          message: 'Sentence not found'
        });
      }
      
      res.json({
        success: true,
        sentence
      });
    } catch (error) {
      console.error('Get sentence error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sentence'
      });
    }
  }
  
  // Admin only - Update sentence
  static async updateSentence(req, res) {
    try {
      const { sentenceId } = req.params;
      const { content, difficulty } = req.body;
      
      const updated = await Sentence.update(sentenceId, {
        content: content?.trim(),
        difficulty
      });
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Sentence not found'
        });
      }
      
      const updatedSentence = await Sentence.findById(sentenceId);
      
      res.json({
        success: true,
        message: 'Sentence updated successfully',
        sentence: updatedSentence
      });
    } catch (error) {
      console.error('Update sentence error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating sentence'
      });
    }
  }
  
  // Admin only - Delete sentence
  static async deleteSentence(req, res) {
    try {
      const { sentenceId } = req.params;
      
      const deleted = await Sentence.delete(sentenceId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Sentence not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Sentence deleted successfully'
      });
    } catch (error) {
      console.error('Delete sentence error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting sentence'
      });
    }
  }
  
  // Public - Get random sentence for race
  static async getRandomSentence(req, res) {
    try {
      const { difficulty } = req.query;
      
      const sentence = await Sentence.getRandomSentence(difficulty);
      
      if (!sentence) {
        return res.status(404).json({
          success: false,
          message: 'No sentences available'
        });
      }
      
      res.json({
        success: true,
        sentence: {
          sentence_id: sentence.sentence_id,
          content: sentence.content,
          difficulty: sentence.difficulty
        }
      });
    } catch (error) {
      console.error('Get random sentence error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sentence'
      });
    }
  }
  
  // Admin only - Get sentence statistics
  static async getSentenceStatistics(req, res) {
    try {
      const stats = await Sentence.getStatistics();
      
      res.json({
        success: true,
        statistics: stats
      });
    } catch (error) {
      console.error('Get sentence statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching statistics'
      });
    }
  }
}

module.exports = SentenceController;