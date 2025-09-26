# Testing Ride Completion System

## Setup Steps

1. **Database Setup:**
   - Copy and paste the entire content of `database/complete_schema_simple.sql` into your Supabase SQL editor
   - Run the SQL to create all tables and indexes
   - Verify all tables were created successfully

2. **Storage Setup:**
   - Go to Supabase Dashboard → Storage
   - Create a new bucket named `ride-photos`
   - Make it public or configure appropriate policies
   - Enable file uploads for images and videos

3. **Environment Variables:**
   - Make sure your `.env.local` has the correct Supabase credentials

## Testing the Flow

### Step 1: Complete a Booking
1. Open the app at `http://localhost:3001`
2. Enter booking details and complete the verification flow
3. Accept guidelines and confirm documents
4. Click "Confirm Booking"

### Step 2: Test Ride Completion
1. After booking confirmation, you should see a success dialog
2. Click "Complete Ride" button in the dialog
3. You should be taken to the ride completion page

### Step 3: Upload Photos
1. The page should show 7 photo upload slots:
   - Front view
   - Back view  
   - Left side view
   - Right side view
   - Interior dashboard
   - Interior seats
   - Odometer reading

2. Click each slot and upload appropriate photos
3. Verify file validation works (should reject non-images and files > 10MB)

### Step 4: Upload Video
1. Upload a video file (MP4/MOV/AVI)
2. Verify it validates duration (max 2 minutes) and size (max 50MB)

### Step 5: Complete the Process
1. Once all 7 photos and 1 video are uploaded, the "Complete Ride" button should be enabled
2. Click it to submit
3. Verify data is saved to the database

## Database Verification

After completing the flow, check these tables in Supabase:

```sql
-- Check user was created
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;

-- Check booking verification status
SELECT * FROM booking_verifications ORDER BY created_at DESC LIMIT 1;

-- Check user actions were tracked
SELECT * FROM user_actions ORDER BY created_at DESC LIMIT 10;

-- Check ride completion was saved
SELECT * FROM ride_completions ORDER BY created_at DESC LIMIT 1;
```

## Expected Results

- All uploads should be stored in the `ride-photos` Supabase storage bucket
- File URLs should be saved as JSON strings in the database
- Booking verification status should be updated to `ride_completed`
- User actions should track each step of the process

## Troubleshooting

- If uploads fail, check Supabase storage bucket permissions
- If database errors occur, verify the schema was applied correctly
- Check browser console for any JavaScript errors
- Verify environment variables are set correctly
