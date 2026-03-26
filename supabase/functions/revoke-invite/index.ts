import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

import { getCorsHeaders } from '../_shared/cors.ts';
interface RevokeInviteRequest {
  inviteId: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteId }: RevokeInviteRequest = await req.json();
    
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

    // Obtener invitación
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        id,
        org_id,
        email,
        role,
        used_at,
        revoked_at,
        organizations (
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

    // Verificar que la invitación se puede revocar
    if (invite.used_at) {
      return new Response(
        JSON.stringify({ error: 'Cannot revoke a used invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invite.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'Invitation is already revoked' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revocar invitación
    const { error: revokeError } = await supabase
      .from('invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', inviteId);

    if (revokeError) {
      console.error('Error revoking invite:', revokeError);
      return new Response(
        JSON.stringify({ error: 'Failed to revoke invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener información del usuario para el log
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.display_name || 
      `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 
      user.email?.split('@')[0] || 'Unknown';

    // Log del evento
    await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        user_name: userName,
        action: 'invite.revoked',
        entity_type: 'invite',
        entity_id: invite.id,
        entity_name: invite.email,
        details: {
          org_id: invite.org_id,
          org_name: invite.organizations.name,
          role: invite.role,
          revoked_at: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation revoked successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in revoke-invite function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});