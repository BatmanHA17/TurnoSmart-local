import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

import { getCorsHeaders } from '../_shared/cors.ts';
interface SignupRequest {
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: SignupRequest = await req.json();

    console.log('Processing signup for email:', email);

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son requeridos' }),
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

    // Validar que el email pertenece a un colaborador activo
    const { data: colaboradores, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('email', email)
      .eq('status', 'activo');

    if (colaboradorError || !colaboradores || colaboradores.length === 0) {
      console.log('Email not in colaboradores, rejecting:', email);
      return new Response(
        JSON.stringify({ error: 'Email no autorizado para registrarse' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate verification code and store it
    const result = await supabase.rpc('handle_user_signup', {
      user_email: email,
      user_password: password,
      confirmation_url: `${Deno.env.get('SITE_URL') || 'https://turnosmart.app'}/auth?verify=true`
    });

    if (result.error) {
      console.error('Error in handle_user_signup:', result.error);
      return new Response(
        JSON.stringify({ error: 'Error procesando registro' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const signupResult = result.data;
    console.log('Signup result:', signupResult);

    if (!signupResult.success) {
      return new Response(
        JSON.stringify({ error: signupResult.error || 'Error en el registro' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Get the verification code from database
    const { data: verificationData, error: verifyError } = await supabase
      .from('verification_codes')
      .select('code')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verifyError || !verificationData) {
      console.error('Error getting verification code:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Error generando código de verificación' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Send verification email
    console.log('Sending verification email...');
    const emailResponse = await supabase.functions.invoke('send-verification-email', {
      body: {
        email: email,
        code: verificationData.code
      }
    });

    if (emailResponse.error) {
      console.error('Error sending verification email:', emailResponse.error);
      // Don't fail the signup if email fails, just log it
      console.log('Signup completed but email failed to send');
    } else {
      console.log('Verification email sent successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registro iniciado. Revisa tu email para el código de verificación.',
        email: email,
        needsVerification: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in user-signup-with-verification function:', error);
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