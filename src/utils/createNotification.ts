import { supabase } from "@/integrations/supabase/client";

export async function createNotification(params: {
  userId: string;
  orgId?: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  /** Also dispatch a Web Push notification to the user's registered browsers. */
  push?: boolean;
}) {
  await supabase.from("notifications").insert({
    user_id: params.userId,
    org_id: params.orgId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data ?? {},
    action_url: params.actionUrl,
  });

  // Fire-and-forget: attempt Web Push if requested.
  // Does not block the caller; failures are silently ignored.
  if (params.push) {
    supabase.functions
      .invoke("send-push-notification", {
        body: {
          userId: params.userId,
          title: params.title,
          body: params.body,
          url: params.actionUrl,
        },
      })
      .catch(() => {
        // Intentional no-op — push is best-effort
      });
  }
}
