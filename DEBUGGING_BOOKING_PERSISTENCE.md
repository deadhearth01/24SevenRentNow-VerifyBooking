# Debugging Guide: Booking Persistence Issue

## Problem
When refreshing the page after confirming a booking, the app shows the guidelines page again instead of the confirmation page.

## What We've Added

### Enhanced Logging
We've added comprehensive console logging to track the entire flow:

#### On Page Load/Refresh:
1. **Session Check**: Look for `✅ Session loaded: User: <email>` or `ℹ️ No user session`
2. **Booking Check Start**: `🔍 Checking existing booking status for user: <email>`
3. **Query Result**: `📦 Database query result:`
   - `foundBooking: true/false` - Did we find a booking?
   - `errorCode` - Any database error?
   - `bookingStatus` - What status is the booking?

4. **If Booking Found**:
   - `✅ Found existing booking:` - Shows booking details
   - `📋 Restoring documents:` - Lists restored documents
   - `🔄 Switching to confirmation page` - Should navigate to confirmation

5. **If No Booking**:
   - `ℹ️ No existing confirmed booking found` - User needs to complete verification

#### On Booking Confirmation:
1. **Before Insert**: `💾 Inserting booking verification:` - Shows what data is being saved
2. **After Insert**: `✅ Booking verification inserted successfully` - Confirms it was saved

## Testing Steps

### Step 1: Confirm a Booking
1. Sign in with Google
2. Check all required documents
3. Accept guidelines
4. Click "Confirm Booking"
5. **Check console** for:
   ```
   💾 Inserting booking verification: {...}
   ✅ Booking verification inserted successfully
   ```

### Step 2: Refresh the Page
1. Press F5 or Cmd+R to refresh
2. **Check console** for:
   ```
   ✅ Session loaded: User: <email>
   👤 User authenticated, checking booking status...
   🔍 Checking existing booking status for user: <email>
   📦 Database query result: { foundBooking: true, ... }
   ✅ Found existing booking: {...}
   🔄 Switching to confirmation page
   ```

## What to Look For

### If It's Working:
- Console shows `foundBooking: true`
- Console shows `✅ Found existing booking`
- Console shows `🔄 Switching to confirmation page`
- **You see the confirmation page**

### If It's NOT Working:
Check the console for these scenarios:

#### Scenario A: No Booking Found
```
📦 Database query result: { foundBooking: false, ... }
ℹ️ No existing confirmed booking found
```
**Cause**: Booking wasn't saved or query isn't finding it
**Solution**: Check the booking confirmation step - did you see `✅ Booking verification inserted successfully`?

#### Scenario B: Database Error
```
📦 Database query result: { errorCode: 'PGRST...', errorMessage: '...' }
❌ Error checking booking status: ...
```
**Cause**: Database permission issue or network problem
**Solution**: Check Supabase RLS policies and network connection

#### Scenario C: Found Booking But Wrong Status
```
📦 Database query result: { foundBooking: true, bookingStatus: 'pending' }
```
**Cause**: Booking was saved with wrong status
**Solution**: Check the insert statement - should be `verification_status: 'confirmed'`

## Common Issues

### Issue 1: Email Mismatch
- Check if the email used to save matches the email used to query
- Look for: `user_email: <email>` in both insert and query logs

### Issue 2: Status Not 'confirmed'
- Database query only looks for status 'confirmed' or 'ride_completed'
- If booking has status 'pending', it won't be found

### Issue 3: Session Not Loading
- If you see `ℹ️ No user session`, the user isn't authenticated
- Check Supabase auth state and cookies

## Next Steps

1. **Test the full flow** while watching the console
2. **Note down** which specific log message is missing or different
3. **Share the console output** so we can identify the exact issue
4. If booking is being saved but not found, we may need to check:
   - Supabase RLS policies
   - Table structure
   - Query syntax

## Quick Database Check

You can also manually check the database in Supabase:

```sql
SELECT * FROM booking_verifications 
WHERE user_email = 'your-email@example.com'
ORDER BY created_at DESC 
LIMIT 1;
```

This will show if the booking is actually being saved and what its status is.
