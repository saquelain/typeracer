const db = require('../config/database');

const sentences = [
  // Easy sentences
  { content: 'The quick brown fox jumps over the lazy dog.', difficulty: 'easy' },
  { content: 'Hello world! This is a simple test.', difficulty: 'easy' },
  { content: 'I love coding every day.', difficulty: 'easy' },
  { content: 'The sun is shining bright today.', difficulty: 'easy' },
  { content: 'Practice makes perfect every time.', difficulty: 'easy' },
  
  // Medium sentences
  { content: 'Web development includes both frontend and backend technologies.', difficulty: 'medium' },
  { content: 'JavaScript is one of the most popular programming languages.', difficulty: 'medium' },
  { content: 'React, Vue, and Angular are popular JavaScript frameworks.', difficulty: 'medium' },
  { content: 'Database management requires careful planning and optimization.', difficulty: 'medium' },
  { content: 'Agile methodology emphasizes iterative development and collaboration.', difficulty: 'medium' },
  
  // Hard sentences
  { content: 'Microservices architecture involves decomposing applications into loosely coupled services, each responsible for a specific business capability.', difficulty: 'hard' },
  { content: 'Asynchronous programming enables applications to handle multiple operations concurrently without blocking the main execution thread.', difficulty: 'hard' },
  { content: 'Cryptographic protocols ensure data confidentiality, integrity, and authentication in distributed systems across untrusted networks.', difficulty: 'hard' },
  { content: 'Container orchestration platforms like Kubernetes automate deployment, scaling, and management of containerized applications in production environments.', difficulty: 'hard' },
  { content: 'Machine learning algorithms leverage statistical techniques to enable computers to learn patterns from data without explicit programming instructions.', difficulty: 'hard' }
];

async function seedSentences() {
  try {
    // Get admin user ID
    const [adminUser] = await db.execute(
      'SELECT user_id FROM users WHERE role = "admin" LIMIT 1'
    );
    
    if (!adminUser.length) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }
    
    const adminId = adminUser[0].user_id;
    
    // Check if sentences already exist
    const [existing] = await db.execute('SELECT COUNT(*) as count FROM sentences');
    
    if (existing[0].count > 0) {
      console.log('Sentences already exist. Skipping seed...');
      return;
    }
    
    // Insert sentences
    const query = `
      INSERT INTO sentences (content, difficulty, created_by)
      VALUES (?, ?, ?)
    `;
    
    for (const sentence of sentences) {
      await db.execute(query, [sentence.content, sentence.difficulty, adminId]);
    }
    
    console.log(`Successfully seeded ${sentences.length} sentences!`);
    console.log('Breakdown:');
    console.log(`- Easy: ${sentences.filter(s => s.difficulty === 'easy').length}`);
    console.log(`- Medium: ${sentences.filter(s => s.difficulty === 'medium').length}`);
    console.log(`- Hard: ${sentences.filter(s => s.difficulty === 'hard').length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding sentences:', error);
    process.exit(1);
  }
}

seedSentences();