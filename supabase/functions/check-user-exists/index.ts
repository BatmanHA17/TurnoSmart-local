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
      return new Response(
        JSON.stringify({ exists: false, note: "DB error while checking profiles" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const existsInProfiles = !!profileData;
    console.log("Profile check result for", email, ":", existsInProfiles);

    return new Response(
      JSON.stringify({ 
        exists: existsInProfiles,
        isColaborador: false,
        hasPassword: false,
        note: existsInProfiles ? "User exists in profiles" : "User not found"
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
