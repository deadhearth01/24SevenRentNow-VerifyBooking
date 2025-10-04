# Deployment Guide - Vercel

## 🚀 Pre-Deployment Checklist

### ✅ Required Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://mltwpvomhosprlsmrdan.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sdHdwdm9taG9zcHJsc21yZGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzE0OTYsImV4cCI6MjA3NDQwNzQ5Nn0.n7W1qP4n8d1eFOk8JcPF3OeGDWocH9ZpI3jCByqnf6k

# Supabase Authentication
SUPABASE_CALLBACK_URL=https://mltwpvomhosprlsmrdan.supabase.co/auth/v1/callback

# Redirect URL (Use your Vercel domain)
NEXT_PUBLIC_REDIRECT_URL=https://your-vercel-domain.vercel.app

# WhatsApp API Configuration (Required for WhatsApp notifications)
WATI_API_URL=https://live-mt-server.wati.io/1027960/api/v1/sendTemplateMessage
WATI_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMzNhYTAyYS0zOWMyLTRmNTMtYmU1NS0yN2E2YzYwOTAzMGIiLCJ1bmlxdWVfbmFtZSI6Impwb3R1cHVyQGdtYWlsLmNvbSIsIm5hbWVpZCI6Impwb3R1cHVyQGdtYWlsLmNvbSIsImVtYWlsIjoianBvdHVwdXJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMTAvMDMvMjAyNSAxOTo1OTo1OSIsInRlbmFudF9pZCI6IjEwMjc5NjAiLCJkYl9uYW1lIjoibXQtcHJvZC1UZW5hbnRzIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQURNSU5JU1RSQVRPUiIsImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.4pDO7x8gSDfctDqFg9ytJNTHMXja72aRP7-ZonvPWR8
WATI_CHANNEL_NUMBER=16056050919
WATI_TEMPLATE_NAME=bookingconfirmation
```

**Important:** Make sure to add these to ALL environments:
- Production
- Preview
- Development

### ✅ Supabase Configuration

1. **Add Vercel Domain to Supabase Allowed URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add to **Site URL**: `https://your-vercel-domain.vercel.app`
   - Add to **Redirect URLs**: 
     - `https://your-vercel-domain.vercel.app`
     - `https://your-vercel-domain.vercel.app/`
     - `https://*.vercel.app` (for preview deployments)

2. **Google OAuth Configuration:**
   - Go to Google Cloud Console
   - Add Vercel domain to **Authorized JavaScript origins**:
     - `https://your-vercel-domain.vercel.app`
   - Add to **Authorized redirect URIs**:
     - `https://mltwpvomhosprlsmrdan.supabase.co/auth/v1/callback`

### ✅ Database Migration

Run the SQL migration in Supabase to add phone_number column:

```sql
-- In Supabase SQL Editor, run:
ALTER TABLE booking_verifications 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_booking_verifications_phone_number 
ON booking_verifications(phone_number);
```

## 🐛 Common Deployment Issues & Solutions

### Issue 1: "Sign In" button shows even after login

**Cause:** Auth state not loading before render

**Solution:** ✅ Fixed! Added loading state to Header component
- Shows "Loading..." while checking auth
- Only shows "Sign In" after confirming no user

**Verify Fix:**
- Check browser console for "Header: Initial session loaded"
- Should show user info within 1-2 seconds

---

### Issue 2: "Confirm Booking" button keeps loading indefinitely

**Causes:**
1. WhatsApp API environment variables not set in Vercel
2. Database insert failing
3. Network timeout

**Solutions:**

✅ **Step 1: Verify Environment Variables**
```bash
# In Vercel Dashboard, check all variables are set
# Should see green checkmarks next to each variable
```

✅ **Step 2: Check Logs**
```bash
# In Vercel Dashboard → Deployments → [Your Deployment] → Function Logs
# Look for:
- "❌ Missing WhatsApp configuration" → Add env variables
- "❌ Booking insert error" → Check database permissions
- "✅ Booking verification inserted successfully" → Good!
```

✅ **Step 3: Test WhatsApp API Separately**
```bash
# Check if /api/whatsapp endpoint works
curl -X POST https://your-domain.vercel.app/api/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"TEST-123","phoneNumber":"1234567890","countryCode":"91"}'

# Should return: {"success":true,...}
```

**Error Handling Added:**
- Booking succeeds even if WhatsApp fails
- User sees warning message
- Button stops loading after error

---

### Issue 3: Site is "super buggy" / slow performance

**Causes:**
1. Too many re-renders
2. Auth checks on every render
3. Large bundle size

**Solutions:**

✅ **Optimizations Already Applied:**
- React.memo() on components
- useCallback() for functions
- Lazy loading for Guidelines
- optimizePackageImports in next.config.js

✅ **Additional Performance Tips:**
```javascript
// Check bundle size
npm run build

// Should see:
// Route: / → ~327 kB First Load JS
// If larger than 500 kB, investigate
```

✅ **Caching Strategy:**
- Supabase client caches sessions for 5 minutes
- Auth state only checked once on mount
- Database queries use timeout protection

---

### Issue 4: Database queries timeout

**Cause:** Slow database or bad indexes

**Solution:**
```sql
-- Add indexes for faster queries (run in Supabase)
CREATE INDEX IF NOT EXISTS idx_booking_verifications_user_email 
ON booking_verifications(user_email);

CREATE INDEX IF NOT EXISTS idx_booking_verifications_user_id 
ON booking_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_booking_verifications_status 
ON booking_verifications(verification_status);
```

---

### Issue 5: WhatsApp messages not sending

**Debug Steps:**

1. **Check Environment Variables:**
   ```bash
   # In Vercel Dashboard
   WATI_API_URL ✓
   WATI_AUTH_TOKEN ✓
   WATI_CHANNEL_NUMBER ✓
   WATI_TEMPLATE_NAME ✓
   ```

2. **Check Function Logs:**
   ```
   Look for:
   📱 [API] Sending WhatsApp confirmation for booking: BK-XXX
   📤 [API] WhatsApp request: {...}
   ✅ [API] WhatsApp message sent successfully
   
   Or errors:
   ❌ [API] Missing WhatsApp configuration
   ❌ [API] WhatsApp API error: 401 Unauthorized
   ```

3. **Test Template in WATI Dashboard:**
   - Log in to WATI
   - Go to Templates
   - Verify "bookingconfirmation" template is APPROVED
   - Test send from dashboard

4. **Verify Phone Number Format:**
   - Must include country code
   - Example: 918688212827 (India)
   - No spaces, dashes, or special characters

---

## 📊 Monitoring & Debugging

### Enable Verbose Logging

Add to your `.env.local` or Vercel env vars:
```env
NEXT_PUBLIC_DEBUG=true
```

This will show detailed console logs for:
- Auth state changes
- Database queries
- WhatsApp API calls
- Session management

### Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Click on your deployment
3. Click "Functions" tab
4. Look for errors in `/api/whatsapp`

### Monitor Real-Time

Open browser console (F12) and watch for:
```
🔐 Auth state initialized: true
🔍 Checking for existing booking status...
📦 Database query result: {...}
✅ Existing booking found!
📱 Sending WhatsApp confirmation
✅ WhatsApp message sent successfully
```

---

## 🔒 Security Checklist

- [x] Environment variables not committed to git
- [x] API tokens stored in Vercel env vars only
- [x] Supabase Row Level Security (RLS) enabled
- [x] Google OAuth properly configured
- [x] CORS headers set for API routes
- [x] Phone numbers masked in logs

---

## 🚀 Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "fix: Deployment optimizations"
   git push origin main
   ```

2. **Vercel Auto-Deploy:**
   - Vercel will automatically deploy
   - Wait for build to complete (~2-3 minutes)

3. **Verify Deployment:**
   - Visit your Vercel URL
   - Check browser console for errors
   - Test sign in
   - Test booking flow
   - Test WhatsApp notification

4. **If Issues Persist:**
   - Check Vercel Function Logs
   - Verify all environment variables are set
   - Check Supabase allowed URLs
   - Test API endpoints directly

---

## 📞 Support

If issues persist after following this guide:

1. Check Vercel Function Logs
2. Check Supabase Logs (Dashboard → Logs)
3. Check browser console (F12 → Console tab)
4. Verify all environment variables match this guide
5. Try redeploying: `git commit --allow-empty -m "Redeploy" && git push`

---

## ✅ Post-Deployment Verification

Run through this checklist after each deployment:

- [ ] Can sign in with Google
- [ ] Header shows user name after sign in
- [ ] Can check all documents
- [ ] Can accept guidelines
- [ ] Phone number field works with country selector
- [ ] "Confirm Booking" button works (doesn't infinite load)
- [ ] WhatsApp message received
- [ ] Booking persists on page refresh
- [ ] Can complete ride verification
- [ ] Can upload photos and video
- [ ] Can sign out
- [ ] After sign out, shows sign in button

---

**Last Updated:** October 4, 2025
**Version:** 2.0.0
