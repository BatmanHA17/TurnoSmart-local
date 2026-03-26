import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'
// Initialize Supabase client with service role key (admin privileges)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting cleanup process for users past 30-day grace period...');

    // Obtener usuarios que deben ser eliminados permanentemente (30 días)
    const { data: usersToDelete, error: queryError } = await supabase.rpc(
      'get_users_for_hard_delete'
    );

    if (queryError) {
      console.error('Error querying users for hard deletion:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query users for hard deletion' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!usersToDelete || usersToDelete.length === 0) {
      console.log('No users need to be permanently deleted');
      return new Response(
        JSON.stringify({ 
          message: 'No users need permanent deletion',
          count: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${usersToDelete.length} users to permanently delete`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const deletedUsers: string[] = [];

    // Procesar cada usuario para eliminación permanente
    for (const user of usersToDelete) {
      try {
        console.log(`Processing permanent deletion for user: ${user.email} (${user.user_id})`);

        // 1. Eliminar roles del usuario
        const { error: rolesError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id);

        if (rolesError) {
          console.warn(`Warning: failed to delete roles for user ${user.user_id}:`, rolesError.message);
        }

        // 2. Eliminar perfil del usuario
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.user_id);

        if (profileError) {
          console.error(`Failed to delete profile for user ${user.user_id}:`, profileError);
          errorCount++;
          errors.push(`${user.email}: Failed to delete profile - ${profileError.message}`);
          continue;
        }

        // 3. Eliminar usuario de Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(user.user_id);

        if (authError) {
          console.error(`Failed to delete auth user ${user.user_id}:`, authError);
          errorCount++;
          errors.push(`${user.email}: Failed to delete auth user - ${authError.message}`);
          continue;
        }

        console.log(`Successfully permanently deleted user: ${user.email} (${user.user_id})`);
        deletedUsers.push(user.email);
        successCount++;

      } catch (userError: any) {
        console.error(`Unexpected error deleting user ${user.email}:`, userError);
        errorCount++;
        errors.push(`${user.email}: Unexpected error - ${userError.message}`);
      }
    }

    console.log(`Cleanup process completed. Success: ${successCount}, Errors: ${errorCount}`);

    // Log de auditoría
    if (successCount > 0) {
      console.log(`AUDIT LOG: Permanently deleted ${successCount} users after 30-day grace period: ${deletedUsers.join(', ')}`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'User cleanup process completed',
        total_users_processed: usersToDelete.length,
        permanent_deletions: successCount,
        errors: errorCount,
        deleted_users: deletedUsers,
        error_details: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in cleanup-deleted-users:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});