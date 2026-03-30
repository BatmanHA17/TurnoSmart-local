// Sprint 5.2 — Web Push Notification sender (STUB)
//
// TODO (production): Replace this stub with a full VAPID implementation.
//   - Add VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY to Supabase secrets.
//   - Use a Deno-compatible web-push library (e.g. https://deno.land/x/web_push)
//     or implement the VAPID JWT + encrypted payload manually via SubtleCrypto.
//   - The stub logs subscription endpoints and returns metadata — it does NOT
//     deliver actual push messages to browser endpoints yet.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://povgwdbnyqdcygedcijl.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SendPushPayload {
  userId: string;
  title: string;
  body?: string;
  url?: string;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: SendPushPayload = await req.json();
    const { userId, title, body, url } = payload;

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch push subscriptions for this user
    const { data: subscriptions, error: dbError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (dbError) {
      console.error("[send-push-notification] DB error:", dbError);
      throw dbError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-push-notification] No subscriptions for user:", userId);
      return new Response(
        JSON.stringify({ sent: 0, message: "No push subscriptions found for user" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. STUB: Log what would be sent and update last_used_at
    //    In production, iterate subscriptions and call the Web Push protocol
    //    endpoint using VAPID-signed JWT + encrypted AES-GCM payload.
    console.log(
      `[send-push-notification] Would send to ${subscriptions.length} subscription(s) for user ${userId}:`,
      { title, body, url }
    );

    const endpoints = subscriptions.map((s) => s.endpoint);

    // Update last_used_at for all matched subscriptions
    await supabase
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        sent: subscriptions.length,
        endpoints,
        note: "STUB — real VAPID delivery not yet implemented. Set VAPID_PRIVATE_KEY secret and add web-push library for production.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-push-notification] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
