import { InvokeStudentManagement, supabase } from "./supabase";
import { NormalizeName } from "./nameValidation";

export const sectionsQueryKey = ["Sections"];
export const noSectionStudentsQueryKey = ["NoSectionStudents"];

export function IsReservedSectionName(name) {
  return NormalizeName(name) === "nosection";
}

export function GetSectionStudentsQueryKey(sectionID) {
  return ["SectionStudents", sectionID];
}

export async function GetSections() {
  const data = await InvokeStudentManagement("loadsections");

  return {
    role: data.role ?? "",
    sections: data.sections ?? [],
  };
}

export async function GetSectionStudents(sectionID) {
  const data = await InvokeStudentManagement(
    "loadsectionstudents",
    { sectionID }
  );

  return data.students ?? [];
}

export async function GetNoSectionStudents() {
  const data = await InvokeStudentManagement("loadnostudents");

  return data.students ?? [];
}

export async function DeleteSection(sectionID) {
  return InvokeStudentManagement("deletesection", {
    sectionID,
  });
}

export async function SetSectionArchived(sectionID, archived, staffID = null) {
  const { data, error } = await supabase.rpc("SetSectionArchived", {
    p_section_id: sectionID,
    p_archived: archived,
    p_staff_id: staffID,
  });

  if (error) {
    throw new Error(error.message || "Unable to update the section archive.");
  }

  return data;
}
