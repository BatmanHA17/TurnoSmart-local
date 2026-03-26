import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { sendMail } from '../_shared/mailer.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { inviteTemplate } from '../_shared/templates/invite.ts';

interface CreateInviteRequest {
  orgId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'DIRECTOR' | 'EMPLOYEE';
  locale?: 'es' | 'en';
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
  console.log('Sending invite email to:', email);
  
  const template = inviteTemplate({
    org: orgName,
    role,
    token,
    locale,
    inviterName
  });

  const result = await sendMail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });

  if (!result.ok) {
    throw new Error(result.error || 'Failed to send email');
  }

  console.log('Email sent successfully:', result.messageId);
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orgId, email, role, locale = 'es' }: CreateInviteRequest = await req.json();
    
    // Validaciones básicas
    if (!orgId || !email || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orgId, email, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar que el usuario actual puede invitar en esta org
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario puede invitar en esta organización
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to invite users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener información de la organización y del invitador
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: inviter, error: inviterError } = await supabase
      .from('profiles')
      .select('display_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    const inviterName = inviter?.display_name || 
      `${inviter?.first_name || ''} ${inviter?.last_name || ''}`.trim() || 
      user.email?.split('@')[0] || 'Alguien';

    // Revocar invitaciones anteriores del mismo email en la misma org
    const { error: revokeError } = await supabase
      .from('invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('email', email.toLowerCase())
      .is('used_at', null)
      .is('revoked_at', null);
    
    if (revokeError) {
      console.error('Error revoking previous invites:', revokeError);
      // No fallar la operación, solo loguearlo
    } else {
      console.log('Previous invites revoked successfully for:', email.toLowerCase());
    }

    // Generar token seguro
    const token = generateSecureToken();
    const tokenHash = await hashToken(token);
    const expireDays = parseInt(Deno.env.get('INVITE_EXP_DAYS') || '7');
    const expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

    // Crear nueva invitación
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .insert({
        org_id: orgId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email
    try {
      await sendInviteEmail(email, org.name, inviterName, role, token, locale);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // No fallar la operación por el email, pero loguearlo
    }

    // Log del evento
    await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        user_name: inviterName,
        action: 'invite.sent',
        entity_type: 'invite',
        entity_id: invite.id,
        entity_name: email,
        details: {
          org_id: orgId,
          org_name: org.name,
          role,
          expires_at: expiresAt.toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expires_at: invite.expires_at,
          created_at: invite.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-invite function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});