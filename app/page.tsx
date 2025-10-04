'use client';

import React, { useState, useEffect, useMemo, useCallback, memo, Suspense } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import Header from '../components/Header';
import SessionManager from '../lib/sessionManager';
import { sendBookingConfirmation, isValidPhoneNumber, COUNTRY_CODES } from '../lib/whatsapp';

// Lazy load the GuidelinesContent to improve initial load performance
const GuidelinesContent = React.lazy(() => import('../components/GuidelinesContent'));

// Memoized loading component
const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <>
      <Header />
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading your booking details...
        </Typography>
      </Container>
    </>
  );
});

export default function VerifyBooking() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedDocuments, setCheckedDocuments] = useState<string[]>([]);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('1'); // Default to US
  const [phoneError, setPhoneError] = useState('');

  const requiredDocuments = useMemo(() => [
    'Valid Driver License (Physical copy required)',
    'Proof of Insurance (Declaration Page): Bring a copy of your insurance declaration page. Insurance can also be purchased at the counter.',
    'Physical Credit Card (No debit/digital cards accepted): Name on the reservation must match the name on credit card.',
    'Full coverage insurance documentation',
  ], []);

  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Simplified page states
  const [currentPage, setCurrentPage] = useState<'verification' | 'confirmation' | 'ride-completion'>('verification');
  
  // Ride completion states
  const [ridePhotos, setRidePhotos] = useState<{
    exteriorFront: File | null;
    exteriorBack: File | null;
    exteriorLeft: File | null;
    exteriorRight: File | null;
    interiorFront: File | null;
    interiorBack: File | null;
    dashboard: File | null;
  }>({
    exteriorFront: null,
    exteriorBack: null,
    exteriorLeft: null,
    exteriorRight: null,
    interiorFront: null,
    interiorBack: null,
    dashboard: null,
  });
  const [surroundingVideo, setSurroundingVideo] = useState<File | null>(null);
  const [rideCompletionLoading, setRideCompletionLoading] = useState(false);
  const [isRideCompleted, setIsRideCompleted] = useState(false);

  // Generate a random booking ID
  const [bookingId, setBookingId] = useState('');
  
  const generateBookingId = useCallback(() => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    return `BK-${timestamp}-${random}`.toUpperCase();
  }, []);

  // Initialize booking ID on client side only
  useEffect(() => {
    if (!bookingId) {
      setBookingId(generateBookingId());
    }
  }, [bookingId, generateBookingId]);

  // Function to track user actions
  const trackUserAction = useCallback(async (actionType: string, actionData: any = {}) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', actionData.userEmail)
        .single();

      if (userData) {
        await supabase.from('user_actions').insert({
          user_id: userData.id,
          booking_verification_id: actionData.bookingVerificationId,
          action_type: actionType,
          action_data: JSON.stringify(actionData),
        });
      }
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let loadingTimeoutId: NodeJS.Timeout | undefined;
    
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // Faster session check - no timeout needed for getSession
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) {
            setLoading(false);
            setCurrentPage('verification');
          }
          return;
        }
        
        if (!mounted) return;
        
        console.log('✅ Session loaded:', session ? `User: ${session.user.email}` : 'No user');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User authenticated, checking booking status...');
          try {
            // Run user data store and booking check in parallel with timeout
            const bookingCheckPromise = Promise.all([
              storeUserData(session.user),
              checkExistingBookingStatus(session.user)
            ]);
            
            // Add 2 second timeout for booking check
            const timeoutPromise = new Promise<[void, boolean]>((resolve) => {
              setTimeout(() => {
                console.warn('⏰ Booking check timeout, continuing anyway');
                resolve([undefined, false]);
              }, 2000);
            });
            
            const [, hasExistingBooking] = await Promise.race([
              bookingCheckPromise,
              timeoutPromise
            ]);
            
            console.log('✅ Booking check complete. Has booking:', hasExistingBooking);
            
            // Set page state based on booking status
            if (hasExistingBooking) {
              console.log('✅ Existing booking found, showing confirmation page');
              setCurrentPage('confirmation');
            } else {
              console.log('ℹ️ No existing booking, showing verification page');
              setCurrentPage('verification');
            }
          } catch (checkError) {
            console.error('❌ Error during booking check:', checkError);
            setCurrentPage('verification');
          }
        } else {
          console.log('ℹ️ No user session, showing verification page');
          setCurrentPage('verification');
        }
        
        // Always stop loading after processing
        setLoading(false);
        
        // Clear timeout
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setCurrentPage('verification');
        }
      }
    };

    // Reduced timeout to 3 seconds for faster fallback
    loadingTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ Auth loading timeout - stopping loading spinner');
        setLoading(false);
        setCurrentPage('verification');
      }
    }, 3000); // Reduced from 5000ms

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user && event === 'SIGNED_IN') {
          console.log('👤 User signed in, checking booking status...');
          
          // Ensure loading is false when user signs in
          setLoading(false);
          
          try {
            // Add timeout to booking check
            const checkPromise = Promise.all([
              storeUserData(session.user),
              checkExistingBookingStatus(session.user)
            ]);
            
            const timeoutPromise = new Promise<[void, boolean]>((resolve) => {
              setTimeout(() => {
                console.warn('⏰ Booking check timeout during sign in');
                resolve([undefined, false]);
              }, 2000);
            });
            
            const results = await Promise.race([checkPromise, timeoutPromise]);
            const hasExistingBooking = results[1];
            
            // Only set to verification if no existing booking
            if (!hasExistingBooking) {
              console.log('ℹ️ No existing booking on sign in, showing verification page');
              setCurrentPage('verification');
            } else {
              console.log('✅ Existing booking found, showing confirmation page');
              setCurrentPage('confirmation');
            }
          } catch (error) {
            console.error('❌ Error during sign in booking check:', error);
            setCurrentPage('verification');
          }
        } else if (!session?.user) {
          // User signed out - reset all application state
          console.log('🚪 User signed out, resetting application state');
          setLoading(false);
          setCurrentPage('verification');
          setCheckedDocuments([]);
          setGuidelinesAccepted(false);
          setRidePhotos({
            exteriorFront: null,
            exteriorBack: null,
            exteriorLeft: null,
            exteriorRight: null,
            interiorFront: null,
            interiorBack: null,
            dashboard: null,
          });
          setSurroundingVideo(null);
          setIsRideCompleted(false);
          setError(null);
        }
      }
    );

    return () => {
      mounted = false;
      if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const storeUserData = useCallback(async (user: User) => {
    try {
      if (!user.email) return;

      // Use upsert for faster operation (single query instead of select + update/insert)
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        });
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }, []);

  const checkExistingBookingStatus = useCallback(async (user: User): Promise<boolean> => {
    try {
      if (!user.email) {
        console.log('No user email, skipping booking check');
        return false;
      }

      console.log('🔍 Checking existing booking status for user:', user.email);

      // Optimized query: only select needed fields for faster response
      const queryPromise = supabase
        .from('booking_verifications')
        .select('booking_id, verification_status, documents_confirmed, guidelines_accepted, phone_number, created_at')
        .eq('user_email', user.email)
        .in('verification_status', ['confirmed', 'ride_completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Reduced timeout to 3 seconds for faster fallback
      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) => 
        setTimeout(() => {
          console.warn('⏰ Database query timeout after 3 seconds');
          resolve({ data: null, error: { code: 'TIMEOUT', message: 'Query timeout' } });
        }, 3000) // Reduced from 5000ms
      );

      const { data: existingBooking, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      console.log('📦 Database query result:', { 
        foundBooking: !!existingBooking, 
        errorCode: error?.code || null,
        bookingId: existingBooking?.booking_id || null
      });

      if (error) {
        console.warn('❌ Error checking booking status:', error);
        return false;
      }

      if (!existingBooking) {
        console.log('ℹ️ No existing confirmed booking found');
        return false;
      }

      console.log('✅ Found existing booking:', existingBooking.booking_id);
      
      // Restore booking data
      const documents = existingBooking.documents_confirmed ? JSON.parse(existingBooking.documents_confirmed) : [];
      setCheckedDocuments(documents);
      setGuidelinesAccepted(existingBooking.guidelines_accepted || false);
      setBookingId(existingBooking.booking_id);
      setPhoneNumber(existingBooking.phone_number || '');
      
      // Check if ride is completed
      if (existingBooking.verification_status === 'ride_completed') {
        console.log('🚗 Ride already completed');
        setIsRideCompleted(true);
        
        // Fetch ride completion data separately (non-blocking)
        void supabase
          .from('ride_completions')
          .select('*')
          .eq('booking_verification_id', existingBooking.booking_id)
          .maybeSingle()
          .then(({ data: rideCompletion }) => {
            if (rideCompletion) {
              console.log('� Found ride completion data');
            }
          })
      }
      
      // Track restoration (non-blocking)
      trackUserAction('booking_status_restored', {
        userEmail: user.email,
        bookingVerificationId: existingBooking.booking_id,
        rideCompleted: existingBooking.verification_status === 'ride_completed',
      }).catch((err: any) => console.warn('Failed to track action:', err));
      
      return true;
      
    } catch (error) {
      console.log('❌ Could not check existing booking status:', error);
      return false;
    }
  }, [trackUserAction]);

  const handleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Error signing in:', error);
        setError(`Authentication failed: ${error.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      setError('An unexpected error occurred during sign-in. Please try again.');
      setLoading(false);
    }
  }, []);

  const handleDocumentCheck = useCallback((document: string) => {
    const newCheckedDocuments = checkedDocuments.includes(document) 
      ? checkedDocuments.filter((doc: string) => doc !== document)
      : [...checkedDocuments, document];
    
    setCheckedDocuments(newCheckedDocuments);

    if (user?.email && bookingId) {
      trackUserAction('documents_checked', {
        userEmail: user.email,
        bookingVerificationId: bookingId,
        document: document,
        checked: !checkedDocuments.includes(document),
        totalChecked: newCheckedDocuments.length,
      }).catch((err: any) => console.warn('Track action error:', err));
    }
  }, [checkedDocuments, trackUserAction, user?.email, bookingId]);
  
  const handleGuidelinesAccept = useCallback(() => {
    setGuidelinesAccepted(true);
    setShowGuidelines(false);
    
    if (user?.email && bookingId) {
      trackUserAction('guidelines_accepted', {
        userEmail: user.email,
        bookingVerificationId: bookingId,
      }).catch((err: any) => console.warn('Track action error:', err));
    }
  }, [user?.email, bookingId, trackUserAction]);

  const handleConfirmBooking = useCallback(async () => {
    if (checkedDocuments.length !== requiredDocuments.length) {
      setError('Please confirm you have all required documents.');
      return;
    }

    if (!guidelinesAccepted) {
      setError('Please read and accept the rental guidelines.');
      return;
    }

    if (!phoneNumber.trim()) {
      setPhoneError('Please enter your phone number to receive booking confirmation');
      setError('Phone number is required');
      return;
    }

    // Get expected digits for the selected country
    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);
    const expectedDigits = selectedCountry?.digits || 10;

    if (!isValidPhoneNumber(phoneNumber, countryCode)) {
      setPhoneError(`Please enter a valid ${expectedDigits}-digit phone number for ${selectedCountry?.name || 'selected country'}`);
      setError('Invalid phone number format');
      return;
    }

    if (!bookingId) {
      setError('Booking ID is still being generated. Please wait a moment and try again.');
      return;
    }

    setBookingLoading(true);
    setError(null);
    setPhoneError('');

    try {
      if (!user) throw new Error('User not authenticated');

      // Optimized: Use upsert to handle both insert and update in one query
      const { error: userUpsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        });

      if (userUpsertError) throw userUpsertError;

      console.log('💾 Inserting booking verification:', {
        booking_id: bookingId,
        user_id: user.id,
        user_email: user.email,
        phone_number: phoneNumber,
        verification_status: 'confirmed',
        documents_count: checkedDocuments.length
      });

      // Insert booking verification with phone number
      const { error: bookingError } = await supabase
        .from('booking_verifications')
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email,
          phone_number: phoneNumber,
          documents_confirmed: JSON.stringify(checkedDocuments),
          guidelines_accepted: guidelinesAccepted,
          verification_status: 'confirmed',
        });

      if (bookingError) {
        console.error('❌ Booking insert error:', bookingError);
        throw bookingError;
      }

      console.log('✅ Booking verification inserted successfully');

      // Immediately switch to confirmation page for better UX
      setCurrentPage('confirmation');
      setBookingLoading(false);

      // Show immediate success message
      setSnackbar({
        open: true,
        message: 'Booking confirmed! Sending WhatsApp notifications...',
        severity: 'success'
      });

      // Send 2 WhatsApp templates (non-blocking, in background)
      Promise.all([
        // Template 1: after_booking
        sendBookingConfirmation({
          bookingId: bookingId,
          phoneNumber: phoneNumber,
          countryCode: countryCode,
          templateName: 'after_booking',
          parameters: [{ name: 'BookingID', value: bookingId }]
        }),
        // Template 2: guidelines_24_car (no parameters)
        sendBookingConfirmation({
          bookingId: bookingId,
          phoneNumber: phoneNumber,
          countryCode: countryCode,
          templateName: 'guidelines_24_car',
          parameters: []
        })
      ]).then((results) => {
        const successCount = results.filter(r => r.success).length;
        console.log(`📱 WhatsApp: ${successCount}/2 templates sent successfully`);
        
        if (successCount === 2) {
          setSnackbar({
            open: true,
            message: 'Booking confirmed! All WhatsApp notifications sent successfully.',
            severity: 'success'
          });
        } else if (successCount > 0) {
          setSnackbar({
            open: true,
            message: `Booking confirmed! ${successCount}/2 WhatsApp notifications sent.`,
            severity: 'warning'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Booking confirmed! (WhatsApp notifications could not be sent)',
            severity: 'warning'
          });
        }
      }).catch((err: any) => {
        console.warn('⚠️ WhatsApp error:', err);
      });

      // Track action (non-blocking)
      trackUserAction('booking_confirmed', {
        userEmail: user.email,
        bookingVerificationId: bookingId,
        phoneNumber: phoneNumber,
        documentsVerified: checkedDocuments,
        guidelinesAccepted: true,
      }).catch((err: any) => console.warn('Track action error:', err));
      
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      const errorMessage = error.message || 'Failed to confirm booking. Please try again.';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      setBookingLoading(false);
    }
  }, [user, bookingId, checkedDocuments, guidelinesAccepted, phoneNumber, countryCode, requiredDocuments, trackUserAction]);

  // Handle photo upload for ride completion
  const handlePhotoUpload = useCallback((photoType: keyof typeof ridePhotos) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setSnackbar({
            open: true,
            message: 'Photo size must be less than 10MB',
            severity: 'error'
          });
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setSnackbar({
            open: true,
            message: 'Please upload only image files',
            severity: 'error'
          });
          return;
        }
        
        setRidePhotos(prev => ({
          ...prev,
          [photoType]: file
        }));
        
        setSnackbar({
          open: true,
          message: `${photoType.replace(/([A-Z])/g, ' $1').toLowerCase()} photo uploaded successfully`,
          severity: 'success'
        });
      }
    };
  }, []);

  // Handle video upload for ride completion
  const handleVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Video size must be less than 50MB',
          severity: 'error'
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setSnackbar({
          open: true,
          message: 'Please upload only video files',
          severity: 'error'
        });
        return;
      }
      
      // Validate video duration (max 2 minutes)
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        
        if (video.duration > 120) {
          setSnackbar({
            open: true,
            message: 'Video must be less than 2 minutes long',
            severity: 'error'
          });
          return;
        }
        
        setSurroundingVideo(file);
        setSnackbar({
          open: true,
          message: 'Surrounding video uploaded successfully',
          severity: 'success'
        });
      };
      
      video.src = URL.createObjectURL(file);
    }
  }, []);

  // Upload file to Supabase Storage
  const uploadFileToStorage = useCallback(async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('ride-photos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data.path;
  }, []);

  // Complete ride submission
  const handleCompleteRide = useCallback(async () => {
    if (!user || !bookingId) {
      setError('User not authenticated or booking ID missing');
      return;
    }

    const requiredPhotos = Object.values(ridePhotos);
    const missingPhotos = requiredPhotos.some(photo => photo === null);
    
    if (missingPhotos || !surroundingVideo) {
      setError('Please upload all required photos and the surrounding video before completing the ride.');
      return;
    }

    setRideCompletionLoading(true);
    setError(null);

    try {
      // Upload all files to storage
      const uploadPromises: Promise<string>[] = [];
      
      Object.entries(ridePhotos).forEach(([key, file]) => {
        if (file) {
          const fileName = `${user.id}/${bookingId}/${key}_${Date.now()}.${file.name.split('.').pop()}`;
          uploadPromises.push(uploadFileToStorage(file, fileName));
        }
      });
      
      if (surroundingVideo) {
        const videoFileName = `${user.id}/${bookingId}/surrounding_video_${Date.now()}.${surroundingVideo.name.split('.').pop()}`;
        uploadPromises.push(uploadFileToStorage(surroundingVideo, videoFileName));
      }

      const uploadedPaths = await Promise.all(uploadPromises);
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      // Create ride completion record
      await supabase
        .from('ride_completions')
        .insert({
          user_id: userData?.id,
          booking_verification_id: bookingId,
          photo_urls: JSON.stringify(uploadedPaths.slice(0, -1)),
          video_url: uploadedPaths[uploadedPaths.length - 1],
          file_metadata: JSON.stringify({
            photos: Object.keys(ridePhotos).reduce((acc, key, index) => {
              if (ridePhotos[key as keyof typeof ridePhotos]) {
                acc[key] = uploadedPaths[index];
              }
              return acc;
            }, {} as Record<string, string>),
            video: uploadedPaths[uploadedPaths.length - 1]
          }),
          completion_timestamp: new Date().toISOString(),
        });

      // Update booking verification status
      await supabase
        .from('booking_verifications')
        .update({
          verification_status: 'ride_completed',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId);

      trackUserAction('ride_completed', {
        userEmail: user.email,
        bookingVerificationId: bookingId,
        photosUploaded: Object.keys(ridePhotos).filter(key => ridePhotos[key as keyof typeof ridePhotos] !== null).length,
        videoUploaded: !!surroundingVideo,
        completionTimestamp: new Date().toISOString(),
      }).catch((err: any) => console.warn('Track action error:', err));

      setIsRideCompleted(true);
      setSnackbar({
        open: true,
        message: 'Ride completed successfully! All photos and video have been uploaded.',
        severity: 'success'
      });

    } catch (error: any) {
      console.error('Error completing ride:', error);
      const errorMessage = error.message || 'Failed to complete ride. Please try again.';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setRideCompletionLoading(false);
    }
  }, [user, bookingId, ridePhotos, surroundingVideo, uploadFileToStorage, trackUserAction]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <>
        <Header />
        <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
          <Card sx={{ bgcolor: '#FFE8D6' }}>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 4 } }}>
              <Image 
                src="/24SevenRentCarLogo.png" 
                alt="24SevenRentNow" 
                width={200} 
                height={80}
                priority
                style={{ 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3)) drop-shadow(0 2px 10px rgba(0, 0, 0, 0.2))',
                  marginBottom: '24px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
              <Typography variant="h5" sx={{ mt: 3, mb: 2, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Welcome to 24SevenRentNow
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Please sign in with your Google account to verify your booking documents
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <Button 
                variant="contained" 
                onClick={handleSignIn}
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 2, 
                  minWidth: { xs: '100%', sm: 200 }, 
                  py: 1.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In with Google'}
              </Button>
              
              <Typography variant="caption" sx={{ mt: 3, display: 'block', color: 'text.secondary' }}>
                Secure authentication powered by Google
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  // Booking Confirmation Screen
  if (currentPage === 'confirmation') {
    return (
      <>
        <Header />
        <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ 
                  color: '#2C5F2D', 
                  mb: 2, 
                  fontSize: { xs: '1.5rem', sm: '2.125rem' } 
                }}>
                  🎉 Booking Confirmed!
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: 'text.primary', 
                  mb: 1, 
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  wordBreak: 'break-all'
                }}>
                  Booking ID: {bookingId || 'Generating...'}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'text.secondary', 
                  mb: 3,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  Your car rental has been successfully confirmed.
                </Typography>
                
                {!isRideCompleted ? (
                  <Box 
                    sx={{ 
                      bgcolor: 'rgba(255, 107, 53, 0.1)', 
                      border: '2px solid #FF6B35',
                      borderRadius: 2, 
                      p: 3,
                      mt: 3
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: '#FF6B35', 
                      mb: 2,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      🚗 Ride Completion Required
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      mb: 2, 
                      textAlign: 'center',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      When you've finished your ride, you need to upload photos and a video of the vehicle before completing the booking.
                    </Typography>
                    
                    <Button
                      variant="contained"
                      onClick={() => setCurrentPage('ride-completion')}
                      sx={{ 
                        bgcolor: '#FF6B35', 
                        '&:hover': { bgcolor: '#e55a2b' },
                        mt: 2,
                        mb: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        py: { xs: 1, sm: 1.5 },
                        px: { xs: 2, sm: 3 }
                      }}
                    >
                      📸 Complete Ride & Upload Media
                    </Button>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.1)', 
                      border: '2px solid #4CAF50',
                      borderRadius: 2, 
                      p: 3,
                      mt: 3
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#4CAF50', mb: 2 }}>
                      ✅ Ride Completed Successfully
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Thank you! Your ride has been completed and all media has been uploaded.
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentPage('ride-completion')}
                      sx={{ 
                        borderColor: '#4CAF50',
                        color: '#4CAF50',
                        '&:hover': { borderColor: '#45a049', bgcolor: 'rgba(76, 175, 80, 0.1)' },
                        mt: 1
                      }}
                    >
                      📁 View Uploaded Photos & Video
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  // Ride Completion Page
  if (currentPage === 'ride-completion') {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 0 }
                }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentPage('confirmation')}
                    sx={{ 
                      mr: { xs: 0, sm: 2 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      order: { xs: 2, sm: 1 }
                    }}
                  >
                    ← Back to Booking Details
                  </Button>
                  <Typography variant="h4" sx={{ 
                    color: 'primary.main', 
                    flexGrow: 1, 
                    textAlign: 'center',
                    fontSize: { xs: '1.25rem', sm: '2.125rem' },
                    order: { xs: 1, sm: 2 }
                  }}>
                    🚗 Complete Your Ride
                  </Typography>
                </Box>

                {!isRideCompleted ? (
                  <Box>
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      color: 'text.primary',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      Upload Required Photos and Video
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Please upload photos from all required angles and a 1-minute video showing the car's surroundings. 
                      This helps us verify the vehicle condition after your ride.
                    </Alert>

                    {/* Photo Upload Grid */}
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      color: 'primary.main',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      📸 Vehicle Photos (Required)
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
                      gap: { xs: 2, sm: 2, md: 2 }, 
                      mb: 4 
                    }}>
                      {[
                        { key: 'exteriorFront', label: 'Front View', icon: '🚗' },
                        { key: 'exteriorBack', label: 'Back View', icon: '🔙' },
                        { key: 'exteriorLeft', label: 'Left Side', icon: '⬅️' },
                        { key: 'exteriorRight', label: 'Right Side', icon: '➡️' },
                        { key: 'interiorFront', label: 'Interior Front', icon: '🪑' },
                        { key: 'interiorBack', label: 'Interior Back', icon: '💺' },
                        { key: 'dashboard', label: 'Dashboard', icon: '🎛️' },
                      ].map(({ key, label, icon }) => (
                        <Paper key={key} elevation={2} sx={{ 
                          p: { xs: 1.5, sm: 2 }, 
                          textAlign: 'center',
                          minHeight: { xs: '120px', sm: '140px' },
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="subtitle2" sx={{ 
                            mb: 1,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}>
                            {icon} {label}
                          </Typography>
                          
                          <Button
                            component="label"
                            variant={ridePhotos[key as keyof typeof ridePhotos] ? 'contained' : 'outlined'}
                            color={ridePhotos[key as keyof typeof ridePhotos] ? 'success' : 'primary'}
                            size="small"
                            sx={{ 
                              mb: 1,
                              fontSize: { xs: '0.6rem', sm: '0.75rem' },
                              py: { xs: 0.5, sm: 1 },
                              px: { xs: 1, sm: 2 }
                            }}
                          >
                            {ridePhotos[key as keyof typeof ridePhotos] ? '✅ Uploaded' : 'Upload Photo'}
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handlePhotoUpload(key as keyof typeof ridePhotos)}
                            />
                          </Button>
                          
                          {ridePhotos[key as keyof typeof ridePhotos] && (
                            <Typography variant="caption" sx={{ 
                              display: 'block', 
                              color: 'success.main',
                              fontSize: { xs: '0.6rem', sm: '0.75rem' },
                              wordBreak: 'break-word'
                            }}>
                              ✓ {ridePhotos[key as keyof typeof ridePhotos]?.name}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>

                    {/* Video Upload */}
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      color: 'primary.main',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      🎥 Surrounding Video (Required)
                    </Typography>
                    
                    <Paper elevation={2} sx={{ 
                      p: { xs: 2, sm: 3 }, 
                      mb: 4, 
                      textAlign: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}>
                        Record a 1-minute video walking around the vehicle showing all angles and surroundings
                      </Typography>
                      
                      <Button
                        component="label"
                        variant={surroundingVideo ? 'contained' : 'outlined'}
                        color={surroundingVideo ? 'success' : 'primary'}
                        size="large"
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          py: { xs: 1, sm: 1.5 },
                          px: { xs: 2, sm: 3 }
                        }}
                      >
                        {surroundingVideo ? '✅ Video Uploaded' : '🎥 Upload Video'}
                        <input
                          type="file"
                          hidden
                          accept="video/*"
                          onChange={handleVideoUpload}
                        />
                      </Button>
                      
                      {surroundingVideo && (
                        <Typography variant="body2" sx={{ 
                          mt: 1, 
                          color: 'success.main',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          wordBreak: 'break-word'
                        }}>
                          ✓ {surroundingVideo.name} ({Math.round(surroundingVideo.size / (1024 * 1024))}MB)
                        </Typography>
                      )}
                    </Paper>

                    {/* Submit Button */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleCompleteRide}
                        disabled={
                          rideCompletionLoading ||
                          Object.values(ridePhotos).some(photo => photo === null) ||
                          !surroundingVideo
                        }
                        sx={{ 
                          minWidth: { xs: '100%', sm: 200 },
                          bgcolor: 'success.main',
                          '&:hover': { bgcolor: 'success.dark' },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          py: { xs: 1.5, sm: 2 },
                          px: { xs: 2, sm: 4 }
                        }}
                      >
                        {rideCompletionLoading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          '🏁 Complete Ride & Submit'
                        )}
                      </Button>
                      
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mt: 1, 
                        color: 'text.secondary',
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }
                      }}>
                        All photos and video will be uploaded securely
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ 
                      color: 'success.main', 
                      mb: 3,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}>
                      ✅ Ride Completed Successfully!
                    </Typography>
                    
                    <Typography variant="body1" sx={{ 
                      mb: 4,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                      Thank you for completing your ride. All photos and video have been uploaded successfully.
                    </Typography>
                    
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      color: 'primary.main',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      📁 Your Uploaded Media
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
                      gap: { xs: 1, sm: 2 }, 
                      mb: 3 
                    }}>
                      {Object.entries(ridePhotos).map(([key, file]) => (
                        file && (
                          <Paper key={key} elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ 
                              color: 'success.main',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}>
                              ✅ {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </Typography>
                          </Paper>
                        )
                      ))}
                    </Box>
                    
                    {surroundingVideo && (
                      <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ 
                          color: 'success.main',
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}>
                          ✅ Surrounding video uploaded ({Math.round(surroundingVideo.size / (1024 * 1024))}MB)
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  // Original Booking Verification Form
  return (
    <>
      <Header />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Image 
                src="/24SevenRentCarLogo.png" 
                alt="24SevenRentNow" 
                width={180} 
                height={60}
                priority
                style={{ 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3)) drop-shadow(0 2px 10px rgba(0, 0, 0, 0.2))',
                  marginBottom: '16px'
                }}
              />
              <Typography variant="h5" sx={{ 
                mb: 1, 
                color: 'primary.main',
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
                Verify Your Booking
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                Please confirm you have the required documents
              </Typography>
            </Box>

            <Paper elevation={0} sx={{ 
              bgcolor: '#FFF3E0', 
              p: { xs: 2, sm: 3 }, 
              mb: 3, 
              border: '1px solid #FFB74D' 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'warning.dark' }}>
                  Required Documents
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Ensure you have these documents before confirming:
              </Typography>
              
              <FormGroup>
                {requiredDocuments.map((document) => (
                  <FormControlLabel
                    key={document}
                    control={
                      <Checkbox
                        checked={checkedDocuments.includes(document)}
                        onChange={() => handleDocumentCheck(document)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {document}
                      </Typography>
                    }
                  />
                ))}
              </FormGroup>
              
              {/* Physical Document Warning */}
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'rgba(211, 47, 47, 0.1)', 
                  border: '1px solid #f44336',
                  borderRadius: 1 
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#d32f2f', 
                    fontWeight: 600, 
                    textAlign: 'center',
                    mb: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  ⚠️ IMPORTANT: Physical Documents Required
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#d32f2f', 
                    display: 'block', 
                    textAlign: 'center',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  All these documents must be brought to the store physically. 
                  Digital copies or photos are NOT accepted. 
                  Booking will be cancelled if physical documents are not provided.
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ mb: 3 }}>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => {
                  setShowGuidelines(true);
                  
                  trackUserAction('guidelines_viewed', {
                    userEmail: user?.email,
                    bookingVerificationId: bookingId,
                  }).catch((err: any) => console.warn('Track action error:', err));
                }}
                sx={{ 
                  mb: 2,
                  minHeight: { xs: 48, sm: 56 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Read Rental Guidelines
              </Button>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={guidelinesAccepted}
                    disabled={!guidelinesAccepted}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    I have read and accept the rental guidelines
                  </Typography>
                }
              />
            </Box>

            {/* Phone Number Field */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Phone Number *
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4} sm={3}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setPhoneError('');
                      }}
                      sx={{
                        '& .MuiSelect-select': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                    >
                      {COUNTRY_CODES.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{country.flag}</span>
                            <span>+{country.code}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={8} sm={9}>
                  <TextField
                    fullWidth
                    placeholder={`Enter ${COUNTRY_CODES.find(c => c.code === countryCode)?.digits || 10}-digit number`}
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
                      const maxLength = COUNTRY_CODES.find(c => c.code === countryCode)?.digits || 15;
                      setPhoneNumber(value.slice(0, maxLength));
                      setPhoneError('');
                    }}
                    error={!!phoneError}
                    required
                    inputProps={{
                      pattern: '[0-9]*',
                      inputMode: 'numeric'
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }}
                  />
                </Grid>
              </Grid>
              {phoneError ? (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {phoneError}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  You will receive booking confirmation via WhatsApp
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={
                checkedDocuments.length !== requiredDocuments.length || 
                !guidelinesAccepted || 
                !phoneNumber.trim() ||
                bookingLoading
              }
              onClick={handleConfirmBooking}
              sx={{ 
                mb: 2,
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.125rem' },
                minHeight: { xs: 48, sm: 56 }
              }}
            >
              {bookingLoading ? <CircularProgress size={24} /> : 'Confirm Booking'}
            </Button>

            <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 2, color: 'text.secondary' }}>
              Hello, {user?.user_metadata?.full_name || user?.email} • Booking ID: {bookingId || 'Generating...'}
            </Typography>
          </CardContent>
        </Card>

        {/* Guidelines Dialog */}
        <Dialog 
          open={showGuidelines} 
          onClose={() => setShowGuidelines(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
            24SevenRentNow Guidelines
          </DialogTitle>
          <DialogContent>
            <Suspense fallback={<CircularProgress sx={{ display: 'block', mx: 'auto' }} />}>
              <GuidelinesContent />
            </Suspense>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
              <Button onClick={() => setShowGuidelines(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleGuidelinesAccept}
              >
                Accept Guidelines
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
