import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ScheduleEmailRequest {
  firstName: string;
  email: string;
  delayMinutes?: number;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, email, delayMinutes = 5 }: ScheduleEmailRequest = await req.json();

    console.log('Scheduling commercial email for:', { firstName, email, delayMinutes });

    // Validate required fields
    if (!firstName || !email) {
      throw new Error('Faltan campos requeridos: firstName, email');
    }

    // Schedule the commercial email to be sent after the delay
    setTimeout(async () => {
      try {
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-commercial-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            firstName,
            email,
          }),
        });

        if (response.ok) {
          console.log(`Commercial email sent successfully to ${email} after ${delayMinutes} minutes delay`);
        } else {
          console.error(`Failed to send commercial email to ${email}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error sending scheduled commercial email to ${email}:`, error);
      }
    }, delayMinutes * 60 * 1000); // Convert minutes to milliseconds

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email comercial programado para envío en ${delayMinutes} minutos`,
        scheduledFor: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in schedule-commercial-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Error al programar email comercial'
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);