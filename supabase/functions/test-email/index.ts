import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  console.log('=== TEST EMAIL FUNCTION CALLED ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('RESEND_API_KEY available:', !!resendApiKey);
    console.log('RESEND_API_KEY length:', resendApiKey?.length || 0);
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY not configured',
          debug: {
            hasKey: false,
            keyLength: 0
          }
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const { email } = await req.json();
    
    console.log('Sending test email to:', email);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TurnoSmart Test <test@turnosmart.app>",
        to: [email],
        subject: "Test Email from TurnoSmart",
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from TurnoSmart to verify email configuration.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email API error: ${emailResponse.status} ${emailResponse.statusText}`);
    }

    const emailData = await emailResponse.json();

    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test email sent successfully',
        emailResponse: emailData,
        debug: {
          hasKey: true,
          keyLength: resendApiKey.length,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in test-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        debug: {
          timestamp: new Date().toISOString(),
          hasResendKey: !!Deno.env.get("RESEND_API_KEY")
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);