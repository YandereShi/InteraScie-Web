import { InvokeStudentManagement } from "./supabase";
import { GetSectionLabel, SortSectionsBySchoolYear } from "./schoolYear";

export const studentQueryKey = [
  "Students",
];

export async function GetStudents() {
  const data = await InvokeStudentManagement(
    "loadstudents"
  );
  const sectionLabels = new Map((data.sections ?? []).map((section) => [section.sectionID, GetSectionLabel(section)]));

  return {
    students: (data.students ?? []).map((student) => ({ ...student, section: sectionLabels.get(student.sectionID) ?? student.section })),
    sections: SortSectionsBySchoolYear(data.sections ?? []),
  };
}
