import { createClient } from "npm:@supabase/supabase-js@^2";
import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

function Send(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

function GetKey(name: string, fallback: string) {
  const values = Deno.env.get(name);

  if (values) {
    try {
      const keys = JSON.parse(values);
      const key = keys.default ?? Object.values(keys)[0];

      if (typeof key === "string") {
        return key;
      }
    } catch (error) {
      console.error(error);
    }
  }

  return Deno.env.get(fallback) ?? "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return Response.json(
      { ok: true },
      { headers: corsHeaders }
    );
  }

  if (request.method !== "POST") {
    return Send(
      { error: "Method not allowed." },
      405
    );
  }

  try {
    const authorization =
      request.headers.get("Authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return Send(
        { error: "Authentication required." },
        401
      );
    }

    const supabaseurl =
      Deno.env.get("SUPABASE_URL") ?? "";

    const secretkey = GetKey(
      "SUPABASE_SECRET_KEYS",
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseurl || !secretkey) {
      return Send(
        { error: "The server is not configured correctly." },
        500
      );
    }

    const admin = createClient(
      supabaseurl,
      secretkey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    const token = authorization.slice(7);

    const {
      data: { user },
      error: usererror,
    } = await admin.auth.getUser(token);

    if (usererror || !user) {
      return Send(
        { error: "Authentication required." },
        401
      );
    }

    const {
      data: staff,
      error: stafferror,
    } = await admin
      .from("SchoolStaff")
      .select("staffID, role")
      .eq("authUserID", user.id)
      .maybeSingle();

    if (
      stafferror ||
      !staff ||
      staff.role !== "superadmin"
    ) {
      return Send(
        { error: "Superadmin access required." },
        403
      );
    }

    const [
      studentresult,
      teacherresult,
      sectionresult,
    ] = await Promise.all([
      admin
        .from("Student")
        .select("studentID", {
          count: "exact",
          head: true,
        }),
      admin
        .from("SchoolStaff")
        .select("staffID", {
          count: "exact",
          head: true,
        })
        .eq("role", "teacher"),
      admin
        .from("Section")
        .select("sectionID", {
          count: "exact",
          head: true,
        })
        .eq("isShared", false),
    ]);

    if (
      studentresult.error ||
      teacherresult.error ||
      sectionresult.error
    ) {
      console.error(
        studentresult.error ||
        teacherresult.error ||
        sectionresult.error
      );

      return Send(
        { error: "Unable to load dashboard totals." },
        500
      );
    }

    return Send({
      studentTotal: studentresult.count ?? 0,
      teacherTotal: teacherresult.count ?? 0,
      sectionTotal: sectionresult.count ?? 0,
    });
  } catch (error) {
    console.error(error);

    return Send(
      { error: "An unexpected server error occurred." },
      500
    );
  }
});
