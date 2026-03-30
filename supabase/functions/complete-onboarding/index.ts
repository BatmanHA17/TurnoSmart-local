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

    // 3. Update user profile with primary org
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        primary_org_id: orgId,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Non-critical, continue
    }

    // 4. Update user role to OWNER
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: user.id,
        role: "super_admin",
        role_canonical: "OWNER",
      }, {
        onConflict: "user_id,role",
      });

    if (roleError) {
      console.error("Error updating user role:", roleError);
      // Non-critical, continue
    }

    // 5. Create departments (teams)
    const deptIdMap: Record<string, string> = {};
    
    for (const dept of departments) {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: dept.name,
          description: `Departamento: ${dept.name}`,
          org_id: orgId,
          is_active: true,
        })
        .select()
        .single();

      if (teamError) {
        console.error(`Error creating team ${dept.name}:`, teamError);
        continue;
      }

      deptIdMap[dept.id] = teamData.id;
      console.log(`Team created: ${dept.name} -> ${teamData.id}`);

      // Also create job_department entry
      const { error: jobDeptError } = await supabase
        .from("job_departments")
        .insert({
          name: dept.name,
          org_id: orgId,
        });

      if (jobDeptError) {
        console.error(`Error creating job_department ${dept.name}:`, jobDeptError);
      }
    }

    // 6. Create jobs and collect IDs for colaborador creation
    const createdJobs: Array<{ jobId: string; job: JobData; teamId: string | null }> = [];

    for (const job of jobs) {
      // Get the department_id from job_departments
      const { data: deptData } = await supabase
        .from("job_departments")
        .select("id")
        .eq("value", job.departmentName)
        .eq("org_id", orgId)
        .single();

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
          title: job.title,
          department: job.departmentName,
          department_id: deptData?.id || null,
          hours: job.hours,
          headcount: job.headcount || 1,
          org_id: orgId,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (jobError) {
        // If headcount column doesn't exist yet, retry without it
        if (jobError.message?.includes('headcount')) {
          const { data: retryData, error: retryError } = await supabase
            .from("jobs")
            .insert({
              title: job.title,
              department: job.departmentName,
              department_id: deptData?.id || null,
              hours: job.hours,
              org_id: orgId,
              created_by: user.id,
            })
            .select("id")
            .single();
          if (retryError || !retryData) {
            console.error(`Error creating job ${job.title}:`, retryError);
            continue;
          }
          createdJobs.push({ jobId: retryData.id, job, teamId: deptIdMap[job.departmentId] || null });
        } else {
          console.error(`Error creating job ${job.title}:`, jobError);
          continue;
        }
      } else if (jobData) {
        createdJobs.push({ jobId: jobData.id, job, teamId: deptIdMap[job.departmentId] || null });
        console.log(`Job created: ${job.title} (headcount: ${job.headcount || 1})`);
      }
    }

    // 7. Create placeholder colaboradores based on headcount
    let colaboradoresCreated = 0;
    const timestamp = Date.now();

    for (const { jobId, job, teamId } of createdJobs) {
      const headcount = job.headcount || 1;
      const slug = job.title.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
        .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

      for (let i = 1; i <= headcount; i++) {
        const empleadoId = `SETUP-${timestamp}-${colaboradoresCreated + 1}`;
        const placeholderEmail = `${slug}-${i}-${timestamp}@setup.turnosmart.app`;

        const { data: colabData, error: colabError } = await supabase
          .from("colaboradores")
          .insert({
            nombre: job.title,
            apellidos: headcount > 1 ? `#${i}` : "(pendiente)",
            apellidos_uso: headcount > 1 ? `${job.title} #${i}` : job.title,
            empleado_id: empleadoId,
            email: placeholderEmail,
            org_id: orgId,
            job_id: jobId,
            status: "activo",
            tipo_contrato: "Sin especificar",
            fecha_inicio_contrato: new Date().toISOString().split("T")[0],
            tiempo_trabajo_semanal: job.hours * 5, // Convert daily hours to weekly (assuming 5-day work week)
          })
          .select("id")
          .single();

        if (colabError) {
          console.error(`Error creating placeholder ${job.title} #${i}:`, colabError);
          continue;
        }

        colaboradoresCreated++;

        // Link colaborador to their team/department
        if (teamId && colabData) {
          const { error: linkError } = await supabase
            .from("colaborador_departments")
            .insert({
              colaborador_id: colabData.id,
              department_id: teamId,
              org_id: orgId,
              assigned_by: user.id,
              is_active: true,
            });

          if (linkError) {
            console.error(`Error linking ${job.title} #${i} to team:`, linkError);
          }
        }
      }
    }

    console.log(`Created ${colaboradoresCreated} placeholder colaboradores`);

    // 8. Log activity
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
          industry: organization.industry,
        },
      });
    } catch (logError) {
      console.error("Error logging activity:", logError);
      // Non-critical
    }

    console.log("Onboarding completed successfully");

    // Notificar al admin — fire & forget, no bloquea la respuesta
    try {
      const notifyUrl = `${supabaseUrl}/functions/v1/notify-admin-signup`;
      await fetch(notifyUrl, {
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
      });
    } catch (notifyError) {
      console.error("Error notifying admin (non-critical):", notifyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        organization_id: orgId,
        departments_created: Object.keys(deptIdMap).length,
        jobs_created: createdJobs.length,
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
