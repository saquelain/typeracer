const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Check if admin already exists
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@example.com']
    );

    if (existing.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    // Create admin user
    await db.execute(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      ['admin', 'admin@example.com', passwordHash, 'admin']
    );

    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('IMPORTANT: Change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();