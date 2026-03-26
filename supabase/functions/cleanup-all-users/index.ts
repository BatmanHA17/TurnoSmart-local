import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

import { getCorsHeaders } from '../_shared/cors.ts';
const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  console.log('Cleanup all users function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with admin privileges
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Getting all users...');
    
    // Get all users from auth.users
    const { data: users, error: getUsersError } = await supabase.auth.admin.listUsers();
    
    if (getUsersError) {
      console.error('Error getting users:', getUsersError);
      return new Response(
        JSON.stringify({ error: 'Error obteniendo usuarios' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Found ${users.users.length} users to delete`);
    
    // Delete each user
    const deletionResults = [];
    for (const user of users.users) {
      console.log(`Deleting user: ${user.email} (${user.id})`);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`Error deleting user ${user.email}:`, deleteError);
        deletionResults.push({
          email: user.email,
          success: false,
          error: deleteError.message
        });
      } else {
        console.log(`Successfully deleted user: ${user.email}`);
        deletionResults.push({
          email: user.email,
          success: true
        });
      }
    }

    console.log('User cleanup completed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Limpieza de usuarios completada',
        totalUsers: users.users.length,
        results: deletionResults,
        successCount: deletionResults.filter(r => r.success).length,
        errorCount: deletionResults.filter(r => !r.success).length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in cleanup-all-users function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);