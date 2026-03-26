import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { sendMail } from '../_shared/mailer.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { inviteTemplate } from '../_shared/templates/invite.ts';

interface ResendInviteRequest {
  inviteId: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper para generar token seguro (base64url safe)
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper para hash del token
async function hashToken(token: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Enviar email con mailer compartido
async function sendInviteEmail(email: string, orgName: string, inviterName: string, role: string, token: string, locale: 'es' | 'en' = 'es') {
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
  const inviteUrl = `${appUrl}/invite/accept?token=${token}`;
  
  const postmarkToken = Deno.env.get('POSTMARK_TOKEN');
  if (!postmarkToken) {
    throw new Error('POSTMARK_TOKEN not configured');
  }

  const emailData = {
    From: Deno.env.get('POSTMARK_FROM') || 'noreply@turnosmart.app',
    To: email,
    Subject: `Recordatorio: tu acceso a ${orgName} está listo`,
    HtmlBody: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio - Invitación a ${orgName}</title>
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">📬 Recordatorio</h1>
          </div>
          
          <div style="padding: 40px 32px;">
            <p style="font-size: 18px; margin-bottom: 24px; color: #374151;">
              Este es un recordatorio de que <strong>${inviterName}</strong> te invitó a unirte a <strong>${orgName}</strong> como <strong>${role}</strong>.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.4);">
                Unirme ahora
              </a>
            </div>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⏰ Tu invitación expirará pronto.</strong><br>
                Asegúrate de aceptarla antes de que sea demasiado tarde.
              </p>
            </div>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Rol asignado:</strong> ${role}<br>
                <strong>Organización:</strong> ${orgName}
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              Si no esperabas este email, puedes ignorarlo. Si ya te uniste, puedes hacer caso omiso de este recordatorio.
            </p>
            
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px; text-align: center;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <span style="word-break: break-all;">${inviteUrl}</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    TextBody: `
Recordatorio: tu acceso a ${orgName} está listo

Este es un recordatorio de que ${inviterName} te invitó a unirte a ${orgName} como ${role}.

Para aceptar la invitación, visita: ${inviteUrl}

⏰ Tu invitación expirará pronto. Asegúrate de aceptarla antes de que sea demasiado tarde.

Rol asignado: ${role}
Organización: ${orgName}

Si no esperabas este email, puedes ignorarlo. Si ya te uniste, puedes hacer caso omiso de este recordatorio.
    `,
    MessageStream: Deno.env.get('POSTMARK_MESSAGE_STREAM') || 'outbound'
  };

  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': postmarkToken,
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteId }: ResendInviteRequest = await req.json();
    
    if (!inviteId) {
      return new Response(
        JSON.stringify({ error: 'Invite ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar autorización
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener invitación con información relacionada
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        id,
        org_id,
        email,
        role,
        invited_by,
        used_at,
        revoked_at,
        organizations (
          id,
          name
        )
      `)
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('role')
      .eq('org_id', invite.org_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que la invitación se puede reenviar
    if (invite.used_at) {
      return new Response(
        JSON.stringify({ error: 'Cannot resend a used invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invite.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'Cannot resend a revoked invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar nuevo token y actualizar invitación
    const newToken = generateSecureToken();
    const newTokenHash = await hashToken(newToken);
    const expireDays = parseInt(Deno.env.get('INVITE_EXP_DAYS') || '7');
    const newExpiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

    // Invalidar token anterior y crear uno nuevo
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        token_hash: newTokenHash,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', inviteId);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener información del invitador
    const { data: inviter, error: inviterError } = await supabase
      .from('profiles')
      .select('display_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    const inviterName = inviter?.display_name || 
      `${inviter?.first_name || ''} ${inviter?.last_name || ''}`.trim() || 
      user.email?.split('@')[0] || 'Alguien';

    // Enviar email
    try {
      await sendInviteEmail(invite.email, invite.organizations.name, inviterName, invite.role, newToken, 'es');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // No fallar la operación por el email
    }

    // Log del evento
    await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        user_name: inviterName,
        action: 'invite.resent',
        entity_type: 'invite',
        entity_id: invite.id,
        entity_name: invite.email,
        details: {
          org_id: invite.org_id,
          org_name: invite.organizations.name,
          role: invite.role,
          expires_at: newExpiresAt.toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation resent successfully',
        expires_at: newExpiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in resend-invite function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});