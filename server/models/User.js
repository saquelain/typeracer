const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, role = 'user' } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [username, email, passwordHash, role]);
    return result.insertId;
  }
  
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  }
  
  static async findById(userId) {
    const query = 'SELECT user_id, username, email, role FROM users WHERE user_id = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows[0];
  }
  
  static async validatePassword(inputPassword, hashedPassword) {
    return bcrypt.compare(inputPassword, hashedPassword);
  }
}

module.exports = User;