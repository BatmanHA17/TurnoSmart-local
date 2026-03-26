import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

import { getCorsHeaders } from '../_shared/cors.ts'
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No Authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract JWT token from "Bearer xxx"
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Creating organization for user:', user.id);

    const { name, industry, country } = await req.json();

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: 'Organization name is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Permitir múltiples organizaciones por usuario
    console.log('Creating organization for user:', user.id);

    // Create organization
    console.log('Creating organization:', name.trim());
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .insert({
        name: name.trim(),
        country: country || 'ES'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return new Response(
        JSON.stringify({ error: 'Failed to create organization' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Organization created successfully:', organization.id);

    // Create membership as OWNER
    console.log('Creating OWNER membership for user:', user.id);
    const { error: membershipError } = await supabaseClient
      .from('memberships')
      .insert({
        user_id: user.id,
        org_id: organization.id,
        role: 'OWNER',
        primary: true
      });

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      // Try to cleanup the organization if membership creation fails
      await supabaseClient
        .from('organizations')
        .delete()
        .eq('id', organization.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create membership' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Membership created successfully');

    // Update user profile with primary organization
    console.log('Updating user profile with primary org');
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        primary_org_id: organization.id
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail the request for this, just log the error
    }

    // Update user role to OWNER in user_roles table
    console.log('Updating user role to OWNER');
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'super_admin',
        role_canonical: 'OWNER'
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      console.error('Error updating user role:', roleError);
      // Don't fail the request for this, just log the error
    }

    // Log activity
    console.log('Logging activity');
    await supabaseClient.rpc('log_activity', {
      _user_name: user.email || 'Unknown User',
      _action: 'Organización creada',
      _entity_type: 'organization',
      _entity_id: organization.id,
      _entity_name: organization.name,
      _establishment: organization.name,
      _details: {
        organization_id: organization.id,
        organization_name: organization.name,
        industry: industry || null,
        country: country || 'ES',
        creator_role: 'OWNER'
      }
    });

    console.log('Organization creation process completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          country: organization.country
        },
        role: 'OWNER',
        primary: true
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})