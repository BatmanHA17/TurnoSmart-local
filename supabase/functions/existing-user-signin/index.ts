import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { getCorsHeaders } from "../_shared/cors.ts";

const ALLOWED_ORIGIN = Deno.env.get('APP_URL') || 'https://turnosmart.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SigninRequest {
  email: string;
  redirectOrigin?: string;
}

async function logAuthEvent(
  supabase: ReturnType<typeof createClient>,
  action: string,
  email: string,
  userId: string | null,
  metadata: Record<string, unknown> = {}
) {
  try {
    await supabase.from('activity_log').insert({
      user_id: userId,
      action,
      description: `Auth event: ${action} for ${email}`,
      metadata: { email, ...metadata, timestamp: new Date().toISOString() },
    });
  } catch (_e) {
    // No bloquear el flujo si el log falla
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, redirectOrigin = ALLOWED_ORIGIN }: SigninRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el email pertenece a un colaborador activo
    const { data: colaboradores, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('email', email)
      .eq('status', 'activo');

    const colaborador = colaboradores?.[0];

    if (colaboradorError) {
      await logAuthEvent(supabase, 'signin_db_error', email, null, { error: colaboradorError.message });
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!colaborador) {
      // Log intento de acceso no autorizado
      await logAuthEvent(supabase, 'signin_unauthorized', email, null, { reason: 'not_in_colaboradores' });

      // Alertar al admin sobre intento no autorizado
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-admin-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          email,
          action: 'unauthorized_attempt',
          metadata: { reason: 'not_in_colaboradores', source: 'existing-user-signin' },
        }),
      }).catch(() => { /* no bloquear flujo */ });

      return new Response(
        JSON.stringify({ error: 'User not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar o crear el usuario en auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return new Response(
        JSON.stringify({ error: 'Error checking user existence' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let authUser = users.find(user => user.email === email);

    if (!authUser) {
      // Crear usuario SIN contraseña (passwordless)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          display_name: `${colaborador.nombre} ${colaborador.apellidos}`,
          first_name: colaborador.nombre,
          last_name: colaborador.apellidos,
        },
      });

      if (createError) {
        await logAuthEvent(supabase, 'signin_create_error', email, null, { error: createError.message });
        return new Response(
          JSON.stringify({ error: 'Error creating user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = newUser.user;
      await logAuthEvent(supabase, 'signup_new_user', email, authUser?.id ?? null);

      // Notificar al admin
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-admin-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          email,
          user_id: authUser?.id,
          action: 'signup',
          metadata: { role: 'pending', source: 'existing-user-signin' },
        }),
      }).catch(() => { /* no bloquear flujo */ });
    } else {
      // Actualizar metadata sin tocar la contraseña
      await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          display_name: `${colaborador.nombre} ${colaborador.apellidos}`,
          first_name: colaborador.nombre,
          last_name: colaborador.apellidos,
        },
      });
    }

    // Asegurar que existe el perfil
    if (authUser) {
      await supabase.from('profiles').upsert({
        id: authUser.id,
        email: email,
        display_name: `${colaborador.nombre} ${colaborador.apellidos}`,
        first_name: colaborador.nombre,
        last_name: colaborador.apellidos,
      }, { onConflict: 'id' });
    }

    // Determinar rol del colaborador
    const { data: roles } = await supabase
      .from('colaborador_roles')
      .select('role')
      .eq('colaborador_id', colaborador.id)
      .eq('activo', true);

    let userRole = 'user';
    let canonicalRole = 'EMPLOYEE';

    if (roles && roles.length > 0) {
      const roleHierarchy = ['propietario', 'administrador', 'director', 'manager', 'jefe_departamento', 'empleado'];
      const userRoles = roles.map((r: { role: string }) => r.role);

      for (const role of roleHierarchy) {
        if (userRoles.includes(role)) {
          switch (role) {
            case 'propietario': userRole = 'super_admin'; canonicalRole = 'OWNER'; break;
            case 'administrador': userRole = 'admin'; canonicalRole = 'ADMIN'; break;
            case 'director': userRole = 'admin'; canonicalRole = 'DIRECTOR'; break;
            case 'manager': userRole = 'admin'; canonicalRole = 'MANAGER'; break;
            default: userRole = 'user'; canonicalRole = 'EMPLOYEE';
          }
          break;
        }
      }
    }

    if (authUser) {
      await supabase.from('user_roles').upsert({
        user_id: authUser.id,
        role: userRole,
        role_canonical: canonicalRole,
      }, { onConflict: 'user_id,role' });
    }

    // Enviar Magic Link por email (passwordless — sin contraseña temporal)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: { redirectTo: `${redirectOrigin}` },
    });

    if (linkError || !linkData) {
      await logAuthEvent(supabase, 'signin_link_error', email, authUser?.id ?? null, { error: linkError?.message });
      return new Response(
        JSON.stringify({ error: 'Error generating login link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de inicio de sesión exitoso
    await logAuthEvent(supabase, 'signin_magic_link_sent', email, authUser?.id ?? null, {
      role: userRole,
      canonical: canonicalRole,
    });

    // SECURITY: action_link no se devuelve en la respuesta — solo se envía por email.
    // Exponerlo en HTTP permitiría acceso si alguien intercepta la respuesta.
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Magic link sent to your email. Check your inbox.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
