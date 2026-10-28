import { supabase } from "./supabase";

const invalidSessionCodes = new Set([
  "bad_jwt", "no_authorization", "session_not_found", "session_expired",
  "refresh_token_not_found", "refresh_token_already_used", "user_not_found",
  "user_banned", "unexpected_audience",
]);

function LoginRequired() {
  return Object.assign(new Error("Please log in again to continue."), { code: "AUTH_REQUIRED" });
}

export async function GetStaffProfile(role) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw LoginRequired();

    const { data: staff, error: staffError } = await supabase
      .from("SchoolStaff")
      .select("staffID, firstName, lastName, role, authUserID")
      .eq("authUserID", user.id)
      .eq("role", role)
      .maybeSingle();

    if (staffError) throw staffError;
    if (!staff || staff.role !== role) throw LoginRequired();
    return staff;
  } catch (error) {
    if (error?.code === "AUTH_REQUIRED" || error?.name === "AuthSessionMissingError" ||
      invalidSessionCodes.has(error?.code) || error?.status === 401) {
      throw LoginRequired();
    }
    throw new Error("Unable to verify your account. Check your connection and try again.", { cause: error });
  }
}

export function GetTeacherProfile() {
  return GetStaffProfile("teacher");
}
