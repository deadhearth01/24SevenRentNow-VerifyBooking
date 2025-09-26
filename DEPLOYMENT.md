# 24SevenRentNow Booking Verification - Deployment Guide

## Quick Setup Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.local` and update with your values:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google OAuth (Required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth (Required)
NEXTAUTH_URL=http://localhost:3000  # Change for production
NEXTAUTH_SECRET=your_random_secret_key

# WhatsApp Business API (Optional)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/your_phone_number_id/messages
WHATSAPP_TOKEN=your_whatsapp_access_token

# Redirect URL (Required)
NEXT_PUBLIC_REDIRECT_URL=https://24sevenrentnow.com
```

### 3. Database Setup
1. Create a Supabase project
2. Run the SQL from `database/schema.sql` in Supabase SQL editor
3. Enable authentication with Google provider

### 4. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 5. Run Development Server
```bash
npm run dev
```

## Production Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Environment Variables for Production
- Update `NEXTAUTH_URL` to your domain
- Use production Supabase keys
- Add production Google OAuth redirect URIs

## WhatsApp Integration

### Setup WhatsApp Business API
1. Get WhatsApp Business Account
2. Create App in Meta for Developers
3. Get Phone Number ID and Access Token
4. Update environment variables

### Sending Verification Messages
```javascript
// POST /api/send-whatsapp
{
  "bookingId": "BK123456",
  "customerName": "John Doe", 
  "customerPhone": "+919999999999",
  "customerEmail": "john@example.com",
  "vehicleDetails": "Maruti Suzuki Swift - Red",
  "pickupDate": "2024-01-15 10:00 AM",
  "pickupLocation": "Downtown Branch"
}
```

## Integration with Existing System

### 1. After Booking Creation
Call the WhatsApp API endpoint:
```bash
curl -X POST https://yourdomain.com/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK123456",
    "customerName": "John Doe",
    "customerPhone": "+919999999999",
    "vehicleDetails": "Maruti Swift",
    "pickupDate": "2024-01-15 10:00 AM",
    "pickupLocation": "Main Branch"
  }'
```

### 2. Customer Flow
1. Customer receives WhatsApp with verification link
2. Customer clicks link and signs in with Google
3. Customer confirms documents and accepts guidelines
4. Booking is verified in database
5. After ride completion, customer uploads photo

### 3. Database Tables
- `booking_verifications`: Main verification data
- `ride_completions`: Photo uploads after ride

## Testing

### Development Testing
1. Start development server: `npm run dev`
2. Create test booking with URL: `http://localhost:3000?booking=TEST123`
3. Sign in with Google and test flow

### WhatsApp Testing
- Use WhatsApp Business API Test Numbers
- Check webhook configuration
- Verify message delivery

## Security Features

- Row Level Security on all database tables
- Google OAuth authentication required
- Users can only access their own data
- Secure file upload with user-based access

## Troubleshooting

### Common Issues
1. **OAuth Errors**: Check redirect URIs in Google Console
2. **Database Errors**: Verify Supabase connection and RLS policies
3. **WhatsApp Errors**: Check phone number format and API credentials
4. **Image Upload**: Verify Supabase Storage configuration

### Logs
- Check browser console for frontend errors
- Check Vercel/server logs for API errors
- Check Supabase logs for database issues

## Support
For technical support, refer to:
- Next.js documentation
- Supabase documentation
- Material-UI documentation
- WhatsApp Business API documentation
