import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface OrganizationData {
  name: string;
  industry: string;
  country: string;
}

interface DepartmentData {
  id: string;
  name: string;
  selected: boolean;
}

interface JobData {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  hours: number;
  headcount: number;
  selected: boolean;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Parse request body
    const { organization, departments, jobs } = await req.json() as {
      organization: OrganizationData;
      departments: DepartmentData[];
      jobs: JobData[];
    };

    console.log("Received data:", { organization, departments: departments.length, jobs: jobs.length });

    // 1. Create organization
    const slug = organization.name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      || `org-${Date.now()}`;

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: organization.name,
        slug: slug,
        country: organization.country,
        sector: organization.industry || 'generic',
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      throw new Error(`Error creating organization: ${orgError.message}`);
    }

    const orgId = orgData.id;
    console.log("Organization created:", orgId);

    // 2. Create membership for the user as OWNER
    const { error: membershipError } = await supabase
      .from("memberships")
      .insert({
        org_id: orgId,
        user_id: user.id,
        role: "OWNER",
        primary: true,
      });

    if (membershipError) {
      console.error("Error creating membership:", membershipError);
      throw new Error(`Error creating membership: ${membershipError.message}`);
    }

    console.log("Membership created for user as OWNER");

    // 3. Update user profile (non-critical — profile may not exist yet for OTP users)
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          primary_org_id: orgId,
          onboarding_completed: true,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
        }, { onConflict: "id" });

      if (profileError) {
        console.error("Error upserting profile (non-critical):", profileError);
      }
    } catch (e) {
      console.error("Profile upsert failed (non-critical):", e);
    }

    // 4. Create departments in job_departments table
    // Schema: job_departments(id, name, org_id, created_at)
    const deptIdMap: Record<string, string> = {};

    for (const dept of departments) {
      const { data: deptData, error: deptError } = await supabase
        .from("job_departments")
        .insert({
          name: dept.name,
          org_id: orgId,
        })
        .select("id")
        .single();

      if (deptError) {
        console.error(`Error creating department ${dept.name}:`, deptError);
        continue;
      }

      deptIdMap[dept.id] = deptData.id;
      console.log(`Department created: ${dept.name} -> ${deptData.id}`);
    }

    // 5. Create job_titles and placeholder colaboradores
    // Schema: job_titles(id, name, seniority_level, department_id, org_id)
    // Schema: jobs(id, colaborador_id, job_title_id, org_id, start_date, end_date, status)
    // Schema: colaboradores(id, nombre, apellidos, email, department, status, org_id, job_id→jobs.id, ...)
    let colaboradoresCreated = 0;
    let jobTitlesCreated = 0;
    const timestamp = Date.now();

    for (const job of jobs) {
      // Find the department_id we just created
      const departmentId = deptIdMap[job.departmentId] || null;

      // Create job_title
      const { data: jobTitleData, error: jobTitleError } = await supabase
        .from("job_titles")
        .insert({
          name: job.title,
          department_id: departmentId,
          org_id: orgId,
          seniority_level: 1,
        })
        .select("id")
        .single();

      if (jobTitleError) {
        console.error(`Error creating job_title ${job.title}:`, jobTitleError);
        continue;
      }

      jobTitlesCreated++;
      console.log(`Job title created: ${job.title} -> ${jobTitleData.id}`);

      // Create placeholder colaboradores based on headcount
      const headcount = job.headcount || 1;
      const titleSlug = job.title.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

      for (let i = 1; i <= headcount; i++) {
        const empleadoId = `SETUP-${timestamp}-${colaboradoresCreated + 1}`;
        const placeholderEmail = `${titleSlug}-${i}-${timestamp}@setup.turnosmart.app`;

        // Step A: Create colaborador WITHOUT job_id (FK points to jobs table, not job_titles)
        // V3: Include engine_role from template (defaults to ROTA_COMPLETO in DB)
        const { data: colabData, error: colabError } = await supabase
          .from("colaboradores")
          .insert({
            nombre: job.title,
            apellidos: headcount > 1 ? `#${i}` : "(pendiente)",
            empleado_id: empleadoId,
            email: placeholderEmail,
            department: job.departmentName,
            org_id: orgId,
            status: "activo",
            tipo_contrato: "Sin especificar",
            fecha_inicio_contrato: new Date().toISOString().split("T")[0],
            tiempo_trabajo_semanal: job.hours * 5, // daily hours → weekly (5-day week)
            ...(job.engine_role ? { engine_role: job.engine_role } : {}),
          })
          .select("id")
          .single();

        if (colabError) {
          console.error(`Error creating placeholder ${job.title} #${i}:`, colabError);
          continue;
        }

        // Step B: Create jobs assignment record (links colaborador to job_title)
        const { data: jobAssignment, error: jobAssignError } = await supabase
          .from("jobs")
          .insert({
            colaborador_id: colabData.id,
            job_title_id: jobTitleData.id,
            org_id: orgId,
            start_date: new Date().toISOString().split("T")[0],
            status: "active",
          })
          .select("id")
          .single();

        if (jobAssignError) {
          console.error(`Error creating job assignment for ${job.title} #${i}:`, jobAssignError);
        } else {
          // Step C: Update colaborador.job_id to point to the jobs record
          const { error: updateError } = await supabase
            .from("colaboradores")
            .update({ job_id: jobAssignment.id })
            .eq("id", colabData.id);

          if (updateError) {
            console.error(`Error updating job_id for ${job.title} #${i}:`, updateError);
          }
        }

        colaboradoresCreated++;
      }
    }

    console.log(`Created ${jobTitlesCreated} job titles, ${colaboradoresCreated} placeholder colaboradores`);

    // 6. Create default shift templates (M/T/N/11x19/9x17/12x20/G)
    const DEFAULT_SHIFTS = [
      { name: "Mañana",      start_time: "07:00", end_time: "15:00", color: "#fbbf24", has_break: true,  total_break_time: 30 },
      { name: "Tarde",       start_time: "15:00", end_time: "23:00", color: "#f97316", has_break: true,  total_break_time: 30 },
      { name: "Noche",       start_time: "23:00", end_time: "07:00", color: "#6366f1", has_break: true,  total_break_time: 30 },
      { name: "Transición",  start_time: "11:00", end_time: "19:00", color: "#fb923c", has_break: true,  total_break_time: 30 },
      { name: "GEX Mañana",  start_time: "09:00", end_time: "17:00", color: "#fcd34d", has_break: true,  total_break_time: 30 },
      { name: "GEX Tarde",   start_time: "12:00", end_time: "20:00", color: "#fdba74", has_break: true,  total_break_time: 30 },
      { name: "Guardia",     start_time: "09:00", end_time: "21:00", color: "#f87171", has_break: false, total_break_time: 0  },
    ];

    try {
      const { count: existingCount } = await supabase
        .from("saved_shifts")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId);

      if (existingCount === 0) {
        const shiftRows = DEFAULT_SHIFTS.map((s) => ({
          name: s.name,
          start_time: s.start_time,
          end_time: s.end_time,
          color: s.color,
          access_type: "company",
          break_type: s.has_break ? "meal" : null,
          break_duration: s.has_break ? "30" : "0",
          has_break: s.has_break,
          total_break_time: s.total_break_time,
          org_id: orgId,
          is_additional_time: false,
        }));

        const { error: shiftsError } = await supabase.from("saved_shifts").insert(shiftRows);
        if (shiftsError) {
          console.error("Error creating default shifts (non-critical):", shiftsError);
        } else {
          console.log(`Created ${shiftRows.length} default shift templates`);
        }
      }
    } catch (shiftsErr) {
      console.error("Error creating default shifts (non-critical):", shiftsErr);
    }

    // 7. Log activity (non-critical)
    try {
      await supabase.rpc("log_activity", {
        _user_name: user.email || "Usuario",
        _action: "COMPLETE_ONBOARDING",
        _entity_type: "organization",
        _entity_id: orgId,
        _entity_name: organization.name,
        _details: {
          departments_count: departments.length,
          jobs_count: jobs.length,
          colaboradores_count: colaboradoresCreated,
          industry: organization.industry,
        },
      });
    } catch (logError) {
      console.error("Error logging activity (non-critical):", logError);
    }

    console.log("Onboarding completed successfully");

    // 8. Notify admin (fire & forget)
    try {
      const notifyUrl = `${supabaseUrl}/functions/v1/notify-admin-signup`;
      fetch(notifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: user.email,
          user_id: user.id,
          action: "signup",
          metadata: {
            org_name: organization.name,
            industry: organization.industry,
            country: organization.country,
            departments: departments.length,
            jobs: jobs.length,
          },
        }),
      }).catch(() => {}); // fire & forget
    } catch (_) {}

    return new Response(
      JSON.stringify({
        success: true,
        organization_id: orgId,
        departments_created: Object.keys(deptIdMap).length,
        job_titles_created: jobTitlesCreated,
        colaboradores_created: colaboradoresCreated,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in complete-onboarding:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
