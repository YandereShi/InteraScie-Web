import { supabase } from "./supabase";

export const teacherDashboardQueryKey = ["TeacherDashboard"];
export const superAdminDashboardQueryKey = ["SuperAdminDashboard"];

export async function GetTeacherDashboard(branch) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    throw new Error("Failed to fetch user information");
  }

  const { data: staff, error: staffError } = await supabase
    .from("SchoolStaff")
    .select("staffID")
    .eq("authUserID", user.id)
    .eq("role", "teacher")
    .single();

  if (staffError || !staff) {
    throw new Error("Failed to fetch staff information");
  }

  const { data: sectionData, error: sectionError } =
    await supabase
      .from("Section")
      .select("sectionID, sectionName")
      .eq("staffID", staff.staffID)
      .eq("isShared", false);

  if (sectionError) {
    throw new Error("Failed to fetch sections");
  }

  const sections = sectionData ?? [];
  const sectionIDs = sections.map((section) => section.sectionID);

  if (sectionIDs.length === 0) {
    return {
      sections,
      students: [],
      levels: [],
      tests: [],
      scores: [],
    };
  }

  const { data: studentData, error: studentError } =
    await supabase
      .from("Student")
      .select("studentID, sectionID")
      .in("sectionID", sectionIDs);

  if (studentError) {
    throw new Error("Failed to fetch students");
  }

  const students = studentData ?? [];
  const { data: levelData, error: levelError } =
    await supabase
      .from("Level")
      .select("levelID, levelName")
      .eq("branchName", branch)
      .order("levelID", { ascending: true })
      .limit(3);

  if (levelError) {
    throw new Error(`Failed to fetch ${branch} lessons`);
  }

  const levels = levelData ?? [];
  const levelIDs = levels.map((level) => level.levelID);

  if (levelIDs.length === 0) {
    throw new Error(`No ${branch} lessons found`);
  }

  const { data: testData, error: testError } =
    await supabase
      .from("Assessment")
      .select("assessmentID, levelID")
      .eq("staffID", staff.staffID)
      .in("levelID", levelIDs)
      .order("assessmentID", { ascending: true });

  if (testError) {
    throw new Error("Failed to fetch assessments");
  }

  const tests = testData ?? [];
  const studentIDs = students.map((student) => student.studentID);
  const testIDs = tests.map((test) => test.assessmentID);
  let scores = [];

  if (studentIDs.length > 0 && testIDs.length > 0) {
    const { data: scoreData, error: scoreError } =
      await supabase
        .from("StudentAssessment")
        .select("studentID, assessmentID, score, totalQuestions")
        .in("studentID", studentIDs)
        .in("assessmentID", testIDs);

    if (scoreError) {
      throw new Error("Failed to fetch assessment scores");
    }

    scores = scoreData ?? [];
  }

  return {
    sections,
    students,
    levels,
    tests,
    scores,
  };
}

export async function GetSuperAdminDashboard() {
  const { data, error } = await supabase.functions.invoke(
    "superadmindashboard"
  );

  if (error || !data) {
    throw new Error("Unable to load dashboard totals.");
  }

  return {
    studentTotal: Number(data.studentTotal) || 0,
    teacherTotal: Number(data.teacherTotal) || 0,
    sectionTotal: Number(data.sectionTotal) || 0,
  };
}
