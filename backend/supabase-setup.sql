-- Supabase Setup Script for FlightPool
-- Run this in your Supabase SQL Editor

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profile photos
CREATE POLICY "Public profile photos are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload profile photos
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'profile-photos');

-- Allow users to update their own profile photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO public
WITH CHECK (bucket_id = 'profile-photos');

-- Create users table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  gender VARCHAR(20),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by Firebase UID
CREATE INDEX IF NOT EXISTS idx_firebase_uid ON users(firebase_uid);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to users (for profile viewing)
CREATE POLICY "Users are viewable by everyone"
ON users FOR SELECT
TO public
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
TO public
WITH CHECK (firebase_uid = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO public
USING (firebase_uid = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
