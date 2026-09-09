import { supabase } from "./supabase";

export async function GetTeacherProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "Your login session was not found."
    );
  }

  const {
    data: staff,
    error: staffError,
  } = await supabase
    .from("SchoolStaff")
    .select(
      "staffID, firstName, lastName, role, authUserID"
    )
    .eq("authUserID", user.id)
    .eq("role", "teacher")
    .maybeSingle();

  if (staffError || !staff) {
    throw new Error(
      "Your teacher account was not found."
    );
  }

  return staff;
}