import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

import { getCorsHeaders } from '../_shared/cors.ts';
const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  console.log('Complete database cleanup function called');
  
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

    console.log('Starting complete database cleanup...');
    
    const cleanupResults = {
      users: 0,
      tables: [] as string[],
      errors: [] as string[]
    };

    // Step 1: Delete all data from application tables in correct order to avoid FK violations
    const tablesToCleanup = [
      // Dependencies first (child tables)
      'cuadrante_assignments',
      'daily_occupancy',
      'employee_shifts',
      'calendar_shifts',
      'absence_requests',
      'compensatory_time_history',
      'compensatory_time_off',
      'contract_history',
      'user_permissions',
      'colaborador_roles',
      'activity_log',
      'invites',
      'memberships',
      'verification_codes',
      'user_roles',
      'turnos_publicos',
      'saved_shifts',
      'rgpd_settings',
      
      // Main entities
      'colaboradores',
      'employees',
      'cuadrantes',
      'jobs',
      'establishments',
      'occupancy_budgets',
      'organizations',
      'profiles'
    ];

    // Clean each table
    for (const tableName of tablesToCleanup) {
      try {
        console.log(`Cleaning table: ${tableName}`);
        
        const { error } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        
        if (error) {
          console.error(`Error cleaning table ${tableName}:`, error);
          cleanupResults.errors.push(`${tableName}: ${error.message}`);
        } else {
          console.log(`Successfully cleaned table: ${tableName}`);
          cleanupResults.tables.push(tableName);
        }
      } catch (err: any) {
        console.error(`Exception cleaning table ${tableName}:`, err);
        cleanupResults.errors.push(`${tableName}: ${err.message}`);
      }
    }

    // Step 2: Delete all users from auth.users (this will cascade to any remaining references)
    console.log('Getting all users for deletion...');
    
    const { data: users, error: getUsersError } = await supabase.auth.admin.listUsers();
    
    if (getUsersError) {
      console.error('Error getting users:', getUsersError);
      cleanupResults.errors.push(`Users fetch: ${getUsersError.message}`);
    } else {
      console.log(`Found ${users.users.length} users to delete`);
      
      // Delete each user
      for (const user of users.users) {
        console.log(`Deleting user: ${user.email} (${user.id})`);
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${user.email}:`, deleteError);
          cleanupResults.errors.push(`User ${user.email}: ${deleteError.message}`);
        } else {
          console.log(`Successfully deleted user: ${user.email}`);
          cleanupResults.users++;
        }
      }
    }

    console.log('Complete database cleanup finished');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Limpieza completa de la base de datos finalizada',
        results: {
          usersDeleted: cleanupResults.users,
          tablesCleared: cleanupResults.tables.length,
          tablesClearedList: cleanupResults.tables,
          errorCount: cleanupResults.errors.length,
          errors: cleanupResults.errors
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in complete database cleanup function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error interno del servidor durante la limpieza',
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