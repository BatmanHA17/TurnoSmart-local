import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

import { getCorsHeaders } from '../_shared/cors.ts';
interface SignupRequest {
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  console.log('Simple signup function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: SignupRequest = await req.json();
    console.log('Processing signup for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
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

    if (colaboradorError) {
      console.error('Error checking colaborador:', colaboradorError);
      return new Response(
        JSON.stringify({ error: 'Error verificando usuario' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!colaboradores || colaboradores.length === 0) {
      console.log('Email not in colaboradores, rejecting signup:', email);
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
          metadata: { reason: 'not_in_colaboradores', source: 'simple-signup' },
        }),
      }).catch(() => {});
      return new Response(
        JSON.stringify({ error: 'Email no autorizado para registrarse' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Generating verification code...');

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        email: email,
        code: verificationCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (codeError) {
      console.error('Error storing verification code:', codeError);
      return new Response(
        JSON.stringify({ error: 'Error generando código de verificación' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Verification code stored, sending email using Supabase...');

    // Send verification email using Supabase function
    try {
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
        'send-verification-email',
        {
          body: {
            email: email,
            code: verificationCode
          }
        }
      );

      console.log('Email sent successfully:', emailResponse);

      if (emailError) {
        console.error('Error sending email:', emailError);
        throw new Error(`Email sending failed: ${emailError.message}`);
      }
    } catch (emailError: any) {
      console.error('Email sending error:', emailError);
      return new Response(
        JSON.stringify({ 
          error: 'Error enviando email de verificación',
          details: emailError.message 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Código de verificación enviado. Revisa tu email.',
        email: email,
        needsVerification: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in simple-signup function:', error);
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