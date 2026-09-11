import { supabase } from "./supabase";

export const teachersQueryKey = ["Teachers"];

async function GetFunctionError(error) {
  let message = error.message;

  try {
    const body = await error.context?.json();
    message = body?.error ?? message;
  } catch {
    message = error.message;
  }

  return message;
}

async function InvokeTeacherManagement(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke(
    "teachermanagement",
    {
      body: {
        action,
        ...payload,
      },
    }
  );

  if (error) {
    throw new Error(await GetFunctionError(error));
  }

  if (!data) {
    throw new Error("The teacher request returned no result.");
  }

  return data;
}

export async function GetTeachers() {
  const data = await InvokeTeacherManagement("LoadTeachers");

  return {
    teachers: data.teachers ?? [],
    availableSections: data.availableSections ?? [],
  };
}

export async function CreateTeacher(teacherData) {
  return InvokeTeacherManagement("CreateTeacher", teacherData);
}

export async function DeleteTeachers(staffIDs) {
  return InvokeTeacherManagement("DeleteTeachers", {
    staffIDs,
  });
}
