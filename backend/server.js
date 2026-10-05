const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
const path = require('path');
const config = require('./config');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin with error handling
let firebaseInitialized = false;
try {
  const serviceAccount = require('./covia-926bb-firebase-adminsdk-fbsvc-cd0a35e2ba.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  firebaseInitialized = true;
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('⚠️  Firebase initialization failed:', error.message);
  console.log('⚠️  Server will continue running but Firebase features will be disabled');
}

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

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Email transporter setup
let emailTransporter = null;
try {
  emailTransporter = nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
  console.log('✅ Email transporter initialized');
} catch (error) {
  console.error('⚠️  Email transporter initialization failed:', error.message);
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
  if (!firebaseInitialized) {
    return res.status(503).json({ error: 'Firebase not initialized' });
  }

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
  res.json({
    status: 'ok',
    firebase: firebaseInitialized ? 'connected' : 'disabled',
    mysql: 'connected',
    email: emailTransporter ? 'connected' : 'disabled'
  });
});

// Send Email OTP
app.post('/api/auth/send-email-otp', async (req, res) => {
  if (!emailTransporter) {
    return res.status(503).json({ error: 'Email service not configured' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with 5-minute expiry
    otpStore.set(email, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send email
    const mailOptions = {
      from: config.email.user,
      to: email,
      subject: 'FlightPool - Verify your email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E96A22;">Welcome to FlightPool!</h2>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// Verify Email OTP
app.post('/api/auth/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Check if OTP exists and is valid
    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid - create or get Firebase user
    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Firebase not initialized' });
    }

    // Create Firebase user with email (using email/password auth)
    try {
      // Check if user already exists
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new user
          const randomPassword = Math.random().toString(36).slice(-8);
          userRecord = await admin.auth().createUser({
            email: email,
            password: randomPassword,
            emailVerified: true
          });
        } else {
          throw error;
        }
      }

      // Generate custom token for client
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      // Clear OTP after successful verification
      otpStore.delete(email);

      res.json({
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        customToken: customToken
      });
    } catch (firebaseError) {
      console.error('Firebase user creation error:', firebaseError);
      res.status(500).json({ error: 'Failed to create user account' });
    }
  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Serve static files from parent directory (must come before catch-all)
app.use(express.static(path.join(__dirname, '..'), {
  index: 'index.html',
  fallthrough: true
}));

// Clean URL middleware - remove .html extension
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    // If someone tries to access /page.html, redirect to /page
    const cleanPath = req.path.slice(0, -5);
    return res.redirect(301, cleanPath);
  }
  next();
});

// Handle clean URLs (serve .html files without extension)
app.get(/^\/(signin|verify|profile|flight|destination|pool|matches|create-pool|chat|index)$/, (req, res) => {
  const page = req.path.slice(1); // Remove leading slash
  res.sendFile(path.join(__dirname, '..', `${page}.html`));
});

// Catch-all route for SPA-like behavior (only if no file found)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '..')}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
