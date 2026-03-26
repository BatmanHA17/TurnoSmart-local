import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'
// Initialize clients
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
    console.log('Starting deletion warning email process...');

    // Obtener usuarios que necesitan notificación (21 días)
    const { data: usersToNotify, error: queryError } = await supabase.rpc(
      'get_users_for_deletion_notification'
    );

    if (queryError) {
      console.error('Error querying users for notification:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query users for notification' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!usersToNotify || usersToNotify.length === 0) {
      console.log('No users need deletion warning notification');
      return new Response(
        JSON.stringify({ 
          message: 'No users need deletion warning notification',
          count: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${usersToNotify.length} users to notify`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Procesar cada usuario
    for (const user of usersToNotify) {
      try {
        const deletionDate = new Date(user.deleted_at);
        const finalDeletionDate = new Date(deletionDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        const daysRemaining = Math.ceil((finalDeletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

        const emailContent = `
          <h2>⚠️ Aviso de Eliminación de Cuenta - TurnoSmart</h2>
          
          <p>Hola ${user.display_name || 'Usuario'},</p>
          
          <p>Tu cuenta en TurnoSmart fue marcada para eliminación el ${deletionDate.toLocaleDateString('es-ES')}.</p>
          
          <p><strong>Tu cuenta será eliminada permanentemente en ${daysRemaining} días (${finalDeletionDate.toLocaleDateString('es-ES')}) si no tomas ninguna acción.</strong></p>
          
          <h3>¿Qué puedes hacer?</h3>
          
          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>✅ Para reactivar tu cuenta:</h4>
            <p>Simplemente inicia sesión en TurnoSmart antes del ${finalDeletionDate.toLocaleDateString('es-ES')} y tu cuenta será reactivada automáticamente.</p>
            <p><a href="https://turnosmart.app" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reactivar mi cuenta</a></p>
          </div>
          
          <h3>⚡ Eliminación Automática</h3>
          <p>Si no reactivas tu cuenta antes del ${finalDeletionDate.toLocaleDateString('es-ES')}, se eliminarán permanentemente:</p>
          <ul>
            <li>Tu perfil de usuario</li>
            <li>Todos tus datos personales</li>
            <li>Tu historial en la aplicación</li>
          </ul>
          
          <p><em>Esta eliminación es irreversible y cumple con las normativas GDPR de protección de datos.</em></p>
          
          <hr style="margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px;">
            Este email fue enviado desde TurnoSmart - Sistema Integral de Gestión de Personal para Hostelería.<br>
            Si tienes preguntas, contacta con el administrador del sistema.
          </p>
        `;

        // Enviar email usando fetch directo
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: "TurnoSmart <noreply@turnosmart.app>",
            to: [user.email],
            subject: `⚠️ Tu cuenta TurnoSmart será eliminada en ${daysRemaining} días`,
            html: emailContent,
          }),
        });

        if (!emailResponse.ok) {
          console.error(`Failed to send email to ${user.email}:`, emailResponse.status, emailResponse.statusText);
          errorCount++;
          errors.push(`${user.email}: ${emailResponse.status} ${emailResponse.statusText}`);
        } else {
          console.log(`Email sent successfully to ${user.email}`);
          
          // Marcar usuario como notificado
          const { error: markError } = await supabase.rpc(
            'mark_user_notified', 
            { _user_id: user.user_id }
          );
          
          if (markError) {
            console.error(`Failed to mark user ${user.user_id} as notified:`, markError);
          }
          
          successCount++;
        }
        
      } catch (userError: any) {
        console.error(`Error processing user ${user.email}:`, userError);
        errorCount++;
        errors.push(`${user.email}: ${userError.message}`);
      }
    }

    console.log(`Deletion warning process completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        message: 'Deletion warning emails processed',
        total_users: usersToNotify.length,
        success_count: successCount,
        error_count: errorCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in send-deletion-warning:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});