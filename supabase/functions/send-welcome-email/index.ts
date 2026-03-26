import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface WelcomeEmailRequest {
  firstName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, email }: WelcomeEmailRequest = await req.json();

    const html = `
      <h1>¡Bienvenido a TurnoSmart, ${firstName}!</h1>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <a href="https://turnosmart.app/dashboard">Ir al Dashboard</a>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TurnoSmart <bienvenida@turnosmart.app>",
        to: [email],
        subject: "¡Bienvenido a TurnoSmart! 🎉",
        html,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email API error: ${emailResponse.status}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }), 
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }}
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }}
    );
  }
};

serve(handler);