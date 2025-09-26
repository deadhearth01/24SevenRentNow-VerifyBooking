-- Simplified Complete Schema for 24SevenRentNow (No Extensions Required)
-- This is the full schema including all ride completion features
-- Run this in your Supabase SQL editor

-- Drop existing tables if they exist (in correct order to avoid foreign key conflicts)
DROP TABLE IF EXISTS user_actions CASCADE;
DROP TABLE IF EXISTS ride_completions CASCADE;
DROP TABLE IF EXISTS booking_verifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- Create app_settings table for storing configuration
CREATE TABLE app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_name TEXT UNIQUE NOT NULL,
    google_client_id TEXT,
    google_client_secret TEXT,
    other_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create users table for tracking user interactions
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create booking_verifications table with ride completion status
CREATE TABLE booking_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id TEXT NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    phone_number TEXT,
    documents_confirmed TEXT NOT NULL DEFAULT '',
    guidelines_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    guidelines_accepted_at TIMESTAMP WITH TIME ZONE,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT booking_verifications_verification_status_check 
        CHECK (verification_status IN ('pending', 'confirmed', 'cancelled', 'ride_completed'))
);

-- Create user_actions table to track user interactions
CREATE TABLE user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_verification_id UUID REFERENCES booking_verifications(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_data TEXT, -- JSON string instead of JSONB
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT user_actions_action_type_check 
        CHECK (action_type IN (
            'guidelines_viewed', 
            'guidelines_accepted', 
            'documents_checked', 
            'booking_confirmed', 
            'ride_completion_clicked', 
            'photo_uploaded', 
            'booking_status_restored', 
            'ride_completed'
        ))
);

-- Create ride_completions table for storing uploaded media
CREATE TABLE ride_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_verification_id TEXT NOT NULL, -- References booking_verifications.booking_id
    photo_urls TEXT, -- JSON string of photo URLs
    video_url TEXT, -- Single video URL  
    file_metadata TEXT, -- JSON string of additional metadata about uploaded files
    completion_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_booking_verifications_booking_id ON booking_verifications(booking_id);
CREATE INDEX idx_booking_verifications_user_email ON booking_verifications(user_email);
CREATE INDEX idx_booking_verifications_user_id ON booking_verifications(user_id);
CREATE INDEX idx_booking_verifications_status ON booking_verifications(verification_status);
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX idx_ride_completions_user_id ON ride_completions(user_id);
CREATE INDEX idx_ride_completions_booking_verification_id ON ride_completions(booking_verification_id);

-- Insert default app settings
INSERT INTO app_settings (setting_name, google_client_id, google_client_secret) 
VALUES ('oauth_credentials', 'your_google_client_id_from_console', 'your_google_client_secret_from_console');

-- Notes for setup:
-- 1. Make sure to create a storage bucket named 'ride-photos' in Supabase Storage
-- 2. Update the google_client_id and google_client_secret in app_settings table
-- 3. Enable Row Level Security (RLS) in the Supabase dashboard if needed
-- 4. Configure storage policies for the 'ride-photos' bucket in Supabase dashboard
