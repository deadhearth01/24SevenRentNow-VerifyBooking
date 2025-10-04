import { NextRequest, NextResponse } from 'next/server';

// Load configuration from environment variables
const WATI_API_URL = process.env.WATI_API_URL || '';
const WATI_AUTH_TOKEN = process.env.WATI_AUTH_TOKEN || '';
const CHANNEL_NUMBER = process.env.WATI_CHANNEL_NUMBER || '';
const TEMPLATE_NAME = process.env.WATI_TEMPLATE_NAME || 'bookingconfirmation';

/**
 * Format phone number with country code
 */
function formatPhoneNumber(phoneNumber: string, countryCode: string = '91'): string {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/[^\d]/g, '');
  
  // If already has country code, return as is
  if (digits.startsWith(countryCode)) {
    return digits;
  }
  
  // Add country code
  return `${countryCode}${digits}`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!WATI_API_URL || !WATI_AUTH_TOKEN || !CHANNEL_NUMBER) {
      console.error('❌ [API] Missing WhatsApp configuration:', {
        hasUrl: !!WATI_API_URL,
        hasToken: !!WATI_AUTH_TOKEN,
        hasChannel: !!CHANNEL_NUMBER
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp service is not configured. Please check environment variables.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      bookingId, 
      phoneNumber, 
      countryCode = '91', 
      templateName = TEMPLATE_NAME,
      parameters 
    } = body;

    if (!bookingId || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId and phoneNumber' },
        { status: 400 }
      );
    }

    console.log('📱 [API] Sending WhatsApp confirmation for booking:', bookingId);

    // Format phone number with country code
    const whatsappNumber = formatPhoneNumber(phoneNumber, countryCode);

    // Use provided parameters or default booking ID parameter
    const templateParameters = parameters || [
      {
        name: '1',
        value: bookingId
      }
    ];

    const requestBody = {
      template_name: templateName,
      broadcast_name: `booking_notification_${bookingId}`,
      parameters: templateParameters,
      channel_number: CHANNEL_NUMBER
    };

    const url = `${WATI_API_URL}?whatsappNumber=${whatsappNumber}`;

    console.log('📤 [API] WhatsApp request:', {
      url: url.replace(whatsappNumber, whatsappNumber.slice(0, 4) + '****'),
      template: requestBody.template_name,
      bookingId: bookingId,
      countryCode: countryCode,
      phoneNumber: whatsappNumber.slice(0, 4) + '****',
      parametersCount: templateParameters.length
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${WATI_AUTH_TOKEN}`,
        'Content-Type': 'application/json-patch+json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    
    console.log('📨 [API] WhatsApp API response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      console.error('❌ [API] WhatsApp API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseText
      });
      
      return NextResponse.json({
        success: false,
        error: `WhatsApp API returned ${response.status}: ${responseText}`
      }, { status: response.status });
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    console.log('✅ [API] WhatsApp message sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Booking confirmation sent via WhatsApp',
      data: result
    });

  } catch (error) {
    console.error('❌ [API] Failed to send WhatsApp message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
