import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// VAPID public key — real key set via VITE_VAPID_PUBLIC_KEY env var in production
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ??
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBLVilong5Nkbg";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "denied"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has a subscription in DB on mount
  useEffect(() => {
    if (!user || !isSupported) return;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (!existing) {
          setIsSubscribed(false);
          return;
        }

        const { data, error } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("endpoint", existing.endpoint)
          .maybeSingle();

        setIsSubscribed(!error && data !== null);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, [user, isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return;

    setIsLoading(true);
    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        return;
      }

      // 2. Wait for SW to be ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe via Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Extract keys
      const rawKeys = subscription.getKey
        ? {
            p256dh: subscription.getKey("p256dh"),
            auth: subscription.getKey("auth"),
          }
        : { p256dh: null, auth: null };

      const p256dh = rawKeys.p256dh
        ? btoa(String.fromCharCode(...new Uint8Array(rawKeys.p256dh)))
        : "";
      const auth = rawKeys.auth
        ? btoa(String.fromCharCode(...new Uint8Array(rawKeys.auth)))
        : "";

      // 5. Persist to DB (upsert to handle re-subscription)
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;

      setIsSubscribed(true);
    } catch (err) {
      console.error("[usePushNotifications] subscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return;

    setIsLoading(true);
    try {
      // 1. Get active subscription from Push Manager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 2. Unsubscribe from browser
        await subscription.unsubscribe();

        // 3. Delete from DB
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("[usePushNotifications] unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
