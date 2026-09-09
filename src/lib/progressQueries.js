import {
  InvokeStudentManagement,
  supabase,
} from "./supabase";

export async function GetProgressOptions(staffID) {
  const [sectionResult, levelResult] =
    await Promise.all([
      supabase
        .from("Section")
        .select("sectionID, sectionName, isShared")
        .eq("staffID", staffID)
        .order("sectionName", { ascending: true }),
      supabase
        .from("Level")
        .select("levelID, branchName")
        .order("branchName", { ascending: true })
        .order("levelID", { ascending: true }),
    ]);

  if (sectionResult.error) {
    throw new Error(
      "Unable to load teacher sections."
    );
  }

  if (levelResult.error) {
    throw new Error(
      "Unable to load subjects and lessons."
    );
  }

  return {
    sections: (sectionResult.data ?? []).filter(
      (item) => item.isShared !== true
    ),
    levels: levelResult.data ?? [],
  };
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