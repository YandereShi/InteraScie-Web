import { InvokeStudentManagement, supabase } from "./supabase";

export const archivedStudentsQueryKey = ["ArchivedStudents"];

export async function GetArchivedStudents() {
  return InvokeStudentManagement("loadarchivedstudents");
}

export async function SetAccountsArchived(kind, ids, archived, assignments = [], sectionID = null) {
  const { data, error } = await supabase.rpc("SetAccountsArchived", {
    p_kind: kind,
    p_ids: ids.map(String),
    p_archived: archived,
    p_assignments: assignments,
    p_section_id: sectionID,
  });

  if (error) throw new Error(error.message || "Unable to update the account archive.");
  return data;
}
