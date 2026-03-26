import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

import { getCorsHeaders } from '../_shared/cors.ts';
interface VerifyCodeRequest {
  email: string;
  code: string;
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
  } catch (_e) { /* no bloquear flujo */ }
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyCodeRequest = await req.json();
    console.log('Processing code verification for email:', email, 'code:', code);

    // Validate input
    if (!email || !code) {
      console.log('Missing email or code');
      return new Response(
        JSON.stringify({ error: 'Email y código son requeridos' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking verification code...');
    
    // Check verification code
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gte('expires_at', new Date().toISOString())
      .is('verified_at', null)
      .single();

    if (verificationError || !verificationData) {
      // Log intento fallido (posible fuerza bruta)
      await logAuthEvent(supabase, 'verify_code_failed', email, null, {
        reason: 'invalid_or_expired_code',
      });
      return new Response(
        JSON.stringify({ error: 'Código incorrecto o expirado' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('Code verified, marking as used...');

    // Mark verification code as used
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verificationData.id);

    if (updateError) {
      console.error('Error updating verification code:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error marcando código como verificado' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Validar que el email pertenece a un colaborador activo (segundo cerrojo)
    const { data: colaboradores, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('email', email)
      .eq('status', 'activo');

    if (colaboradorError || !colaboradores || colaboradores.length === 0) {
      console.log('Email not authorized in verify-code:', email);
      await logAuthEvent(supabase, 'verify_code_unauthorized', email, null, {
        reason: 'not_in_colaboradores',
      });
      return new Response(
        JSON.stringify({ error: 'Email no autorizado para crear cuenta' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Checking if user already exists...');

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError);
      return new Response(
        JSON.stringify({ error: 'Error verificando usuario existente' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const userExists = existingUser.users.find(user => user.email === email);

    if (userExists) {
      console.log('User already exists, verification complete');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Código verificado exitosamente. Puedes iniciar sesión.',
          user_id: userExists.id,
          action: 'signin'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('Creating new user account...');

    // Create the user account (this will trigger the handle_new_user function)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: Math.random().toString(36) + Math.random().toString(36), // Random password since they verified via email
      email_confirm: true, // Email is already confirmed via our verification
      user_metadata: {
        email_verified: true,
        verification_method: 'code'
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(
        JSON.stringify({ error: 'Error creando cuenta de usuario' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Log nuevo usuario creado
    await logAuthEvent(supabase, 'signup_verified', email, authData.user?.id ?? null, {
      method: 'code_verification',
    });

    // Notificar al admin
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-admin-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        email,
        user_id: authData.user?.id,
        action: 'signup',
        metadata: { source: 'verify-code', method: 'email_code' },
      }),
    }).catch(() => { /* no bloquear flujo */ });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Código verificado exitosamente. Cuenta creada.',
        user_id: authData.user?.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in verify-code function:', error);
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