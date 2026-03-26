import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Iniciando sincronización de datos profiles <-> colaboradores');

    // Sincronizar emails que no coinciden
    const { data: mismatchedEmails, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        first_name,
        last_name
      `);

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      throw fetchError;
    }

    let syncCount = 0;
    const syncResults = [];

    for (const profile of mismatchedEmails || []) {
      // Buscar colaborador con email similar (sin considerar dominio exacto)
      const { data: colaborador, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select('id, email, nombre, apellidos')
        .or(`email.eq.${profile.email},email.ilike.%${profile.email?.split('@')[0]}%`)
        .single();

      if (colaboradorError || !colaborador) {
        console.log(`⚠️ No se encontró colaborador para profile: ${profile.email}`);
        continue;
      }

      // Si los emails no coinciden exactamente, actualizar profile
      if (profile.email !== colaborador.email) {
        console.log(`🔄 Sincronizando: ${profile.email} → ${colaborador.email}`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ email: colaborador.email })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Error updating profile ${profile.id}:`, updateError);
          syncResults.push({
            profile_id: profile.id,
            old_email: profile.email,
            new_email: colaborador.email,
            success: false,
            error: updateError.message
          });
        } else {
          syncCount++;
          syncResults.push({
            profile_id: profile.id,
            old_email: profile.email,
            new_email: colaborador.email,
            success: true
          });
        }
      }
    }

    console.log(`✅ Sincronización completada: ${syncCount} registros actualizados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronización completada: ${syncCount} registros actualizados`,
        syncResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Error en sincronización:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Error durante la sincronización de datos'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});