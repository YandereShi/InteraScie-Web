import { InvokeStudentManagement, supabase } from "./supabase";
import { SortSectionsBySchoolYear } from "./schoolYear";

export const archivedStudentsQueryKey = ["ArchivedStudents"];

export async function GetArchivedStudents() {
  const data = await InvokeStudentManagement("loadarchivedstudents");
  return { ...data, sections: SortSectionsBySchoolYear(data.sections ?? []) };
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
