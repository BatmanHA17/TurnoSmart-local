// Deno Edge Function: check-user-exists
// Checks if a user exists by email using service role (bypasses RLS safely)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if user exists as colaborador first (this is the main use case)
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from("colaboradores")
      .select("id, email, status")
      .eq("email", email)
      .eq("status", "activo")
      .maybeSingle();

    // Check if user has password set in auth
    let hasPassword = false;
    if (colaboradorData) {
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const existingUser = authUser.users?.find(u => u.email === email);
      hasPassword = !!existingUser && existingUser.user_metadata?.has_password !== false;
    }

    if (colaboradorError) {
      console.error("Error checking colaboradores:", colaboradorError);
    }

    const isExistingColaborador = !!colaboradorData;
    
    if (isExistingColaborador) {
      console.log("Found active colaborador for:", email);
      return new Response(
        JSON.stringify({ 
          exists: true, 
          isColaborador: true,
          hasPassword,
          note: "User exists as active colaborador" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check profiles table as fallback
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("Error checking profiles:", profileError);
    }

    const existsInProfiles = !!profileData;

    // Always check auth.users as well to ensure we catch all valid users
    let existsInAuth = false;
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email === email);
      existsInAuth = !!authUser;
      console.log("Auth check result for", email, ":", existsInAuth);
    } catch (authError) {
      console.error("Error checking auth.users:", authError);
    }

    const finalExists = existsInProfiles || existsInAuth;
    console.log("Final user check for", email, "- profiles:", existsInProfiles, "auth:", existsInAuth, "result:", finalExists);

    return new Response(
      JSON.stringify({
        exists: finalExists,
        isColaborador: false,
        hasPassword: false,
        note: finalExists ? "User exists" : "User not found"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
