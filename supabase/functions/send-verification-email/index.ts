import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface VerificationEmailRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerificationEmailRequest = await req.json();

    console.log("Sending verification email to:", email, "with code:", code);

    // Send email using Postmark directly
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': Deno.env.get('POSTMARK_TOKEN') ?? ''
      },
      body: JSON.stringify({
        From: 'TurnoSmart App <hi@turnosmart.app>',
        To: email,
        Subject: 'Código de verificación - TurnoSmart',
        HtmlBody: `
          <!doctype html>
          <html lang="es">
            <body style="margin:0;background:#F6F9FC;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F9FC;padding:32px 12px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 28px;">
                      <tr>
                        <td style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
                          <h1 style="margin:0 0 8px 0;font-size:22px;">Código de verificación</h1>
                          <p style="margin:0 0 24px 0;color:#6B7280;font-size:14px;line-height:1.6;">
                            Usa este código para completar tu registro en TurnoSmart:
                          </p>
                          
                          <div style="margin:24px 0;padding:16px;background:#F3F4F6;border-radius:8px;text-align:center;">
                            <span style="font-size:24px;font-weight:bold;color:#111827;letter-spacing:4px;">${code}</span>
                          </div>
                          
                          <p style="margin:16px 0 0;color:#6B7280;font-size:12px;">
                            Este código expira en 10 minutos.
                          </p>

                          <hr style="border:none;height:1px;background:#F3F4F6;margin:24px 0;">
                          <p style="margin:0;color:#6B7280;font-size:12px;">
                            Si no solicitaste este código, ignora este correo. · <a href="https://turnosmart.app" style="color:#6B7280;text-decoration:underline;">turnosmart.app</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
        MessageStream: Deno.env.get('POSTMARK_MESSAGE_STREAM') ?? 'outbound'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Postmark error:', errorData);
      throw new Error(`Postmark API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Email sent successfully via Postmark:", data);

    return new Response(JSON.stringify({ success: true, messageId: data.MessageID }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);