/**
 * WhatsApp API Integration using WATI
 * Sends booking confirmation messages via WhatsApp template through API route
 */

interface WhatsAppTemplateParams {
  bookingId: string;
  phoneNumber: string;
  countryCode?: string; // Optional country code (defaults to '91' for India)
  templateName?: string; // Optional template name (defaults to 'bookingconfirmation')
  parameters?: Array<{ name: string; value: string }>; // Optional parameters
}

interface WhatsAppResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send WhatsApp booking confirmation message via API route
 * @param params - Booking details including booking ID, phone number, country code, and template
 * @returns Promise with success status
 */
export async function sendBookingConfirmation(
  params: WhatsAppTemplateParams
): Promise<WhatsAppResponse> {
  try {
    console.log('📱 Sending WhatsApp confirmation for booking:', params.bookingId);
    
    // Call our API route (server-side) to avoid CORS issues
    const response = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: params.bookingId,
        phoneNumber: params.phoneNumber,
        countryCode: params.countryCode || '91',
        templateName: params.templateName || 'bookingconfirmation',
        parameters: params.parameters
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp API error:', result);
      return {
        success: false,
        error: result.error || `Server returned ${response.status}`
      };
    }

    console.log('✅ WhatsApp message sent successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send multiple WhatsApp templates in sequence
 * @param phoneNumber - Phone number to send messages to
 * @param countryCode - Country code
 * @param templates - Array of templates to send
 * @returns Promise with success status
 */
export async function sendMultipleTemplates(
  phoneNumber: string,
  countryCode: string,
  templates: Array<{ templateName: string; parameters?: Array<{ name: string; value: string }> }>
): Promise<WhatsAppResponse> {
  try {
    console.log(`📱 Sending ${templates.length} WhatsApp templates...`);
    
    const results = await Promise.all(
      templates.map(template =>
        sendBookingConfirmation({
          bookingId: template.parameters?.find(p => p.name === '1')?.value || 'N/A',
          phoneNumber,
          countryCode,
          templateName: template.templateName,
          parameters: template.parameters
        })
      )
    );

    const allSucceeded = results.every(r => r.success);
    const failedCount = results.filter(r => !r.success).length;

    if (allSucceeded) {
      return {
        success: true,
        message: `All ${templates.length} templates sent successfully`
      };
    } else {
      return {
        success: false,
        error: `${failedCount} out of ${templates.length} templates failed to send`
      };
    }
  } catch (error) {
    console.error('❌ Failed to send multiple templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate phone number format
 * @param phoneNumber - Phone number to validate
 * @param countryCode - Country code to validate against
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string, countryCode: string = '91'): boolean {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/[^\d]/g, '');
  
  // Different validation based on country code
  switch (countryCode) {
    case '91': // India - 10 digits
      return digits.length === 10;
    case '1': // USA/Canada - 10 digits
      return digits.length === 10;
    case '44': // UK - 10 digits
      return digits.length === 10;
    case '971': // UAE - 9 digits
      return digits.length === 9;
    case '966': // Saudi Arabia - 9 digits
      return digits.length === 9;
    case '65': // Singapore - 8 digits
      return digits.length === 8;
    case '60': // Malaysia - 9-10 digits
      return digits.length >= 9 && digits.length <= 10;
    case '61': // Australia - 9 digits
      return digits.length === 9;
    case '64': // New Zealand - 9 digits
      return digits.length === 9;
    case '27': // South Africa - 9 digits
      return digits.length === 9;
    default: // Generic - 7 to 15 digits
      return digits.length >= 7 && digits.length <= 15;
  }
}

/**
 * List of supported countries with their codes
 */
export const COUNTRY_CODES = [
  { code: '91', name: 'India', flag: '🇮🇳', digits: 10 },
  { code: '1', name: 'USA/Canada', flag: '🇺🇸', digits: 10 },
  { code: '44', name: 'United Kingdom', flag: '🇬🇧', digits: 10 },
  { code: '971', name: 'UAE', flag: '🇦🇪', digits: 9 },
  { code: '966', name: 'Saudi Arabia', flag: '🇸🇦', digits: 9 },
  { code: '65', name: 'Singapore', flag: '🇸🇬', digits: 8 },
  { code: '60', name: 'Malaysia', flag: '🇲🇾', digits: 9 },
  { code: '61', name: 'Australia', flag: '🇦🇺', digits: 9 },
  { code: '64', name: 'New Zealand', flag: '🇳🇿', digits: 9 },
  { code: '27', name: 'South Africa', flag: '🇿🇦', digits: 9 },
];
