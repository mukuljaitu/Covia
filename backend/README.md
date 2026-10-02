# FlightPool Backend API

This backend server handles Firebase authentication and syncs user data with MySQL database.

## Setup Instructions

### 1. Database Migration

Run the SQL migration to add Firebase-related columns to your users table:

```sql
ALTER TABLE users 
ADD COLUMN firebase_uid VARCHAR(255) UNIQUE AFTER id,
ADD COLUMN gender VARCHAR(20) AFTER phone_number,
ADD COLUMN photo_url TEXT AFTER gender;

CREATE INDEX idx_firebase_uid ON users(firebase_uid);
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

### POST /api/auth/verify-token
Verify Firebase ID token and return user info.

**Request:**
```json
{
  "idToken": "firebase_id_token"
}
```

**Response:**
```json
{
  "success": true,
  "uid": "firebase_uid",
  "email": "user@example.com",
  "phone": "+919876543210",
  "emailVerified": true
}
```

### POST /api/users/sync
Sync Firebase user with MySQL database.

**Request:**
```json
{
  "uid": "firebase_uid",
  "idToken": "firebase_id_token",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "phone": "+919876543210",
  "gender": "male",
  "photoUrl": "https://example.com/photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "firebase_uid": "firebase_uid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "phone_number": "+919876543210",
    "gender": "male",
    "photo_url": "https://example.com/photo.jpg",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/users/profile/:uid
Get user profile by Firebase UID.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "firebase_uid": "firebase_uid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "phone_number": "+919876543210",
    "gender": "male",
    "photo_url": "https://example.com/photo.jpg",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "firebase": "connected",
  "mysql": "connected"
}
```

## Security Notes

- The Firebase Admin SDK service account key (`covia-926bb-firebase-adminsdk-fbsvc-cd0a35e2ba.json`) is included in this directory for development purposes
- **DO NOT commit this file to version control** - it's already in .gitignore
- For production, use environment variables or a secure secrets manager
- The MySQL password is currently hardcoded in server.js - move to environment variables for production

## Firebase Configuration

Ensure your Firebase project has:
- Phone authentication enabled
- Email/password authentication enabled (if using email OTP)
- Proper domain whitelist for your frontend
