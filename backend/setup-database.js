const mysql = require('mysql2/promise');

async function setupDatabase() {
  // First connect without specifying a database
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  try {
    console.log('✅ Connected to MySQL server');

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS u506903612_covia');
    console.log('✅ Database created or already exists');

    // Switch to the database
    await connection.query('USE u506903612_covia');
    console.log('✅ Using database u506903612_covia');

    // Create users table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone_number VARCHAR(20),
        gender VARCHAR(20),
        photo_url TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created or already exists');

    // Create index for firebase_uid
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_firebase_uid ON users(firebase_uid)
    `);
    console.log('✅ Index created on firebase_uid');

    console.log('\n🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

setupDatabase();
