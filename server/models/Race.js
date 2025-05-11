const db = require('../config/database');

class Race {
  static async create(raceData) {
    const { createdBy, sentenceId, raceType = 'competitive', maxParticipants = 5 } = raceData;
    
    const query = `
      INSERT INTO races (created_by, sentence_id, race_type, max_participants)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [createdBy, sentenceId, raceType, maxParticipants]);
    return result.insertId;
  }
  
  static async findById(raceId) {
    const query = `
      SELECT r.*, s.content as sentence_content, s.difficulty,
             u.username as created_by_username
      FROM races r
      JOIN sentences s ON r.sentence_id = s.sentence_id
      JOIN users u ON r.created_by = u.user_id
      WHERE r.race_id = ?
    `;
    
    const [rows] = await db.execute(query, [raceId]);
    return rows[0];
  }
  
  static async findAvailable(limit = 10) {
    const query = `
      SELECT r.*, s.content as sentence_content, s.difficulty,
             u.username as created_by_username,
             COUNT(rp.participant_id) as current_participants
      FROM races r
      JOIN sentences s ON r.sentence_id = s.sentence_id
      JOIN users u ON r.created_by = u.user_id
      LEFT JOIN race_participants rp ON r.race_id = rp.race_id
      WHERE r.started = FALSE AND r.race_type = 'competitive'
      GROUP BY r.race_id
      HAVING current_participants < r.max_participants
      ORDER BY r.created_at DESC
      LIMIT ${limit}
    `;
    
    const [rows] = await db.execute(query);
    return rows;
  }
  
  static async addParticipant(raceId, userId) {
    // Check if race is available
    const race = await this.findById(raceId);
    if (!race) {
      throw new Error('Race not found');
    }
    
    if (race.started) {
      throw new Error('Race has already started');
    }
    
    // Check if already a participant
    const [existing] = await db.execute(
      'SELECT * FROM race_participants WHERE race_id = ? AND user_id = ?',
      [raceId, userId]
    );
    
    if (existing.length > 0) {
      throw new Error('Already joined this race');
    }
    
    // Check if race is full
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as count FROM race_participants WHERE race_id = ?',
      [raceId]
    );
    
    if (countResult[0].count >= race.max_participants) {
      throw new Error('Race is full');
    }
    
    // Add participant
    const query = `
      INSERT INTO race_participants (race_id, user_id)
      VALUES (?, ?)
    `;
    
    const [result] = await db.execute(query, [raceId, userId]);
    return result.insertId;
  }
  
  static async getParticipants(raceId) {
    const query = `
      SELECT rp.*, u.username, u.user_id
      FROM race_participants rp
      JOIN users u ON rp.user_id = u.user_id
      WHERE rp.race_id = ?
      ORDER BY rp.joined_at
    `;
    
    const [rows] = await db.execute(query, [raceId]);
    return rows;
  }
  
  static async startRace(raceId) {
    const query = `
      UPDATE races
      SET started = TRUE, started_at = NOW()
      WHERE race_id = ? AND started = FALSE
    `;
    
    const [result] = await db.execute(query, [raceId]);
    return result.affectedRows > 0;
  }
  
  static async updateParticipantProgress(raceId, userId, progress) {
    const { wpm, accuracy, finished } = progress;
    
    let query = `
      UPDATE race_participants
      SET wpm = ?, accuracy = ?
    `;
    
    const params = [wpm, accuracy];
    
    if (finished) {
      query += ', finished = TRUE, finished_at = NOW()';
    }
    
    query += ' WHERE race_id = ? AND user_id = ?';
    params.push(raceId, userId);
    
    const [result] = await db.execute(query, params);
    return result.affectedRows > 0;
  }
  
  static async finishRace(raceId) {
    // First, assign positions to participants
    const positionQuery = `
      UPDATE race_participants rp
      JOIN (
        SELECT user_id, 
               RANK() OVER (ORDER BY finished_at ASC, wpm DESC) as position_value
        FROM race_participants
        WHERE race_id = ? AND finished = TRUE
      ) ranked ON rp.user_id = ranked.user_id
      SET rp.position_value = ranked.position_value
      WHERE rp.race_id = ?
    `;
    
    await db.execute(positionQuery, [raceId, raceId]);
    
    // Then mark race as finished
    const finishQuery = `
      UPDATE races
      SET finished = TRUE, finished_at = NOW()
      WHERE race_id = ?
    `;
    
    const [result] = await db.execute(finishQuery, [raceId]);
    return result.affectedRows > 0;
  }
  
  static async getRaceResults(raceId) {
    const query = `
      SELECT rp.*, u.username, u.user_id
      FROM race_participants rp
      JOIN users u ON rp.user_id = u.user_id
      WHERE rp.race_id = ? AND rp.finished = TRUE
      ORDER BY rp.position_value ASC
    `;
    
    const [rows] = await db.execute(query, [raceId]);
    return rows;
  }
  
  static async deleteRace(raceId, userId) {
    // Only the creator can delete a race that hasn't started
    const race = await this.findById(raceId);
    
    if (!race) {
      throw new Error('Race not found');
    }
    
    if (race.created_by !== userId) {
      throw new Error('Only the race creator can delete this race');
    }
    
    if (race.started) {
      throw new Error('Cannot delete a race that has already started');
    }
    
    // Delete race (participants will be deleted due to CASCADE)
    const query = 'DELETE FROM races WHERE race_id = ?';
    const [result] = await db.execute(query, [raceId]);
    
    return result.affectedRows > 0;
  }
}

module.exports = Race;