import { InvokeStudentManagement } from "./supabase";

export const sectionsQueryKey = ["Sections"];
export const noSectionStudentsQueryKey = ["NoSectionStudents"];

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
