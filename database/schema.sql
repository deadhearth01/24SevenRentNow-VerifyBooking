-- Supabase database schema for 24SevenRentNow booking verification

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
    booking_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT,
    phone_number TEXT,
    documents_confirmed TEXT[] NOT NULL DEFAULT '{}',
    guidelines_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    guidelines_accepted_at TIMESTAMP WITH TIME ZONE,
    -- Credit card and driver's license information
    credit_card_name TEXT,
    drivers_license_name TEXT,
    names_match_verified BOOLEAN DEFAULT FALSE,
    id_verification_status TEXT DEFAULT 'pending' CHECK (id_verification_status IN ('pending', 'verified', 'failed')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'confirmed', 'cancelled', 'ride_completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_actions table to track what users clicked/did
CREATE TABLE user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_verification_id UUID REFERENCES booking_verifications(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('guidelines_viewed', 'guidelines_accepted', 'documents_checked', 'booking_confirmed', 'ride_completion_clicked', 'photo_uploaded', 'booking_status_restored', 'ride_completed')),
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create ride_completions table
CREATE TABLE ride_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_verification_id TEXT NOT NULL, -- Changed to TEXT to match booking_id format
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

-- Create storage bucket for ride completion photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ride-photos', 'ride-photos', true);

-- Create storage policy for ride photos
CREATE POLICY "Users can upload their own ride photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'ride-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view ride photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ride-photos');
