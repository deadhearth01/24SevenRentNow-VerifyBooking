-- Complete Updated Supabase Database Schema for 24SevenRentNow
-- This is the full schema including all ride completion features
-- Run this in your Supabase SQL editor after dropping existing tables if needed

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order)
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

-- Insert default OAuth credentials row
INSERT INTO app_settings (setting_name, google_client_id, google_client_secret) 
VALUES ('oauth_credentials', 'your_google_client_id_from_console', 'your_google_client_secret_from_console');

-- Create users table for tracking user interactions
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create booking_verifications table
CREATE TABLE booking_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id TEXT NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    phone_number TEXT,
    documents_confirmed TEXT[] NOT NULL DEFAULT '{}',
    guidelines_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    guidelines_accepted_at TIMESTAMP WITH TIME ZONE,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'confirmed', 'cancelled', 'ride_completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_actions table to track what users clicked/did
CREATE TABLE user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_verification_id UUID REFERENCES booking_verifications(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'guidelines_viewed', 
        'guidelines_accepted', 
        'documents_checked', 
        'booking_confirmed', 
        'ride_completion_clicked', 
        'photo_uploaded', 
        'booking_status_restored', 
        'ride_completed'
    )),
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create ride_completions table with updated structure
CREATE TABLE ride_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_verification_id TEXT NOT NULL, -- References booking_verifications.booking_id
    photo_urls TEXT[], -- Array of photo URLs
    video_url TEXT, -- Single video URL
    file_metadata JSONB, -- Additional metadata about uploaded files
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

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_verifications_updated_at
    BEFORE UPDATE ON booking_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (email = auth.jwt() ->> 'email')
    WITH CHECK (email = auth.jwt() ->> 'email');

-- Create policies for booking_verifications
CREATE POLICY "Users can view their own booking verifications"
    ON booking_verifications FOR SELECT
    USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own booking verifications"
    ON booking_verifications FOR INSERT
    WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own booking verifications"
    ON booking_verifications FOR UPDATE
    USING (user_email = auth.jwt() ->> 'email')
    WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Create policies for user_actions
CREATE POLICY "Users can view their own actions"
    ON user_actions FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Users can insert their own actions"
    ON user_actions FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policies for ride_completions
CREATE POLICY "Users can view their own ride completions"
    ON ride_completions FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Users can insert their own ride completions"
    ON ride_completions FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create storage bucket for ride completion photos and videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ride-photos', 'ride-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for ride photos and videos
CREATE POLICY "Users can upload their own ride media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'ride-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view ride media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ride-photos');

-- Create policy for updating ride media (in case users need to replace files)
CREATE POLICY "Users can update their own ride media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'ride-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'ride-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create policy for deleting ride media (if needed)
CREATE POLICY "Users can delete their own ride media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'ride-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Insert sample data for testing (optional)
-- You can remove this section if you don't want sample data
/*
INSERT INTO users (id, email, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User');

INSERT INTO booking_verifications (user_id, booking_id, user_email, user_name, verification_status) VALUES 
((SELECT id FROM users WHERE email = 'test@example.com'), 'BK-TEST-123', 'test@example.com', 'Test User', 'confirmed');
*/
