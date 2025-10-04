'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import Image from 'next/image';
import { AccountCircle as AccountIcon } from '@mui/icons-material';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import SessionManager from '../lib/sessionManager';

function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Get initial user session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Header: Session error:', error);
        }
        if (mounted) {
          setUser(session?.user ?? null);
          console.log('Header: Initial session loaded:', session?.user ? 'User found' : 'No user');
        }
      } catch (error) {
        console.error('Header: Failed to get session:', error);
      }
    };
    
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Header: Auth state changed:', event);
        if (mounted) {
          setUser(session?.user ?? null);
          if (event === 'SIGNED_IN') {
            setIsSigningIn(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    console.log('Header: Menu clicked, opening dropdown');
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    console.log('Header: Menu closing');
    setAnchorEl(null);
  }, []);

  const handleSignIn = useCallback(async () => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    try {
      console.log('Header: Initiating Google sign-in...');
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
        console.error('Header: Sign in error:', error);
        alert(`Sign in failed: ${error.message}`);
        setIsSigningIn(false);
      }
    } catch (error) {
      console.error('Header: Sign in failed:', error);
      alert('Sign in failed. Please try again.');
      setIsSigningIn(false);
    }
  }, [isSigningIn]);

  const handleSignOut = useCallback(async () => {
    try {
      console.log('Header: Starting sign out process...');
      
      // Set loading state
      setIsSigningOut(true);
      
      // Close menu first
      handleClose();
      
      // Clear all cached session data first
      SessionManager.clearAllAuthData();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Header: Sign out error:', error);
      }
      
      // Always reload to ensure clean state
      console.log('Header: Reloading page to clear state...');
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
      
    } catch (error) {
      console.error('Header: Sign out failed:', error);
      // Clear auth data and reload even if signout API fails
      SessionManager.clearAllAuthData();
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
    }
  }, [handleClose]);

  const handleLogoClick = useCallback(() => {
    window.location.reload();
  }, []);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0];
  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        bgcolor: 'background.paper', 
        color: 'text.primary', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box 
            onClick={handleLogoClick} 
            sx={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Image 
              src="/24SevenRentCarLogo.png" 
              alt="24SevenRentNow" 
              width={120} 
              height={40}
              priority
              style={{ 
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.25)) drop-shadow(0 2px 10px rgba(0, 0, 0, 0.15))',
                marginRight: '16px'
              }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                ml: 2, 
                display: { xs: 'none', sm: 'block' },
                color: 'primary.main',
                fontWeight: 600 
              }}
            >
              Booking Verification
            </Typography>
          </Box>
        </Box>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 2, 
                display: { xs: 'none', md: 'block' },
                color: 'text.secondary' 
              }}
            >
              Welcome, {userName}
            </Typography>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{ 
                border: '1px solid rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              {user.user_metadata?.avatar_url ? (
                <Avatar 
                  src={user.user_metadata.avatar_url} 
                  alt={user.user_metadata?.full_name || 'User'} 
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountIcon />
              )}
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={isMenuOpen}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose} disabled>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {user.user_metadata?.full_name || user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem 
                onClick={handleSignOut}
                disabled={isSigningOut}
                sx={{ 
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {isSigningOut ? '🔄 Signing Out...' : '🚪 Sign Out'}
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button 
            color="primary" 
            variant="contained"
            size="small"
            onClick={handleSignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? 'Signing In...' : 'Sign In'}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default memo(Header);
