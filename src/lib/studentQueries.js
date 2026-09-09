import { InvokeStudentManagement } from "./supabase";

export const studentQueryKey = [
  "Students",
];

export async function GetStudents() {
  const data = await InvokeStudentManagement(
    "loadstudents"
  );

  return {
    students: data.students ?? [],
    sections: data.sections ?? [],
  };
}