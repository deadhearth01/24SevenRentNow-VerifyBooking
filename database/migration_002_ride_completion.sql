-- Migration to add ride completion functionality
-- Run this in your Supabase SQL editor

-- Add new columns to ride_completions table  
ALTER TABLE ride_completions ADD COLUMN photo_urls TEXT;
ALTER TABLE ride_completions ADD COLUMN video_url TEXT;
ALTER TABLE ride_completions ADD COLUMN file_metadata TEXT;

-- Create index for better performance
CREATE INDEX idx_ride_completions_booking_verification_id_text ON ride_completions(booking_verification_id);
