import React from 'react';
import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function GuidelinesContent() {
  const sections = [
    {
      id: 'requirements',
      title: 'Requirements',
      icon: <AccountCircleIcon />,
      color: '#FF6B35',
      items: [
        'Valid Driver License (Physical copy required)',
        'Proof of Insurance (Declaration Page)',
        'Physical Credit Card (No debit/digital cards accepted)',
        'Minimum age: 21 years (Under 25 fee applies)',
        'Full coverage insurance mandatory'
      ]
    },
    {
      id: 'financial',
      title: 'Financial Policy',
      icon: <CreditCardIcon />,
      color: '#2C5F2D',
      items: [
        'Security Deposit: $500-$1500',
        'Refund processing: 10-20 business days',
        'Credit cards only (No debit cards)',
        'Physical card must match renter name',
        'Prepaid reservations: No refund, exchange only'
      ]
    },
    {
      id: 'driving',
      title: 'Driving Restrictions',
      icon: <DirectionsCarIcon />,
      color: '#FF6B35',
      items: [
        'Out-of-state policy: NV and CA only',
        'Unauthorized usage outside states: $1500 fee',
        'Mileage: 100 Miles/day for luxury cars',
        'Unlimited mileage for standard cars',
        'Physical license required (no photocopies)'
      ]
    },
    {
      id: 'insurance',
      title: 'Insurance & Coverage',
      icon: <SecurityIcon />,
      color: '#2C5F2D',
      items: [
        'Personal insurance required for all rentals',
        'Travel insurance NOT accepted',
        'Supplementary Liability Insurance: $30/day',
        'Loss Damage Waiver available',
        'Full liability for damages without coverage'
      ]
    },
    {
      id: 'fuel',
      title: 'Fuel Policy',
      icon: <LocalGasStationIcon />,
      color: '#FF6B35',
      items: [
        'Option 1: Prepay fuel, return empty',
        'Option 2: We refill at higher prices',
        'Option 3: Return with same fuel level',
        'No refunds for unused gasoline',
        'Early return: No fuel refunds'
      ]
    },
    {
      id: 'fees',
      title: 'Fees & Charges',
      icon: <CreditCardIcon />,
      color: '#2C5F2D',
      items: [
        'Additional drivers: $14.99/day each',
        'Late return: $30-$100/hour after 30min grace',
        'Smoking/Pet fee: $500 each',
        'Improper return: $500',
        'Excessive cleaning: $50',
        'Lost key tags: $15'
      ]
    },
    {
      id: 'tolls',
      title: 'Toll & Traffic Policy',
      icon: <DirectionsCarIcon />,
      color: '#FF6B35',
      items: [
        'Toll Pass Program available',
        'No toll pass: $25 service fee + toll cost',
        'All tickets: Renter responsibility',
        'Ticket payment: Within 24 hours',
        'Late ticket payment: +$25 fee'
      ]
    },
    {
      id: 'vehicle',
      title: 'Vehicle Policies',
      icon: <SecurityIcon />,
      color: '#2C5F2D',
      items: [
        'Pre and post-trip photos required',
        'Send photos to photos@24sevenrentacar.com',
        'Vehicle tracking systems installed',
        'Tire/windshield damage: Renter pays',
        'Child seats: Required under 8 years (CA law)'
      ]
    },
    {
      id: 'extensions',
      title: 'Extensions & Returns',
      icon: <DirectionsCarIcon />,
      color: '#FF6B35',
      items: [
        'Extensions: 24 hours advance notice required',
        'Email: Extensions@24sevenrentacar.com',
        'Extension rates: Higher than initial rate',
        'Late returns: Charged additional day',
        '30-minute grace period for returns'
      ]
    },
    {
      id: 'pickup',
      title: 'Pickup Instructions',
      icon: <AccountCircleIcon />,
      color: '#2C5F2D',
      items: [
        'Location: 7415 Santa Monica Blvd, Los Angeles 90046',
        'Follow email/text instructions',
        'Check spam folder for communications',
        'Roadside assistance available 24/7',
        'Personal belongings: Your responsibility'
      ]
    }
  ];

  return (
    <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: 'primary.main' }}>
        24SevenRentNow Rental Guidelines
      </Typography>
      
      {sections.map((section, index) => (
        <Accordion 
          key={section.id}
          sx={{ 
            mb: 1,
            '&:before': {
              display: 'none',
            },
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              bgcolor: 'rgba(255, 107, 53, 0.05)',
              '&.Mui-expanded': {
                bgcolor: 'rgba(255, 107, 53, 0.1)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ color: section.color, mr: 2 }}>
                {section.icon}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {section.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <List dense>
              {section.items.map((item, itemIndex) => (
                <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        • {item}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ textAlign: 'center', bgcolor: 'rgba(44, 95, 45, 0.05)', p: 2, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
          We are here for you 24/7!
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Thank you for reading and acknowledging these guidelines. Have a great trip!
        </Typography>
      </Box>
    </Box>
  );
}
