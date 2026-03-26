import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

import { getCorsHeaders } from '../_shared/cors.ts';
interface AcceptInviteRequest {
  token: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper para hash del token
async function hashToken(token: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mapeo de roles a dashboards (helper function)
function dashboardByRole(role: string): string {
  const dashboards = {
    OWNER: '/dashboard-owner',
    ADMIN: '/dashboard-administrator', 
    MANAGER: '/dashboard-manager',
    DIRECTOR: '/dashboard-director',
    EMPLOYEE: '/dashboard-empleado',
  } as const;
  
  return dashboards[role as keyof typeof dashboards] || '/dashboard';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== 🎯 ACCEPT INVITE - START ===');
    console.log('📨 Request:', { method: req.method, url: req.url });
    
    const body = await req.json();
    console.log('📦 Request body received:', { 
      hasToken: !!body.token, 
      tokenLength: body.token?.length,
      hasPassword: !!body.password,
      hasFirstName: !!body.firstName,
      hasLastName: !!body.lastName,
      tokenPreview: body.token ? `${body.token.substring(0, 10)}...` : 'N/A'
    });
    
    const { token, password, firstName, lastName }: AcceptInviteRequest = body;
    
    if (!token) {
      console.error('❌ No token provided in request');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash del token para buscar en BD
    console.log('🔐 Hashing token...');
    const tokenHash = await hashToken(token);
    console.log('✅ Token hashed:', { 
      hashPreview: `${tokenHash.substring(0, 16)}...`,
      hashLength: tokenHash.length 
    });

    // Buscar invitación válida
    console.log('🔍 Searching for invitation with token hash...');
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        id,
        org_id,
        email,
        role,
        invited_by,
        expires_at,
        used_at,
        revoked_at
      `)
      .eq('token_hash', tokenHash)
      .single();

    console.log('📋 Invite query result:', { 
      found: !!invite,
      inviteId: invite?.id,
      email: invite?.email,
      orgId: invite?.org_id,
      role: invite?.role,
      usedAt: invite?.used_at,
      revokedAt: invite?.revoked_at,
      expiresAt: invite?.expires_at,
      hasError: !!inviteError,
      errorCode: inviteError?.code,
      errorMessage: inviteError?.message 
    });

    if (inviteError) {
      console.error('❌ Database error while fetching invite:', inviteError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error while fetching invitation',
          details: inviteError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!invite) {
      console.error('❌ No invitation found for this token hash');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Invitation found successfully');
    
    // Fetch organization info
    console.log('🏢 Fetching organization info for org_id:', invite.org_id);
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', invite.org_id)
      .single();

    if (orgError) {
      console.error('⚠️ Error fetching organization (non-critical):', orgError);
    } else {
      console.log('✅ Organization fetched:', { id: organization?.id, name: organization?.name });
    }

    // Validar que la invitación no ha sido usada, revocada o expirada
    console.log('🔒 Validating invitation status...');
    
    if (invite.used_at) {
      console.error('❌ Invitation already used at:', invite.used_at);
      return new Response(
        JSON.stringify({ error: 'This invitation has already been used' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invite.revoked_at) {
      console.error('❌ Invitation revoked at:', invite.revoked_at);
      return new Response(
        JSON.stringify({ error: 'This invitation has been revoked' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < now) {
      console.error('❌ Invitation expired. Expires:', invite.expires_at, 'Now:', now.toISOString());
      return new Response(
        JSON.stringify({ error: 'This invitation has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Invitation is valid and active');

    console.log('✅ Invitation is valid. Revoking other pending invites for this email...');
    // Revocar otras invitaciones para el mismo email DESPUÉS de validar que esta es válida
    const { error: revokeError } = await supabase
      .from('invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('org_id', invite.org_id)
      .eq('email', invite.email)
      .neq('id', invite.id)
      .is('used_at', null)
      .is('revoked_at', null);
    
    if (revokeError) {
      console.error('⚠️ Error revoking other invites (non-critical):', revokeError);
    } else {
      console.log('✅ Other invites revoked successfully');
    }

    console.log('Checking if user exists with email:', invite.email);
    
    // 🔍 PRIMERO: Verificar si es un colaborador existente en la organización
    const { data: existingColaborador, error: colaboradorCheckError } = await supabase
      .from('colaboradores')
      .select('id, nombre, apellidos, email, org_id')
      .eq('email', invite.email.toLowerCase())
      .eq('org_id', invite.org_id)
      .maybeSingle();
    
    console.log('Existing colaborador?', !!existingColaborador, 'Email searched:', invite.email);
    
    if (colaboradorCheckError && colaboradorCheckError.code !== 'PGRST116') {
      console.error('Error checking existing colaborador:', colaboradorCheckError);
    }
    
    // 🔍 SEGUNDO: Verificar si el usuario ya existe en profiles
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', invite.email.toLowerCase())
      .maybeSingle();
    
    console.log('User profile exists?', !!existingProfile, 'Email searched:', invite.email);
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user existence' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let user;
    let isNewUser = false;

    if (!existingProfile) {
      // ⚠️ Usuario nuevo detectado
      console.log("🔄 New user detected");
      
      // 🎯 CASO ESPECIAL: Es un colaborador existente que necesita vinculación
      if (existingColaborador) {
        console.log("👤 Existing colaborador needs account linking:", existingColaborador.id);
        
        // Si no viene con password, redirigir a vinculación de cuenta
        if (!password) {
          console.log("🔗 Redirecting to account linking page...");
          return new Response(
            JSON.stringify({ 
              success: false,
              requiresAccountLinking: true,
              inviteData: {
                email: invite.email,
                organizationName: organization?.name || 'Unknown Organization',
                organizationId: invite.org_id,
                role: invite.role,
                token: token,
                colaboradorName: `${existingColaborador.nombre} ${existingColaborador.apellidos}`,
                colaboradorId: existingColaborador.id
              },
              message: "Account linking required for existing colaborador"
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        // Si viene con password, crear usuario y vincularlo
        console.log("🔗 Creating user account and linking to existing colaborador...");
        
        const { data: newUserData, error: userError } = await supabase.auth.admin.createUser({
          email: invite.email.toLowerCase(),
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: existingColaborador.nombre,
            last_name: existingColaborador.apellidos,
            display_name: `${existingColaborador.nombre} ${existingColaborador.apellidos}`,
            colaborador_id: existingColaborador.id, // Vincular con colaborador existente
            invited_to_org: invite.org_id,
            invited_role: invite.role
          }
        });

        if (userError || !newUserData.user) {
          console.error('❌ Error creating user:', userError);
          return new Response(
            JSON.stringify({ error: 'Failed to create user account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        user = newUserData.user;
        isNewUser = true;
        console.log('✅ New user created and linked to colaborador:', user.id);
        
        // 🆕 CREAR MEMBERSHIP INMEDIATAMENTE después de vincular
        console.log('🔗 Creating membership immediately for linked colaborador...');
        const { error: earlyMembershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: user.id,
            org_id: invite.org_id,
            role: invite.role,
            primary: true
          });

        if (earlyMembershipError) {
          console.error('⚠️ Error creating early membership:', earlyMembershipError);
          // No fallar aquí, intentaremos de nuevo más adelante
        } else {
          console.log('✅ Early membership created successfully for linked colaborador');
        }
      } else {
        // Usuario completamente nuevo (no es colaborador existente)
        // Si no viene con password Y nombre, redirigir a registro completo
        if (!password || !firstName || !lastName) {
          console.log("📝 Redirecting to full registration page...");
          return new Response(
            JSON.stringify({ 
              success: false,
              requiresRegistration: true,
              inviteData: {
                email: invite.email,
                organizationName: organization?.name || 'Unknown Organization',
                organizationId: invite.org_id,
                role: invite.role,
                token: token
              },
              message: "Registration required for new user"
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      
      // Si viene con password, crear usuario (viene desde RegisterInvite)
      console.log("🆕 Creating new user with provided credentials...");
      
      const { data: newUserData, error: userError } = await supabase.auth.admin.createUser({
        email: invite.email.toLowerCase(),
        password: password,
        email_confirm: true, // Auto-confirmar email para usuarios invitados
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`,
          invited_to_org: invite.org_id,
          invited_role: invite.role
        }
      });

      if (userError || !newUserData.user) {
        console.error('❌ Error creating user:', userError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

        user = newUserData.user;
        isNewUser = true;
        console.log('✅ New user created:', user.id);
        
        // 🆕 CREAR MEMBERSHIP INMEDIATAMENTE después de crear usuario nuevo
        console.log('🔗 Creating membership immediately for new user...');
        const { error: earlyMembershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: user.id,
            org_id: invite.org_id,
            role: invite.role,
            primary: true
          });

        if (earlyMembershipError) {
          console.error('⚠️ Error creating early membership:', earlyMembershipError);
        } else {
          console.log('✅ Early membership created successfully for new user');
        }
      }
    } else {
      // Usuario existe - continuar con el flujo normal
      console.log('✅ Existing user found, proceeding with invite acceptance');
      
      // Obtener el usuario de auth.users
      const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
      
      if (listUsersError) {
        console.error('Error listing users:', listUsersError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify user existence' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const existingUser = existingUsers?.users?.find(u => u.email === invite.email);
      
      if (!existingUser) {
        console.error('❌ User exists in profiles but not in auth.users - data inconsistency');
        return new Response(
          JSON.stringify({ error: 'User data inconsistency detected. Please contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      user = existingUser;
    }

    // Verificar si ya tiene membership en esta organización (con logs mejorados)
    console.log('🔍 Checking for existing membership for user:', user.id);
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('memberships')
      .select('id, role')
      .eq('org_id', invite.org_id)
      .eq('user_id', user.id)
      .single();

    if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
      console.error('⚠️ Error checking membership:', membershipCheckError);
    }

    console.log('Existing membership found:', !!existingMembership);

    if (existingMembership) {
      console.log('✅ User already has membership, checking role...');
      // Ya es miembro, solo actualizar el rol si es diferente
      if (existingMembership.role !== invite.role) {
        console.log(`🔄 Updating role from ${existingMembership.role} to ${invite.role}`);
        await supabase
          .from('memberships')
          .update({ role: invite.role })
          .eq('id', existingMembership.id);
      } else {
        console.log('✅ Role already correct, no update needed');
      }
    } else {
      // Crear nueva membership (fallback si no se creó antes)
      console.log('🆕 Creating fallback membership (should have been created earlier)...');
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          org_id: invite.org_id,
          user_id: user.id,
          role: invite.role,
          primary: true,
        });

      if (membershipError) {
        console.error('❌ Error creating fallback membership:', membershipError);
        console.error('Failed data:', { org_id: invite.org_id, user_id: user.id, role: invite.role });
        return new Response(
          JSON.stringify({ error: 'Failed to create organization membership', details: membershipError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Fallback membership created successfully');
    }

    // Marcar invitación como usada
    await supabase
      .from('invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id);

    // Determinar dashboard según rol
    const redirectTo = dashboardByRole(invite.role);
    
    // Crear magic link que redirija directamente al dashboard apropiado
    console.log('🔗 Generating magic link for user:', user.email);
    console.log('🎯 Redirect URL will be:', `${Deno.env.get('APP_URL') || 'https://turnosmart.app'}${redirectTo}`);
    
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: `${Deno.env.get('APP_URL') || 'https://turnosmart.app'}${redirectTo}`
      }
    });

    if (sessionError) {
      console.error('❌ Error generating magic link:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user session', details: sessionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Magic link generated successfully');
    console.log('🔗 Action link:', session.properties?.action_link ? 'Present' : 'Missing');

    // Log del evento - IMPORTANTE: incluir org_id para evitar constraint error
    console.log('Logging activity for invite acceptance...');
    const { error: logError } = await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Unknown',
        action: 'invite.accepted',
        entity_type: 'invite',
        entity_id: invite.id,
        entity_name: invite.email,
        org_id: invite.org_id, // CRÍTICO: asegurar que org_id está presente
        details: {
          org_id: invite.org_id,
          org_name: organization?.name || 'Unknown Organization',
          role: invite.role,
          is_new_user: isNewUser
        }
      });
    
    if (logError) {
      console.error('⚠️ Error logging activity (non-critical):', logError);
    } else {
      console.log('✅ Activity logged successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        organization: {
          id: invite.org_id,
          name: organization?.name || 'Unknown Organization',
        },
        role: invite.role,
        redirectTo,
        magicLink: session.properties?.action_link,
        isNewUser
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in accept-invite function:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error',
        type: error?.name || 'UnknownError',
        details: 'Check server logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log('=== 🎯 ACCEPT INVITE - END ===');
});