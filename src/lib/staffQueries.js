import { supabase } from "./supabase";

const invalidSessionCodes = new Set([
  "bad_jwt", "no_authorization", "session_not_found", "session_expired",
  "refresh_token_not_found", "refresh_token_already_used", "user_not_found",
  "user_banned", "unexpected_audience",
]);

function LoginRequired() {
  return Object.assign(new Error("Please log in again to continue."), { code: "AUTH_REQUIRED" });
}

export async function CheckStaffSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) throw LoginRequired();
  const { data, error } = await supabase.rpc("StaffSessionStatus");
  if (error?.status === 401 || invalidSessionCodes.has(error?.code)) throw LoginRequired();
  if (error) throw new Error("Unable to verify your session. Check your connection and try again.", { cause: error });
  if (data?.status !== "active") {
    const sessionError = LoginRequired();
    if (data?.status === "replaced") sessionError.message = "Your account was logged in on another device.";
    throw sessionError;
  }
  return true;
}

export const staffSessionOptions = {
  queryKey: ["StaffSession"],
  queryFn: CheckStaffSession,
  staleTime: 30 * 1000,
  refetchInterval: (query) => query.state.error?.code === "AUTH_REQUIRED" ? false : 30 * 1000,
  refetchOnMount: "always",
  refetchOnWindowFocus: "always",
  refetchOnReconnect: "always",
  retry: (failureCount, error) => error.code !== "AUTH_REQUIRED" && failureCount < 1,
};

export async function GetStaffProfile(role) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw LoginRequired();

    const { data: staff, error: staffError } = await supabase
      .from("SchoolStaff")
      .select("staffID, firstName, lastName, role, authUserID")
      .is("archivedAt", null)
      .eq("authUserID", user.id)
      .eq("role", role)
      .maybeSingle();

    if (staffError) throw staffError;
    if (!staff || staff.role !== role) {
      await CheckStaffSession();
      throw LoginRequired();
    }
    return staff;
  } catch (error) {
    if (error?.code === "AUTH_REQUIRED") throw error;
    if (error?.name === "AuthSessionMissingError" ||
      invalidSessionCodes.has(error?.code) || error?.status === 401) {
      throw LoginRequired();
    }
    throw new Error("Unable to verify your account. Check your connection and try again.", { cause: error });
  }
}

export function GetTeacherProfile() {
  return GetStaffProfile("teacher");
}
