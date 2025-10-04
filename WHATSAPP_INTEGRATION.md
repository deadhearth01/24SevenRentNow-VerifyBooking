# WhatsApp Integration Guide

## Overview
This application sends automated WhatsApp booking confirmation messages using the WATI (WhatsApp Team Inbox) API.

## Features
- ✅ Automatic WhatsApp notifications on successful booking
- ✅ Phone number validation (10-digit Indian mobile numbers)
- ✅ Non-blocking message sending (booking succeeds even if WhatsApp fails)
- ✅ Template-based messages for consistency
- ✅ Booking ID included in confirmation message

## Database Setup

### 1. Run the Migration
Execute the SQL migration to add the phone_number column:

```bash
# Option 1: Run via Supabase Dashboard
# Go to SQL Editor and run: migrations/add_phone_number.sql

# Option 2: Run via Supabase CLI
supabase db reset
```

The migration adds:
- `phone_number` column to `booking_verifications` table
- Index for faster lookups
- Column documentation

## WATI Configuration

### Current Setup
- **API Endpoint**: `https://live-mt-server.wati.io/1027960/api/v1/sendTemplateMessage`
- **Channel Number**: `16056050919`
- **Template Name**: `bookingconfirmation`
- **Auth Token**: Configured in `lib/whatsapp.ts`

### Template Parameters
The template expects 1 parameter:
1. **Booking ID** - Sent as parameter "1"

Example:
```json
{
  "name": "1",
  "value": "BK-1234567890-ABC"
}
```

## How It Works

### 1. User Flow
1. User fills in booking details
2. User enters 10-digit phone number
3. User confirms booking
4. System:
   - Saves booking to database with phone number
   - Sends WhatsApp message to user's phone
   - Shows success message

### 2. Phone Number Validation
```typescript
// Valid formats:
"9876543210"     // 10 digits
"919876543210"   // With country code

// Automatically formatted to: 919876543210
```

### 3. Error Handling
- If WhatsApp API fails, booking still succeeds
- User sees warning: "Booking confirmed! (WhatsApp notification could not be sent)"
- Errors are logged for debugging

## API Integration

### Request Format
```bash
curl -X 'POST' \
  'https://live-mt-server.wati.io/1027960/api/v1/sendTemplateMessage?whatsappNumber=919876543210' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "template_name": "bookingconfirmation",
    "broadcast_name": "booking_notification_BK-123",
    "parameters": [
      {
        "name": "1",
        "value": "BK-123"
      }
    ],
    "channel_number": "16056050919"
  }'
```

### Response Handling
- **Success**: Status 200, confirmation message sent
- **Failure**: Non-blocking, booking still completes

## Security Considerations

### 1. API Token Storage
⚠️ **Current**: Token is stored in `lib/whatsapp.ts`
🔒 **Recommended**: Move to environment variables

```env
# .env.local
WATI_API_TOKEN=your_token_here
WATI_API_URL=https://live-mt-server.wati.io/1027960/api/v1/sendTemplateMessage
WATI_CHANNEL_NUMBER=16056050919
```

### 2. Phone Number Privacy
- Phone numbers are stored in database
- Only masked in logs (shows first 4 digits)
- Never exposed to client-side

## Testing

### Test Scenarios

1. **Valid Phone Number**
   - Enter: 9876543210
   - Expected: WhatsApp sent successfully

2. **Invalid Phone Number**
   - Enter: 12345
   - Expected: Validation error

3. **WhatsApp API Down**
   - Booking completes
   - Warning shown to user

### Debug Logging
Check browser console for:
```
📱 Sending WhatsApp confirmation for booking: BK-XXX
📤 WhatsApp API request: {...}
✅ WhatsApp message sent successfully
```

Or errors:
```
❌ WhatsApp API error: {...}
⚠️ WhatsApp message failed: ...
```

## Monitoring

### Success Metrics
- Check `console.log` for "✅ WhatsApp message sent successfully"
- Verify user receives message on WhatsApp

### Error Tracking
- Monitor console for "❌ WhatsApp API error"
- Check WATI dashboard for delivery status

## Future Enhancements

### Possible Improvements
1. ✨ Multiple templates (booking, ride completion, reminders)
2. ✨ SMS fallback if WhatsApp fails
3. ✨ Email notifications
4. ✨ Delivery status tracking
5. ✨ User preference management (opt-in/opt-out)
6. ✨ Rate limiting and retry logic
7. ✨ Analytics dashboard for message delivery

## Troubleshooting

### Issue: WhatsApp message not sent
**Check:**
1. Is WATI API token valid?
2. Is phone number correctly formatted?
3. Is template "bookingconfirmation" active in WATI?
4. Check browser console for API errors

### Issue: Phone number validation fails
**Check:**
1. Number has exactly 10 digits
2. No special characters (spaces, dashes)
3. Valid Indian mobile number

### Issue: Database error
**Check:**
1. Has migration been run?
2. Does `phone_number` column exist in `booking_verifications`?
3. Check Supabase dashboard for schema

## Support

For issues related to:
- **WATI API**: Contact WATI support
- **Database**: Check Supabase logs
- **Application**: Check browser console and terminal logs

## Files Modified

### Core Files
- `lib/whatsapp.ts` - WhatsApp API integration
- `app/page.tsx` - Phone number field and booking confirmation
- `migrations/add_phone_number.sql` - Database migration

### Configuration
- `next.config.js` - Already optimized for production

## Example Success Flow

```
User enters phone: 9876543210
↓
Validates format ✅
↓
Confirms booking ✅
↓
Saves to database (with phone_number) ✅
↓
Sends WhatsApp API request 📱
↓
User receives: "Your booking BK-XXX is confirmed!" ✅
↓
Shows success message on screen 🎉
```

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
