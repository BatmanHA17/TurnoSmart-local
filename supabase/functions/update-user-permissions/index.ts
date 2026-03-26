import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { targetUserId, colaboradorId, permissionName, isEnabled } = await req.json();

    // Get the authenticated user - this is automatically handled by Supabase when verify_jwt = true
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Updating permission:', { targetUserId, colaboradorId, permissionName, isEnabled });

    // Check if user is admin
    const { data: userRole } = await supabaseClient.rpc('get_user_role', { _user_id: user.id });
    if (!['admin', 'super_admin', 'administrador'].includes(userRole)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert permission override
    const { data, error } = await supabaseClient
      .from('user_permissions')
      .upsert({
        user_id: targetUserId,
        colaborador_id: colaboradorId,
        permission_name: permissionName,
        is_enabled: isEnabled,
        granted_by: user.id
      }, {
        onConflict: 'user_id,permission_name'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating permission:', error);
      return new Response(JSON.stringify({ error: 'Error updating permission' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Permission updated:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in update-user-permissions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});