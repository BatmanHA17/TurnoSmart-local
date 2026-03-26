import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'
interface DeleteResult {
  userId: string
  email: string
  success: boolean
  error?: string
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting cleanup of all users except owner@turnosmart.app...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: authError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${authUsers.users.length} total users`)

    const results: DeleteResult[] = []
    let deletedCount = 0
    let errorCount = 0

    // Filter out owner@turnosmart.app
    const usersToDelete = authUsers.users.filter(user => user.email !== 'owner@turnosmart.app')
    
    console.log(`Will delete ${usersToDelete.length} users (keeping owner@turnosmart.app)`)

    for (const user of usersToDelete) {
      try {
        console.log(`Deleting user: ${user.email} (${user.id})`)
        
        // Delete user roles
        const { error: rolesError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
        
        if (rolesError) {
          console.error(`Error deleting roles for ${user.email}:`, rolesError)
        }

        // Delete user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)
        
        if (profileError) {
          console.error(`Error deleting profile for ${user.email}:`, profileError)
        }

        // Delete from auth
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (authDeleteError) {
          console.error(`Error deleting auth user ${user.email}:`, authDeleteError)
          results.push({
            userId: user.id,
            email: user.email || 'unknown',
            success: false,
            error: authDeleteError.message
          })
          errorCount++
        } else {
          console.log(`Successfully deleted user: ${user.email}`)
          results.push({
            userId: user.id,
            email: user.email || 'unknown',
            success: true
          })
          deletedCount++
        }
      } catch (error) {
        console.error(`Unexpected error deleting user ${user.email}:`, error)
        results.push({
          userId: user.id,
          email: user.email || 'unknown',
          success: false,
          error: error.message
        })
        errorCount++
      }
    }

    console.log(`Cleanup completed: ${deletedCount} deleted, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed. Kept owner@turnosmart.app, deleted ${deletedCount} other users.`,
        deletedCount,
        errorCount,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in cleanup:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error during cleanup', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})