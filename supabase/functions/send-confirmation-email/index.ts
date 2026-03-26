import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ConfirmationEmailRequest {
  email: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl }: ConfirmationEmailRequest = await req.json();

    console.log('Processing confirmation email for:', { email, confirmationUrl });

    // Validate required fields
    if (!email || !confirmationUrl) {
      throw new Error('Faltan campos requeridos: email, confirmationUrl');
    }

    // Create simple HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirma tu email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">TurnoSmart</h1>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Confirma tu dirección de email</h2>
            <p>Para completar tu registro en TurnoSmart, por favor confirma tu dirección de email haciendo clic en el botón de abajo.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Confirmar email
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
            <p>El enlace expirará en 24 horas.</p>
          </div>
        </body>
      </html>
    `;

    // Send email using fetch (direct API call)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TurnoSmart <confirmacion@turnosmart.app>",
        to: [email],
        subject: "Confirma tu correo electrónico",
        html,
        reply_to: "soporte@turnosmart.app",
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email API error: ${emailResponse.status} ${emailResponse.statusText}`);
    }

    const emailData = await emailResponse.json();

    console.log("Confirmation email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailData?.id,
        message: 'Email de confirmación enviado exitosamente'
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
    console.error("Error in send-confirmation-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Error al enviar email de confirmación'
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