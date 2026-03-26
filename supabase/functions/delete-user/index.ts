import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'
// Initialize Supabase client with service role key (admin privileges)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface DeleteUserRequest {
  userId: string;
  hardDelete?: boolean; // Nueva opción para super admins
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the current user making the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated and has admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user has admin or super_admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roles || !['admin', 'super_admin'].includes(roles.role)) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin privileges required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { userId, hardDelete = false }: DeleteUserRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar si el usuario solicitante es super_admin para hard delete
    const isSuperAdmin = roles && roles.role === 'super_admin';
    
    if (hardDelete && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only super administrators can perform hard deletes' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Admin ${user.email} attempting to ${hardDelete ? 'hard' : 'soft'} delete user: ${userId}`);

    if (hardDelete) {
      // HARD DELETE: Eliminación completa del usuario
      try {
        // 1. Eliminar roles del usuario
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (roleError) {
          console.error('Error deleting user roles:', roleError);
        }

        // 2. Eliminar perfil del usuario
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
        
        if (profileError) {
          console.error('Error deleting user profile:', profileError);
        }

        // 3. Eliminar usuario de Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        
        if (authError) {
          console.error('Error deleting user from auth:', authError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to delete user from authentication system', 
              details: authError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log(`Successfully hard deleted user: ${userId}`);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'User has been permanently deleted from the system.'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (error) {
        console.error('Error during hard delete:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to permanently delete user', 
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // SOFT DELETE: Usar la función de soft delete
    const { data: softDeleteResult, error: softDeleteError } = await supabase
      .rpc('soft_delete_user', { 
        _user_id: userId, 
        _deleted_by: user.id, 
        _reason: 'Deleted by admin' 
      });

    if (softDeleteError) {
      console.error('Error soft deleting user:', softDeleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete user', 
          details: softDeleteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!softDeleteResult) {
      // Make soft delete idempotent and provide clearer diagnostics
      // If no rows were affected, check current profile state
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, deleted_at')
        .eq('id', userId)
        .single();

      if (profileCheckError || !profileCheck) {
        console.error('Profile not found during soft delete check:', profileCheckError);
        return new Response(
          JSON.stringify({ 
            error: 'User not found'
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (profileCheck.deleted_at) {
        console.log(`User ${userId} already soft-deleted previously (idempotent success).`);
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'User already marked for deletion within grace period.'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // If here, the user exists but update did not occur for unknown reason
      console.error('Soft delete did not update any rows, unexpected state for user:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Unable to soft delete user due to unexpected state' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully soft deleted user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully. They have 30 days to reactivate their account.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in delete-user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});