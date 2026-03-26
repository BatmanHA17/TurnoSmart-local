import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface CommercialEmailRequest {
  firstName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, email }: CommercialEmailRequest = await req.json();

    console.log('Processing commercial email for:', { firstName, email });

    // Validate required fields
    if (!firstName || !email) {
      throw new Error('Faltan campos requeridos: firstName, email');
    }

    // Create simple HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>¿Interesado en TurnoSmart?</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">¡Hola ${firstName}!</h1>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Gracias por tu interés en TurnoSmart</h2>
            <p>Estamos emocionados de saber que estás considerando TurnoSmart para la gestión de horarios de tu equipo.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151;">¿Por qué elegir TurnoSmart?</h3>
            <ul style="color: #6b7280; line-height: 1.6;">
              <li>✅ Gestión automática de turnos</li>
              <li>✅ Cumplimiento legal automático</li>
              <li>✅ Interfaz intuitiva y fácil de usar</li>
              <li>✅ Reportes y análisis avanzados</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://turnosmart.app" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Comenzar ahora
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>¿Tienes preguntas? Responde a este email y te ayudaremos.</p>
            <p>Equipo TurnoSmart</p>
          </div>
        </body>
      </html>
    `;

    // Send email using fetch (direct API call since Resend import is causing issues)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Jean-Carlos Martinez <jean-carlos@turnosmart.app>",
        to: [email],
        subject: "interested in TurnoSmart? 🤔",
        html,
        reply_to: "jean-carlos.martinez@turnosmart.app",
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email API error: ${emailResponse.status} ${emailResponse.statusText}`);
    }

    const emailData = await emailResponse.json();

    console.log("Commercial email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailData?.id,
        message: 'Email comercial enviado exitosamente'
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
    console.error("Error in send-commercial-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Error al enviar email comercial'
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