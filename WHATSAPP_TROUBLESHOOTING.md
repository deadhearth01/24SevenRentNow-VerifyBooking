# WhatsApp Message Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Not Receiving WhatsApp Messages

#### Checklist:
1. **Phone Number Format**
   - ✅ Must be exactly 10 digits
   - ✅ No spaces, dashes, or special characters
   - ✅ Valid Indian mobile number
   - Example: `9876543210` → Converts to `919876543210`

2. **WATI Configuration**
   - ✅ Template name: `bookingconfirmation` must exist in WATI dashboard
   - ✅ Template must be **approved** by WhatsApp
   - ✅ Channel number: `YOUR_CHANNEL_NUMBER` must be active
   - ✅ API token must be valid (not expired)

3. **WhatsApp Account**
   - ✅ Phone number must have WhatsApp installed
   - ✅ Phone must be connected to internet
   - ✅ WhatsApp must be able to receive messages from business accounts

#### Debug Steps:

**Step 1: Check Browser Console**
```javascript
// Look for these logs:
📱 Sending WhatsApp confirmation for booking: BK-XXX
✅ WhatsApp message sent successfully

// Or errors:
❌ WhatsApp API error: {...}
❌ Failed to send WhatsApp message: {...}
```

**Step 2: Check Server Logs (Terminal)**
```bash
# Look for API route logs:
📱 [API] Sending WhatsApp confirmation for booking: BK-XXX
📤 [API] WhatsApp request: {...}
📨 [API] WhatsApp API response: {...}
✅ [API] WhatsApp message sent successfully
```

**Step 3: Test WATI API Directly**
```bash
# Replace with your actual values:
curl -X 'POST' \
  'https://live-mt-server.wati.io/YOUR_TENANT_ID/api/v1/sendTemplateMessage?whatsappNumber=1234567890' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "template_name": "bookingconfirmation",
    "broadcast_name": "test_001",
    "parameters": [
      {
        "name": "1",
        "value": "BK-TEST-123"
      }
    ],
    "channel_number": "YOUR_CHANNEL_NUMBER"
  }'
```

**Step 4: Check WATI Dashboard**
1. Login to WATI dashboard
2. Go to Templates → Check if `bookingconfirmation` exists and is approved
3. Go to Messages → Check delivery status
4. Go to Analytics → Check failed messages

### Issue 2: CORS Errors

**Symptom:**
```
Access to fetch at 'https://live-mt-server.wati.io/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Solution:** ✅ Fixed by using server-side API route (`/api/whatsapp`)
- WhatsApp API is now called from Next.js API route (server-side)
- No CORS issues because server makes the request

### Issue 3: Template Parameter Mismatch

**Error:**
```json
{
  "error": "Template parameter count mismatch"
}
```

**Solution:**
- Check WATI dashboard template
- Current template expects 1 parameter: Booking ID
- If template has more parameters, update the API route:

```typescript
parameters: [
  { name: '1', value: bookingId },
  { name: '2', value: 'additional_param' }, // Add if needed
]
```

### Issue 4: Invalid Phone Number

**Error in Console:**
```
Please enter a valid 10-digit phone number
```

**Solution:**
- Enter exactly 10 digits
- Remove country code (+91) - it's added automatically
- Remove spaces and special characters
- Example: `9876543210` ✅ not `+91 98765 43210` ❌

### Issue 5: API Token Expired

**Error:**
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

**Solution:**
1. Login to WATI dashboard
2. Go to Settings → API
3. Generate new API token
4. Update token in `app/api/whatsapp/route.ts`:
```typescript
const WATI_AUTH_TOKEN = 'Bearer YOUR_NEW_TOKEN';
```

## Testing Guide

### Test 1: Phone Number Validation
```javascript
// Valid formats (in browser console):
isValidPhoneNumber('9876543210')     // true
isValidPhoneNumber('919876543210')   // true

// Invalid formats:
isValidPhoneNumber('12345')          // false
isValidPhoneNumber('98765')          // false
```

### Test 2: API Route Test
```bash
# Test the API route directly:
curl -X POST http://localhost:3001/api/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK-TEST-123",
    "phoneNumber": "9876543210"
  }'

# Expected success response:
{
  "success": true,
  "message": "Booking confirmation sent via WhatsApp",
  "data": {...}
}
```

### Test 3: End-to-End Test
1. Open app: http://localhost:3001
2. Sign in with Google
3. Check all documents
4. Accept guidelines
5. Enter valid 10-digit phone number
6. Click "Confirm Booking"
7. Check:
   - ✅ Success message appears
   - ✅ Browser console shows WhatsApp logs
   - ✅ Server terminal shows API logs
   - ✅ WhatsApp message received on phone

## Monitoring

### What to Monitor:

**1. Success Rate**
- Track how many bookings result in successful WhatsApp messages
- Log to analytics/monitoring service

**2. Error Patterns**
- Common error types
- Phone number validation failures
- API rate limits

**3. Delivery Status**
- Check WATI dashboard for delivery reports
- Monitor message delivery time

### Add Monitoring (Optional):
```typescript
// In app/api/whatsapp/route.ts
if (result.success) {
  // Log success to monitoring service
  await logToMonitoring('whatsapp_success', { bookingId });
} else {
  // Log failure
  await logToMonitoring('whatsapp_failure', { 
    bookingId, 
    error: result.error 
  });
}
```

## Production Checklist

Before deploying to production:

- [ ] WATI template `bookingconfirmation` is approved
- [ ] API token is valid and stored securely
- [ ] Phone number validation is working
- [ ] Server logs show successful API calls
- [ ] Test with real phone numbers
- [ ] CORS is not an issue (using server-side route)
- [ ] Error handling is in place
- [ ] Monitoring is set up
- [ ] Rate limiting is considered
- [ ] Database has `phone_number` column

## Architecture

### Current Flow:
```
User Browser (app/page.tsx)
    ↓
    sendBookingConfirmation({ bookingId, phoneNumber })
    ↓
Client WhatsApp Utility (lib/whatsapp.ts)
    ↓
    POST /api/whatsapp
    ↓
Server API Route (app/api/whatsapp/route.ts)
    ↓
    POST https://live-mt-server.wati.io/.../sendTemplateMessage
    ↓
WATI API
    ↓
WhatsApp Business API
    ↓
User's WhatsApp 📱
```

**Key Benefits:**
- ✅ Server-side API call (no CORS)
- ✅ API token not exposed to client
- ✅ Better error handling
- ✅ Can add rate limiting
- ✅ Can log all requests

## Quick Fixes

### Fix 1: Force Refresh Template Cache
If template changes aren't working:
1. Go to WATI dashboard
2. Edit template
3. Save (even without changes)
4. Wait 1-2 minutes for cache refresh

### Fix 2: Test with Different Phone Number
Some numbers may be blocked by WhatsApp:
- Try a different phone number
- Check if number can receive business messages

### Fix 3: Check Vercel/Production Logs
If working locally but not in production:
```bash
# Check Vercel logs:
vercel logs

# Look for:
📱 [API] Sending WhatsApp confirmation...
📨 [API] WhatsApp API response...
```

### Fix 4: Validate Template in WATI
1. Login to WATI
2. Go to Templates
3. Find `bookingconfirmation`
4. Status should be: ✅ **Approved**
5. If rejected, edit and resubmit

## Support Contacts

**WATI Support:**
- Email: support@wati.io
- Dashboard: https://app.wati.io
- Documentation: https://docs.wati.io

**Application Support:**
- Check browser console (F12)
- Check server terminal logs
- Review WHATSAPP_INTEGRATION.md
- Check this troubleshooting guide

---

**Last Updated**: October 4, 2025
**Version**: 2.0.0 (Server-side API route)
