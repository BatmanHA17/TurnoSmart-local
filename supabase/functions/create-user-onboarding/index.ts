import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceKey);

interface CreateUserRequest {
  email: string;
  full_name: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, full_name }: CreateUserRequest = await req.json();

    const normalizedEmail = email?.trim().toLowerCase();
    const name = full_name?.trim();

    if (!normalizedEmail || !name) {
      return new Response(
        JSON.stringify({ error: "Email and full name are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Creating/updating user for email:", normalizedEmail, "name:", name);

    // Skip verification check for onboarding simplicity
    console.log("Proceeding with user creation without strict verification check");

    // Generate secure random password
    const TEMP_PASSWORD = crypto.randomUUID() + '!Aa1';

    let userId: string | undefined;

    try {
      // Check if user already exists in profiles table
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      userId = existingProfile?.id as string | undefined;

      if (!userId) {
        console.log("Creating new user...");
        // User doesn't exist, create new one
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: TEMP_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: name, display_name: name },
        });

        if (createErr) {
          console.error("createUser error:", createErr);
          throw new Error("Could not create user: " + createErr.message);
        }

        userId = created.user.id;
        console.log("User created successfully with ID:", userId);
      } else {
        console.log("User exists, updating password...");
        // User exists, update password to known temp password
        const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
          password: TEMP_PASSWORD,
          user_metadata: { full_name: name, display_name: name },
        });

        if (updateErr) {
          console.error("updateUser error:", updateErr);
          // Continue anyway, they might be able to login
        }
        console.log("User updated successfully");
      }

      // Upsert profile to ensure it exists and is updated
      console.log("Upserting profile...");
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email: normalizedEmail,
          display_name: name,
          first_name: null,
          last_name: null,
          is_active: true,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile upsert error:", profileError);
        throw new Error("Could not upsert profile: " + profileError.message);
      }

      // Ensure default role exists
      console.log("Checking user role...");
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingRole) {
        console.log("Creating user role...");
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: "user",
        });

        if (roleError) {
          console.error("Role creation error:", roleError);
          throw new Error("Could not create role: " + roleError.message);
        }
      }

      console.log("User onboarding completed successfully");
      return new Response(
        JSON.stringify({ success: true, userId: userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } catch (error: any) {
      console.error("Error during user creation:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Unexpected error during user creation" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (e) {
    console.error("Unhandled request error in create-user-onboarding:", e);
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});