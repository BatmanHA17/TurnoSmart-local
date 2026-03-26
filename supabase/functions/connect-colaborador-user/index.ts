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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabaseClient.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: '',
      });
    }

    const { colaboradorId, userEmail } = await req.json();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Connecting colaborador to user:', { colaboradorId, userEmail });

    // Check if user is admin
    const { data: userRole } = await supabaseClient.rpc('get_user_role', { _user_id: user.id });
    if (!['admin', 'super_admin', 'administrador'].includes(userRole)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the user by email in profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create connection in user_permissions table with colaborador_id
    const { data: existingPermissions, error: fetchError } = await supabaseClient
      .from('user_permissions')
      .select('*')
      .eq('user_id', profile.id);

    if (fetchError) {
      console.error('Error fetching existing permissions:', fetchError);
      return new Response(JSON.stringify({ error: 'Error connecting user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update all existing permissions to include colaborador_id
    if (existingPermissions && existingPermissions.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('user_permissions')
        .update({ colaborador_id: colaboradorId })
        .eq('user_id', profile.id);

      if (updateError) {
        console.error('Error updating permissions with colaborador_id:', updateError);
        return new Response(JSON.stringify({ error: 'Error connecting user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Successfully connected colaborador to user');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Colaborador connected to user successfully',
      userId: profile.id,
      colaboradorId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in connect-colaborador-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});