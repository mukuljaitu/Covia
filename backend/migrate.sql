-- Migration script to add Firebase-related columns to users table
-- Run this in your MySQL database

ALTER TABLE users 
ADD COLUMN firebase_uid VARCHAR(255) UNIQUE AFTER id,
ADD COLUMN gender VARCHAR(20) AFTER phone_number,
ADD COLUMN photo_url TEXT AFTER gender;

-- Add index for faster lookups by Firebase UID
CREATE INDEX idx_firebase_uid ON users(firebase_uid);
