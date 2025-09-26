# 24SevenRentNow - Booking Verification System

A modern, responsive web application for car rental booking verification with comprehensive ride completion documentation system.

## 🚀 Features

- **Booking Verification**: Secure Google OAuth authentication for booking verification
- **Document Checklist**: Interactive checklist for required rental documents
- **Ride Completion System**: Complete photo and video upload system for post-rental documentation
- **Mobile Responsive**: Optimized for all device sizes with touch-friendly interface
- **Real-time Database**: Supabase backend with PostgreSQL for data persistence
- **Modern UI**: Material-UI components with responsive design

## 📋 Ride Completion Features

- **7 Required Photos**: Front, Rear, Driver Side, Passenger Side, Interior Front, Interior Rear, Dashboard
- **1-Minute Video**: 360-degree surrounding video documentation
- **Progress Tracking**: Visual progress indicators and validation
- **Mobile Optimized**: Camera integration and touch-friendly upload interface

## 🛠 Tech Stack

- **Frontend**: Next.js 15.5.4 with React 19
- **UI Framework**: Material-UI (MUI) with responsive design
- **Backend**: Supabase (PostgreSQL + Authentication + File Storage)
- **Authentication**: Google OAuth via Supabase Auth
- **Deployment**: Vercel (optimized configuration)
- **Language**: TypeScript

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/deadhearth01/24SevenRentNow-VerifyBooking.git
cd 24SevenRentNow-VerifyBooking
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_REDIRECT_URL=https://your-redirect-site.com
```

4. Set up the database:
Run the SQL scripts in the `database/` folder in your Supabase SQL editor.

5. Run the development server:
```bash
npm run dev
```

## 📦 Deployment on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Environment Variables for Production

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_REDIRECT_URL`: URL to redirect after booking completion

## 🏗 Project Structure

```
├── app/
│   ├── page.tsx              # Main application component
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── Header.tsx            # Navigation header
├── database/
│   └── complete_schema_simple.sql # Database schema
├── lib/
│   └── supabase.ts           # Supabase client configuration
├── public/
│   └── assets/               # Static assets
└── theme.ts                  # Material-UI theme configuration
```

## 🔒 Security Features

- Google OAuth authentication
- Secure file uploads to Supabase Storage
- Input validation and sanitization
- CSRF protection
- Secure headers configuration

## 📱 Mobile Features

- Responsive design with breakpoint-specific layouts
- Touch-friendly interface with proper button sizing
- Mobile-optimized photo/video upload
- Camera integration for real-time capture
- Progressive enhancement for mobile browsers

## 🚀 Performance Optimizations

- React 19 Compiler for optimized rendering
- Code splitting and lazy loading
- Image optimization with Next.js Image component
- Bundle optimization for production
- Efficient database queries with Supabase

## 📖 Usage

1. **Authentication**: Users sign in with Google account
2. **Document Verification**: Check required documents for rental
3. **Booking Confirmation**: Confirm booking with document verification
4. **Ride Completion**: After rental, upload required photos and video
5. **Completion Tracking**: System tracks completion status across sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@24sevenrentnow.com or create an issue in this repository.

## 🔄 Version History

- **v1.0.0**: Initial release with booking verification system
- **v1.1.0**: Added comprehensive ride completion system
- **v1.2.0**: Mobile responsiveness improvements and production optimizations```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000  # Change for production
NEXTAUTH_SECRET=your_nextauth_secret

# Redirect URL after booking completion
NEXT_PUBLIC_REDIRECT_URL=https://your-main-website.com
```

**Note:** Google OAuth credentials are now stored in Supabase `app_settings` table instead of environment variables.tion that allows customers to verify their car rental bookings by confirming required documents and accepting guidelines before pickup.

## Features

- 🔐 Google OAuth authentication (credentials stored in Supabase)
- 📋 Document verification checklist with tracking
- 📖 Guidelines acceptance with user action logging
- 📸 Ride completion photo upload
- 🎨 Custom 24SevenRentNow branding with shadow effects
- 📱 Responsive Material-UI design
- 🗄️ Supabase backend with comprehensive user tracking
- � User action analytics (guidelines viewed, documents checked, etc.)

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Material-UI (MUI)
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Google Cloud Console account for OAuth
- Supabase account
- WhatsApp Business API access (optional)

### 2. Clone and Install

```bash
git clone <repository-url>
cd 24SevenRentNow-VerifyBooking
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# WhatsApp Business API (optional)
WHATSAPP_API_URL=your_whatsapp_api_url
WHATSAPP_TOKEN=your_whatsapp_token

# Redirect URL after booking completion
NEXT_PUBLIC_REDIRECT_URL=https://your-main-website.com
```

### 4. Database Setup

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `database/schema.sql`
4. Run the SQL commands to create tables and policies

### 4. Google OAuth Setup & Database Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. **Important:** Update the `app_settings` table in Supabase with your Google credentials:
```sql
UPDATE app_settings 
SET google_client_id = 'your_actual_google_client_id',
    google_client_secret = 'your_actual_google_client_secret'
WHERE setting_name = 'oauth_credentials';
```

### 6. Supabase Storage Setup

1. Go to Supabase Storage
2. Create a new bucket named `ride-photos`
3. Set it as public
4. The policies are automatically created by the schema script

### 7. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Usage Flow

### 1. WhatsApp Integration
Send customers a WhatsApp message with a verification link:
```
🚗 Confirm your 24SevenRentNow booking!
Click here to verify: https://your-domain.com?booking=BOOKING_ID
```

### 2. Verification Process
1. Customer clicks the link and signs in with Google
2. System shows required documents checklist
3. Customer confirms they will bring physical documents
4. Customer reads and accepts guidelines
5. Booking is confirmed in the database

### 3. Ride Completion
1. After the ride, customer returns to upload a completion photo
2. Photo is stored in Supabase Storage
3. Customer is redirected to the main website

## API Endpoints

- `GET /api/auth/[...nextauth]` - Authentication endpoints
- `POST /api/verify-booking` - Verify booking documents
- `POST /api/complete-ride` - Submit ride completion

## Database Schema

### booking_verifications
- `id`: UUID primary key
- `booking_id`: Rental booking reference
- `user_email`: Customer email from OAuth
- `user_name`: Customer name
- `documents_confirmed`: Array of confirmed documents
- `guidelines_accepted`: Boolean flag
- `verification_status`: pending/confirmed/cancelled

### ride_completions
- `id`: UUID primary key
- `booking_verification_id`: Reference to verification
- `photo_url`: Uploaded completion photo URL
- `completion_timestamp`: When ride was completed

## Customization

### Brand Colors
The application uses 24SevenRentNow brand colors defined in `theme.ts`:
- Primary Orange: `#FF6B35`
- Secondary Green: `#2C5F2D`

### Logo
Replace `24sevenLogowebp.webp` in the public folder with your logo.

### Guidelines
Update the guidelines content in the main page component or store them in the database for dynamic content.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
Make sure to update these for production:
- `NEXTAUTH_URL` - Your production domain
- `NEXT_PUBLIC_REDIRECT_URL` - Your main website URL
- Add production OAuth redirect URIs in Google Console

## Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Authentication required for all operations
- Secure file upload with user-based access control

## Troubleshooting

### Common Issues

1. **OAuth errors**: Check Google Console redirect URIs
2. **Database errors**: Verify Supabase connection and RLS policies
3. **Image upload issues**: Check Supabase Storage bucket permissions

### Support
For technical support, contact the development team or check the documentation.

## License
This project is proprietary to 24SevenRentNow.
