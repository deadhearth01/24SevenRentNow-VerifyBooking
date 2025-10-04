-- Add phone_number column to booking_verifications table
-- This allows storing user phone numbers for WhatsApp notifications

ALTER TABLE booking_verifications 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add index for faster phone number lookups
CREATE INDEX IF NOT EXISTS idx_booking_verifications_phone_number 
ON booking_verifications(phone_number);

-- Add comment to document the column
COMMENT ON COLUMN booking_verifications.phone_number IS 'User phone number for WhatsApp booking confirmations';
