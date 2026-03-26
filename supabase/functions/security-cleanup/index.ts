import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceKey);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting security cleanup tasks...");
    
    // 1. Clean up expired verification codes
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_verification_codes');
    
    if (cleanupError) {
      console.error("Error cleaning up verification codes:", cleanupError);
    } else {
      console.log("Successfully cleaned up expired verification codes");
    }

    // 2. Log security cleanup activity
    await supabase.rpc('log_activity', {
      _user_name: 'System',
      _action: 'security_cleanup',
      _entity_type: 'system',
      _establishment: 'SYSTEM',
      _details: JSON.stringify({
        task: 'automated_security_cleanup',
        timestamp: new Date().toISOString(),
        tasks_completed: ['cleanup_expired_verification_codes']
      })
    });

    // 3. Check for suspicious activity patterns (multiple failed login attempts)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: suspiciousActivity } = await supabase
      .from('activity_log')
      .select('user_name, count(*)')
      .eq('action', 'failed_login')
      .gte('created_at', oneHourAgo)
      .group('user_name')
      .having('count(*) > 5');

    if (suspiciousActivity && suspiciousActivity.length > 0) {
      console.log("Detected suspicious login activity:", suspiciousActivity);
      
      // Log security alert
      await supabase.rpc('log_activity', {
        _user_name: 'System',
        _action: 'security_alert',
        _entity_type: 'security',
        _establishment: 'SYSTEM',
        _details: JSON.stringify({
          alert_type: 'suspicious_login_activity',
          affected_users: suspiciousActivity,
          timestamp: new Date().toISOString()
        })
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Security cleanup completed successfully",
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error in security cleanup:", error);
    return new Response(
      JSON.stringify({ error: "Security cleanup failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});