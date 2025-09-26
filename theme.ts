'use client';

import { createTheme } from '@mui/material/styles';

// 24SevenRentNow brand theme
export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // Orange from the logo
      light: '#FF8A5C',
      dark: '#E55525',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2C5F2D', // Green from the logo
      light: '#4A7C59',
      dark: '#1E4220',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2C2C',
      secondary: '#666666',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF9800',
    },
    error: {
      main: '#F44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: '0 4px 16px rgba(255, 107, 53, 0.4), 0 2px 8px rgba(255, 107, 53, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(255, 107, 53, 0.5), 0 3px 12px rgba(255, 107, 53, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: '#FF6B35',
          },
        },
      },
    },
  },
});

export default theme;
