import {
  InvokeStudentManagement,
  supabase,
} from "./supabase";
import { GetAssessmentOptions } from "./assessmentQueries";

export async function GetProgressOptions(staffID) {
  return GetAssessmentOptions(staffID);
}

export async function GetLessonAccess(sectionID) {
  const data = await InvokeStudentManagement(
    "GetLessonAccess",
    {
      sectionID,
    }
  );

  return data.lessonAccess ?? [];
}

export async function GetSectionProgress(
  sectionID,
  levelIDs
) {
  if (!sectionID || levelIDs.length === 0) {
    return {
      students: [],
      records: [],
    };
  }

  const {
    data: students,
    error: studentError,
  } = await supabase
    .from("Student")
    .select("studentID, firstName, lastName")
    .is("archivedAt", null)
    .eq("sectionID", sectionID)
    .order("lastName", { ascending: true })
    .order("firstName", { ascending: true });

  if (studentError) {
    throw new Error(
      "Unable to load students."
    );
  }

  const studentList = students ?? [];

  if (studentList.length === 0) {
    return {
      students: [],
      records: [],
    };
  }

  const studentIDs = studentList.map(
    (student) => student.studentID
  );

  const {
    data: records,
    error: progressError,
  } = await supabase
    .from("Progress")
    .select(
      "studentID, levelID, savepoint, status"
    )
    .in("studentID", studentIDs)
    .in("levelID", levelIDs);

  if (progressError) {
    throw new Error(
      "Unable to load student progress."
    );
  }

  return {
    students: studentList,
    records: records ?? [],
  };
}

export async function UpdateLessonAccess(
  sectionID,
  levelID,
  isEnabled
) {
  return InvokeStudentManagement(
    "SetLessonAccess",
    {
      sectionID,
      levelID,
      isEnabled,
    }
  );
}
