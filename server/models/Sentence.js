const db = require('../config/database');

class Sentence {
  static async create(sentenceData) {
    const { content, difficulty = 'medium', createdBy } = sentenceData;
    
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Sentence content cannot be empty');
    }
    
    if (content.length < 10) {
      throw new Error('Sentence must be at least 10 characters long');
    }
    
    const query = `
      INSERT INTO sentences (content, difficulty, created_by)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [content, difficulty, createdBy]);
    return result.insertId;
  }
  
  static async findById(sentenceId) {
    const query = `
      SELECT s.*, u.username as created_by_username
      FROM sentences s
      LEFT JOIN users u ON s.created_by = u.user_id
      WHERE s.sentence_id = ?
    `;
    
    const [rows] = await db.execute(query, [sentenceId]);
    return rows[0];
  }
  
  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, u.username as created_by_username
      FROM sentences s
      LEFT JOIN users u ON s.created_by = u.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add filters
    if (filters.difficulty) {
      query += ' AND s.difficulty = ?';
      params.push(filters.difficulty);
    }
    
    if (filters.search) {
      query += ' AND s.content LIKE ?';
      params.push(`%${filters.search}%`);
    }
    
    // Add ordering
    query += ' ORDER BY s.created_at DESC';
    
    // Add pagination
    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
      
      if (filters.offset) {
        query += ` OFFSET ${filters.offset}`;
      }
    }

    const [rows] = await db.execute(query, params);
    return rows;
  }
  
  static async getCount(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM sentences WHERE 1=1';
    const params = [];
    
    if (filters.difficulty) {
      query += ' AND difficulty = ?';
      params.push(filters.difficulty);
    }
    
    if (filters.search) {
      query += ' AND content LIKE ?';
      params.push(`%${filters.search}%`);
    }
    
    const [rows] = await db.execute(query, params);
    return rows[0].count;
  }
  
  static async update(sentenceId, updateData) {
    const { content, difficulty } = updateData;
    
    // Validate content if provided
    if (content !== undefined && (!content || content.trim().length === 0)) {
      throw new Error('Sentence content cannot be empty');
    }
    
    if (content !== undefined && content.length < 10) {
      throw new Error('Sentence must be at least 10 characters long');
    }
    
    let query = 'UPDATE sentences SET ';
    const params = [];
    const updates = [];
    
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      params.push(difficulty);
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    query += updates.join(', ');
    query += ' WHERE sentence_id = ?';
    params.push(sentenceId);
    
    const [result] = await db.execute(query, params);
    return result.affectedRows > 0;
  }
  
  static async delete(sentenceId) {
    const query = 'DELETE FROM sentences WHERE sentence_id = ?';
    const [result] = await db.execute(query, [sentenceId]);
    return result.affectedRows > 0;
  }
  
  static async getRandomSentence(difficulty = null) {
    let query = 'SELECT * FROM sentences';
    const params = [];
    
    if (difficulty) {
      query += ' WHERE difficulty = ?';
      params.push(difficulty);
    }
    
    query += ' ORDER BY RAND() LIMIT 1';
    
    const [rows] = await db.execute(query, params);
    
    // If no sentence found with specified difficulty, get any sentence
    if (rows.length === 0 && difficulty) {
      const [allRows] = await db.execute('SELECT * FROM sentences ORDER BY RAND() LIMIT 1');
      return allRows[0];
    }
    
    // Update usage count
    if (rows[0]) {
      await db.execute(
        'UPDATE sentences SET usage_count = usage_count + 1 WHERE sentence_id = ?',
        [rows[0].sentence_id]
      );
    }
    
    return rows[0];
  }
  
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_sentences,
        COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_count,
        COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_count,
        AVG(usage_count) as avg_usage
      FROM sentences
    `;
    
    const [rows] = await db.execute(query);
    return rows[0];
  }
}

module.exports = Sentence;