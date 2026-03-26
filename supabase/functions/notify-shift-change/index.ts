import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = "https://povgwdbnyqdcygedcijl.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

interface ShiftChangePayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: any;
  old_record?: any;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: ShiftChangePayload = await req.json();
    
    console.log("📬 Shift change detected:", {
      type: payload.type,
      shift_id: payload.record?.id,
      employee_id: payload.record?.employee_id,
    });

    const shiftData = payload.record;
    const oldShiftData = payload.old_record;
    const orgId = shiftData.org_id;

    // 1. Verificar si las notificaciones están habilitadas para esta org
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("org_id", orgId)
      .single();

    if (settingsError || !settings) {
      console.log("⚠️ No notification settings found for org:", orgId);
      return new Response(JSON.stringify({ skipped: "no_settings" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.shift_notifications_enabled) {
      console.log("🔕 Notifications disabled for org:", orgId);
      return new Response(JSON.stringify({ skipped: "notifications_disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verificar si debe notificar según el tipo de operación
    const shouldNotify =
      (payload.type === "INSERT" && settings.notify_on_create) ||
      (payload.type === "UPDATE" && settings.notify_on_update) ||
      (payload.type === "DELETE" && settings.notify_on_delete);

    if (!shouldNotify) {
      console.log("🔕 Notification type disabled:", payload.type);
      return new Response(JSON.stringify({ skipped: "type_disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Obtener datos del empleado (email + nombre)
    const { data: employee, error: employeeError } = await supabase
      .from("colaboradores")
      .select("email, nombre, apellidos")
      .eq("id", shiftData.employee_id)
      .single();

    if (employeeError || !employee || !employee.email) {
      console.log("⚠️ Employee not found or no email:", shiftData.employee_id);
      return new Response(JSON.stringify({ skipped: "no_employee_email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Obtener nombre del manager (opcional, de los metadatos del shift)
    const managerName = "Tu manager";

    // 5. Construir el contenido del email según el tipo de operación
    let emailSubject = "";
    let emailHtml = "";

    const employeeName = `${employee.nombre} ${employee.apellidos}`;
    const shiftDate = new Date(shiftData.date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (payload.type === "INSERT") {
      emailSubject = `🆕 Nuevo turno asignado - ${shiftDate}`;
      emailHtml = `
        <h2>¡Hola ${employeeName}!</h2>
        <p><strong>${managerName}</strong> te ha asignado un nuevo turno:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>📅 Fecha:</strong> ${shiftDate}</p>
          <p><strong>🏷️ Turno:</strong> ${shiftData.shift_name}</p>
          ${shiftData.start_time ? `<p><strong>🕐 Hora inicio:</strong> ${shiftData.start_time}</p>` : ""}
          ${shiftData.end_time ? `<p><strong>🕐 Hora fin:</strong> ${shiftData.end_time}</p>` : ""}
          ${shiftData.break_duration ? `<p><strong>☕ Descanso:</strong> ${shiftData.break_duration}</p>` : ""}
          ${shiftData.notes ? `<p><strong>📝 Notas:</strong> ${shiftData.notes}</p>` : ""}
        </div>
        <p>Accede a tu calendario para ver más detalles.</p>
        <p style="color: #6b7280; font-size: 14px;">Este es un email automático. No respondas a este mensaje.</p>
      `;
    } else if (payload.type === "UPDATE") {
      emailSubject = `✏️ Turno modificado - ${shiftDate}`;
      emailHtml = `
        <h2>¡Hola ${employeeName}!</h2>
        <p><strong>${managerName}</strong> ha modificado tu turno del <strong>${shiftDate}</strong>:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>🏷️ Turno:</strong> ${shiftData.shift_name}</p>
          ${shiftData.start_time ? `<p><strong>🕐 Hora inicio:</strong> ${shiftData.start_time}</p>` : ""}
          ${shiftData.end_time ? `<p><strong>🕐 Hora fin:</strong> ${shiftData.end_time}</p>` : ""}
          ${shiftData.break_duration ? `<p><strong>☕ Descanso:</strong> ${shiftData.break_duration}</p>` : ""}
          ${shiftData.notes ? `<p><strong>📝 Notas:</strong> ${shiftData.notes}</p>` : ""}
        </div>
        <p>Revisa tu calendario para ver los cambios completos.</p>
        <p style="color: #6b7280; font-size: 14px;">Este es un email automático. No respondas a este mensaje.</p>
      `;
    } else if (payload.type === "DELETE") {
      const deletedDate = new Date(oldShiftData.date).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      emailSubject = `🗑️ Turno cancelado - ${deletedDate}`;
      emailHtml = `
        <h2>¡Hola ${employeeName}!</h2>
        <p><strong>${managerName}</strong> ha cancelado tu turno del <strong>${deletedDate}</strong>:</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>🏷️ Turno cancelado:</strong> ${oldShiftData.shift_name}</p>
          ${oldShiftData.start_time ? `<p><strong>🕐 Era de:</strong> ${oldShiftData.start_time} a ${oldShiftData.end_time}</p>` : ""}
        </div>
        <p>Consulta tu calendario actualizado para más información.</p>
        <p style="color: #6b7280; font-size: 14px;">Este es un email automático. No respondas a este mensaje.</p>
      `;
    }

    // 6. Enviar el email usando Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TurnoSmart <noreply@turnosmart.app>",
        to: [employee.email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("❌ Error sending email via Resend:", errorData);
      throw new Error(`Resend API error: ${emailResponse.status}`);
    }

    const emailData = await emailResponse.json();
    console.log("✅ Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailData.id,
        employee_email: employee.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in notify-shift-change:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
