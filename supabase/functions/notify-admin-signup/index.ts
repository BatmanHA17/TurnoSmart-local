import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendMail } from "../_shared/mailer.ts";

import { getCorsHeaders } from '../_shared/cors.ts';
interface NotifyAdminRequest {
  email: string;
  user_id?: string;
  action: 'signup' | 'signin' | 'unauthorized_attempt';
  metadata?: Record<string, unknown>;
}

const ADMIN_EMAIL = 'goturnosmart@gmail.com';

function buildEmailHtml(email: string, action: string, metadata: Record<string, unknown> = {}, timestamp: string): string {
  const actionLabels: Record<string, { emoji: string; title: string; color: string }> = {
    signup: { emoji: '🆕', title: 'Nuevo usuario registrado', color: '#22c55e' },
    signin: { emoji: '🔐', title: 'Login de usuario', color: '#3b82f6' },
    unauthorized_attempt: { emoji: '🚨', title: 'Intento de acceso NO AUTORIZADO', color: '#ef4444' },
  };

  const label = actionLabels[action] || { emoji: '📋', title: action, color: '#6b7280' };
  const metaRows = Object.entries(metadata)
    .filter(([k]) => k !== 'timestamp')
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#6b7280">${k}</td><td style="padding:4px 8px;font-weight:600">${v}</td></tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f9fafb;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1)">
    <div style="background:${label.color};padding:20px 24px">
      <h1 style="color:#fff;margin:0;font-size:18px">${label.emoji} TurnoSmart — ${label.title}</h1>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 16px"><strong>Hora:</strong> ${timestamp}</p>
      ${metaRows ? `<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px">${metaRows}</table>` : ''}
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        Revisa el <a href="https://supabase.com/dashboard" style="color:#696fc3">dashboard de Supabase</a> para más detalles.
      </p>
    </div>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotifyAdminRequest = await req.json();
    const { email, user_id, action, metadata = {} } = body;

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'email y action son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
    const actionLabels: Record<string, string> = {
      signup: '🆕 Nuevo registro en TurnoSmart',
      signin: '🔐 Login en TurnoSmart',
      unauthorized_attempt: '🚨 ALERTA: Intento no autorizado en TurnoSmart',
    };

    const subject = actionLabels[action] || `TurnoSmart — Evento: ${action}`;
    const html = buildEmailHtml(email, action, { ...metadata, user_id: user_id ?? 'N/A' }, timestamp);

    const result = await sendMail({
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    if (!result.ok) {
      console.error('Error sending admin notification:', result.error);
      return new Response(
        JSON.stringify({ ok: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, messageId: result.messageId }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in notify-admin-signup:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
