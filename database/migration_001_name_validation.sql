-- Migration to add name validation fields to booking_verifications table
-- Run this in your Supabase SQL editor

-- Add new columns for credit card and driver's license name validation
ALTER TABLE booking_verifications ADD COLUMN credit_card_name TEXT;
ALTER TABLE booking_verifications ADD COLUMN drivers_license_name TEXT;  
ALTER TABLE booking_verifications ADD COLUMN names_match_verified BOOLEAN;
ALTER TABLE booking_verifications ADD COLUMN id_verification_status TEXT;

-- Set default values for existing records
UPDATE booking_verifications SET names_match_verified = FALSE WHERE names_match_verified IS NULL;
UPDATE booking_verifications SET id_verification_status = 'pending' WHERE id_verification_status IS NULL;

-- Add index for performance
CREATE INDEX idx_booking_verifications_id_verification_status ON booking_verifications(id_verification_status);
