# Booking Status Persistence - Debugging Guide

## Problem
After booking, when the user refreshes the page, they should see the confirmation page, not the guidelines/verification page again.

## How It Should Work

### Flow on Page Load:
1. **Initialize Authentication** (`initializeAuth`)
   - Get user session from Supabase
   - If user exists → check booking status
   - If no user → show verification page

2. **Check Booking Status** (`checkExistingBookingStatus`)
   - Query database for existing booking with status 'confirmed' or 'ride_completed'
   - If booking found → set page to 'confirmation' → return `true`
   - If no booking → return `false`

3. **Set Page State**
   - If `hasExistingBooking === true` → Stay on 'confirmation' page
   - If `hasExistingBooking === false` → Show 'verification' page

## Console Logs to Watch For

### Successful Flow (Booking Exists):
```
🔐 Initializing authentication...
✅ Session loaded: User: user@email.com
👤 User authenticated, checking booking status...
🔍 Checking existing booking status for user: user@email.com
📦 Database query result: { foundBooking: true, ... }
✅ Found existing booking: { bookingId: 'BK-...', status: 'confirmed', ... }
📋 Restoring documents: [...]
🔄 Switching to confirmation page
✅ User data and booking status checked. Has booking: true
✅ Existing booking found, staying on confirmation page
```

### New User Flow (No Booking):
```
🔐 Initializing authentication...
✅ Session loaded: User: user@email.com
👤 User authenticated, checking booking status...
🔍 Checking existing booking status for user: user@email.com
📦 Database query result: { foundBooking: false, ... }
ℹ️ No existing confirmed booking found - user needs to complete verification
✅ User data and booking status checked. Has booking: false
ℹ️ No existing booking, showing verification page
```

## Common Issues & Solutions

### Issue 1: Query Timeout
**Symptoms:**
- Console shows: `⏰ Database query timeout after 5 seconds`
- Page stays loading or shows verification incorrectly

**Causes:**
- Slow database connection
- Database table not indexed properly
- Too many records in booking_verifications table

**Solutions:**
- Check Supabase connection
- Add index on `user_email` and `verification_status` columns
- Check database performance metrics

### Issue 2: Booking Found But Page Still Shows Verification
**Symptoms:**
- Console shows booking was found
- But verification page is displayed

**Debug Steps:**
1. Check if `setCurrentPage('confirmation')` is being called
2. Look for any subsequent calls to `setCurrentPage('verification')`
3. Check if the timeout is interfering: `⏰ Auth loading timeout`

**Solution:**
- The timeout now only stops the loading spinner, not changes page state
- Ensure no other code is resetting currentPage after booking is found

### Issue 3: Database Query Not Finding Booking
**Symptoms:**
- Console shows: `foundBooking: false`
- But you know the booking was created

**Debug Steps:**
1. Check the database directly in Supabase dashboard
2. Verify the booking status is 'confirmed' or 'ride_completed'
3. Verify the user_email matches exactly
4. Check if the booking was created successfully:
   ```
   📝 Booking confirmation data being stored: { ... }
   ```

**Possible Causes:**
- Booking wasn't actually saved to database (check for errors during confirmation)
- Email mismatch (case sensitivity, spaces, etc.)
- Wrong status value

## Database Schema Check

### Required Table: `booking_verifications`
```sql
SELECT * FROM booking_verifications 
WHERE user_email = 'your@email.com' 
AND verification_status IN ('confirmed', 'ride_completed')
ORDER BY created_at DESC 
LIMIT 1;
```

### Expected Columns:
- `booking_id` (text)
- `user_email` (text)
- `user_name` (text)
- `documents_confirmed` (text) - JSON string
- `guidelines_accepted` (boolean)
- `verification_status` (text) - 'confirmed' or 'ride_completed'
- `created_at` (timestamp)

## Testing Steps

### Test 1: New User Booking
1. Clear cookies and local storage
2. Sign in with Google
3. Should see verification page ✓
4. Complete booking
5. Should see confirmation page ✓
6. Refresh page
7. Should STILL see confirmation page ✓

### Test 2: Returning User
1. Sign out
2. Sign in again
3. Should see confirmation page immediately (no verification) ✓

### Test 3: Different Browser/Device
1. Sign in from different browser
2. Should see confirmation page (data persisted in DB) ✓

## Performance Metrics

- Session load: < 1 second
- Booking check query: < 2 seconds
- Total initialization: < 3 seconds
- Timeout triggers at: 8 seconds (safety only)
- Database query timeout: 5 seconds

## Troubleshooting Commands

### Clear All Auth Data (in browser console):
```javascript
// Clear localStorage
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('sb-') || key.includes('auth')) {
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
sessionStorage.clear();

// Reload
window.location.reload();
```

### Check Current State:
```javascript
// In React DevTools, look for:
- currentPage: 'confirmation' or 'verification'
- user: { email, ... }
- bookingId: 'BK-...'
- checkedDocuments: [...]
- isRideCompleted: true/false
```
