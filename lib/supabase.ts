import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface BookingVerification {
  id: string;
  booking_id: string;
  user_email: string;
  user_name: string;
  phone_number: string;
  documents_confirmed: string[];
  guidelines_accepted: boolean;
  verification_status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface RideCompletion {
  id: string;
  booking_verification_id: string;
  photo_url?: string;
  completion_timestamp: string;
  created_at: string;
}
