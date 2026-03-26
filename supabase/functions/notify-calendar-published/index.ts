import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

import { getCorsHeaders } from '../_shared/cors.ts';
interface CalendarPublishedPayload {
  org_id: string;
  week_start: string;
  week_end: string;
  affectedEmployeeIds?: string[]; // IDs de empleados afectados (opcional)
  isModification?: boolean; // True si es re-publicación con cambios
  shifts: Array<{
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    name: string;
    breakDuration?: string;
  }>;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: CalendarPublishedPayload = await req.json();
    console.log('📅 Calendar published notification triggered:', payload);

    // Agrupar turnos por empleado
    const shiftsByEmployee = new Map<string, typeof payload.shifts>();
    payload.shifts.forEach(shift => {
      if (!shiftsByEmployee.has(shift.employeeId)) {
        shiftsByEmployee.set(shift.employeeId, []);
      }
      shiftsByEmployee.get(shift.employeeId)!.push(shift);
    });

    // Filtrar solo empleados afectados si se especificaron
    const employeesToNotify = payload.affectedEmployeeIds 
      ? Array.from(shiftsByEmployee.keys()).filter(empId => 
          payload.affectedEmployeeIds!.includes(empId)
        )
      : Array.from(shiftsByEmployee.keys());

    if (employeesToNotify.length === 0) {
      console.log('✨ No affected employees to notify - skipping email sending');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No employees affected by changes' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`📧 Sending emails to ${employeesToNotify.length} affected employees`);

    // Enviar email a cada empleado con sus turnos de la semana
    for (const employeeId of employeesToNotify) {
      const employeeShifts = shiftsByEmployee.get(employeeId)!;
      try {
        // Obtener datos del empleado
        const { data: employee, error: employeeError } = await supabaseClient
          .from('colaboradores')
          .select('nombre, apellidos, email')
          .eq('id', employeeId)
          .single();

        if (employeeError || !employee?.email) {
          console.error(`❌ Error getting employee ${employeeId}:`, employeeError);
          continue;
        }

        // Ordenar turnos por fecha
        const sortedShifts = employeeShifts.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Construir HTML del email - Optimizado para Gmail
        const shiftsHtml = sortedShifts.map(shift => {
          const date = new Date(shift.date);
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
          const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          
          return `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                &#8203;<b>${dayName.charAt(0).toUpperCase() + dayName.slice(1)}</b>&#8203;<br>
                <span style="color:#6b7280;font-size:13px;">${dateStr}</span>
              </td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                ${shift.startTime} - ${shift.endTime}
                ${shift.breakDuration ? `<br><span style="color:#6b7280;font-size:13px;">Descanso: ${shift.breakDuration}</span>` : ''}
              </td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                ${shift.name}
              </td>
            </tr>
          `;
        }).join('');

        // Determinar título y mensaje según si es modificación
        const isModification = payload.isModification || false;
        const headerTitle = isModification ? '✨ Calendario Actualizado' : '📅 Calendario Publicado';
        const weekStartStr = new Date(payload.week_start).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        const weekEndStr = new Date(payload.week_end).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        const greetingMessage = isModification 
          ? `Se han realizado <b>modificaciones</b> en tu calendario de turnos para la semana del <b>${weekStartStr}</b> al <b>${weekEndStr}</b>.`
          : `Se ha publicado tu calendario de turnos para la semana del <b>${weekStartStr}</b> al <b>${weekEndStr}</b>.`;

        // Versión texto plano (fallback)
        let plainText = `Hola ${employee.nombre},\n\n`;
        plainText += isModification 
          ? `Se han realizado modificaciones en tu calendario de turnos para la semana del ${weekStartStr} al ${weekEndStr}.\n\n`
          : `Tu calendario de turnos para la semana del ${weekStartStr} al ${weekEndStr} ha sido publicado.\n\n`;
        plainText += 'TUS TURNOS ESTA SEMANA:\n\n';
        sortedShifts.forEach(shift => {
          const date = new Date(shift.date);
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
          plainText += `${dayName.toUpperCase()} ${date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}\n`;
          plainText += `  ${shift.startTime} - ${shift.endTime}\n`;
          plainText += `  ${shift.name}\n\n`;
        });
        plainText += '\nAccede a tu calendario completo en: https://turnosmart.app/dashboard\n\n';
        plainText += 'Este es un mensaje automático de TurnoSmart®';

        const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${headerTitle}</title>
<style>
body{margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;}
.container{max-width:600px;margin:0 auto;background:#fff;}
.header{background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:25px;text-align:center;}
.badge{background:rgba(255,255,255,0.2);color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;display:inline-block;margin-top:8px;font-weight:600;}
.content{padding:25px;background:#f9fafb;}
.card{background:#fff;border-radius:8px;padding:18px;margin:20px 0;}
.button{background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;}
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
Tus turnos para la semana del ${weekStartStr} al ${weekEndStr} - TurnoSmart
</div>
<div class="container">
<div class="header">
<h1 style="color:#fff;margin:0 0 8px 0;font-size:26px;">${isModification ? '✨' : '📅'} TurnoSmart®</h1>
<p style="color:rgba(255,255,255,0.95);margin:0;font-size:15px;">${headerTitle}</p>
${isModification ? '<span class="badge">MODIFICADO</span>' : ''}
</div>
<div class="content">
<p style="font-size:15px;margin:0 0 16px 0;">Hola <b>${employee.nombre} ${employee.apellidos}</b>,</p>
<p style="font-size:15px;margin:0 0 20px 0;">${greetingMessage}</p>
<div class="card">
<h2 style="color:#1a1a1a;margin:0 0 14px 0;font-size:18px;border-bottom:2px solid #1a1a1a;padding-bottom:8px;">Tus turnos esta semana</h2>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr style="background:#f3f4f6;">
<td style="padding:8px;border-bottom:2px solid #e5e7eb;"><b>Día</b></td>
<td style="padding:8px;border-bottom:2px solid #e5e7eb;"><b>Horario</b></td>
<td style="padding:8px;border-bottom:2px solid #e5e7eb;"><b>Turno</b></td>
</tr>
${shiftsHtml}
</table>
</div>
<div style="font-size:1px;line-height:1px;color:transparent;">&nbsp;</div>
<center>
<a href="https://turnosmart.app/dashboard" class="button">📅 Ver mi calendario completo</a>
</center>
<p style="color:#6b7280;font-size:13px;margin:20px 0 0 0;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
Este es un mensaje automático de TurnoSmart®. Si tienes dudas, contacta con tu responsable.
</p>
</div>
</div>
</body>
</html>`.trim();

        // Enviar email usando Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
          console.error('❌ RESEND_API_KEY not configured');
          continue;
        }

        // Determinar si es modificación o primera publicación
        const emailSubject = isModification
          ? `✨ Tu calendario ha sido actualizado`
          : `📅 Tu calendario semanal ha sido publicado`;

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'TurnoSmart <notificaciones@turnosmart.app>',
            to: [employee.email],
            subject: emailSubject,
            html: emailHtml,
            text: plainText,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error(`❌ Error sending email to ${employee.email}:`, errorText);
        } else {
          console.log(`✅ Email sent to ${employee.nombre} ${employee.apellidos} (${employee.email})`);
        }

      } catch (error) {
        console.error(`❌ Error processing employee ${employeeId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Emails sent to ${employeesToNotify.length} affected employees` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in notify-calendar-published:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
