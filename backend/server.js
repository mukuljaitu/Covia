const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
const path = require('path');
const config = require('./config');

// Initialize Firebase Admin
const serviceAccount = require('./covia-926bb-firebase-adminsdk-fbsvc-cd0a35e2ba.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// MySQL Database Configuration
const dbConfig = {
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('⚠️  Database connection failed:', err.message);
    console.log('⚠️  Server will continue running but database features will be disabled');
  });

// API Routes

// Verify Firebase ID Token
app.post('/api/auth/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    res.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      phone: decodedToken.phone_number || null,
      emailVerified: decodedToken.email_verified
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Sync Firebase user with MySQL database
app.post('/api/users/sync', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { uid, email, phone, firstName, lastName, gender, photoUrl } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [uid]
    );

    if (existingUsers.length > 0) {
      // Update existing user
      await connection.query(
        `UPDATE users SET 
          first_name = ?, 
          last_name = ?, 
          email = ?, 
          phone_number = ?, 
          gender = ?,
          photo_url = ?,
          updated_at = NOW()
        WHERE firebase_uid = ?`,
        [firstName || '', lastName || '', email || null, phone || null, gender || null, photoUrl || null, uid]
      );

      res.json({
        success: true,
        message: 'User updated successfully',
        user: existingUsers[0]
      });
    } else {
      // Create new user
      const [result] = await connection.query(
        `INSERT INTO users 
          (firebase_uid, first_name, last_name, email, phone_number, gender, photo_url, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [uid, firstName || '', lastName || '', email || null, phone || null, gender || null, photoUrl || null]
      );

      const [newUser] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );

      res.json({
        success: true,
        message: 'User created successfully',
        user: newUser[0]
      });
    }
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ error: 'Failed to sync user with database' });
  } finally {
    connection.release();
  }
});

// Get user profile by Firebase UID
app.get('/api/users/profile/:uid', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { uid } = req.params;

    const [users] = await connection.query(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [uid]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  } finally {
    connection.release();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', firebase: 'connected', mysql: 'connected' });
});

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Catch-all route to serve HTML files
app.get('*', (req, res) => {
  // If the request is for a file with an extension, try to serve it
  if (path.extname(req.path)) {
    res.sendFile(path.join(__dirname, '..', req.path));
  } else {
    // Otherwise serve index.html (for SPA-like behavior)
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '..')}`);
});
