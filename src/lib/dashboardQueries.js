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
      staffID: staff.staffID,
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
    staffID: staff.staffID,
    sections,
    students,
    levels,
    tests,
    scores,
  };
}

export async function GetTeacherRadarData(staffID, students) {
  const { data: levels, error: levelError } = await supabase
    .from("Level")
    .select("levelID, levelName, branchName")
    .order("levelID", { ascending: true });

  if (levelError) {
    throw new Error("Unable to load radar levels.");
  }

  const levelList = levels ?? [];

  const studentIDs = students.map((student) => student.studentID);
  if (!staffID || studentIDs.length === 0 || levelList.length === 0) {
    return levelList.map((level) => ({ ...level, accuracy: null, sectionAccuracies: {} }));
  }

  const { data: assessments, error: assessmentError } = await supabase
    .from("Assessment")
    .select("assessmentID, levelID")
    .eq("staffID", staffID);

  if (assessmentError) {
    throw new Error("Unable to load radar assessments.");
  }

  const assessmentList = assessments ?? [];

  if (assessmentList.length === 0) {
    return levelList.map((level) => ({ ...level, accuracy: null, sectionAccuracies: {} }));
  }

  const { data: scores, error: scoreError } = await supabase
    .from("StudentAssessment")
    .select("studentID, assessmentID, score, totalQuestions")
    .in("studentID", studentIDs)
    .in("assessmentID", assessmentList.map((item) => item.assessmentID));

  if (scoreError) {
    throw new Error("Unable to load radar scores.");
  }

  const totals = new Map();
  const sectionTotals = new Map();
  const assessmentLevels = new Map(
    assessmentList.map((item) => [item.assessmentID, item.levelID])
  );
  const studentSections = new Map(
    students.map((student) => [student.studentID, student.sectionID])
  );

  (scores ?? []).forEach((item) => {
    if (item.score === null || item.score === undefined || item.score === "") {
      return;
    }

    const score = Number(item.score);
    const questions = Number(item.totalQuestions);
    const levelID = assessmentLevels.get(item.assessmentID);

    if (!levelID || !Number.isFinite(score) || !Number.isFinite(questions) || questions <= 0) {
      return;
    }

    const current = totals.get(levelID) ?? { correct: 0, questions: 0 };
    current.correct += score;
    current.questions += questions;
    totals.set(levelID, current);

    const sectionID = studentSections.get(item.studentID);
    if (sectionID !== null && sectionID !== undefined) {
      const key = `${sectionID}:${levelID}`;
      const sectionTotal = sectionTotals.get(key) ?? { correct: 0, questions: 0 };
      sectionTotal.correct += score;
      sectionTotal.questions += questions;
      sectionTotals.set(key, sectionTotal);
    }
  });

  return levelList.map((level) => {
    const total = totals.get(level.levelID);

    return {
      ...level,
      accuracy: total ? Math.round((total.correct / total.questions) * 100) : null,
      sectionAccuracies: Object.fromEntries(
        [...new Set(students.map((student) => student.sectionID))].map((sectionID) => {
          const sectionTotal = sectionTotals.get(`${sectionID}:${level.levelID}`);
          return [sectionID, sectionTotal
            ? Math.round((sectionTotal.correct / sectionTotal.questions) * 100)
            : null];
        })
      ),
    };
  });
}

export async function GetTeacherLevelProgress(studentIDs) {
  const { data: levels, error: levelError } = await supabase
    .from("Level")
    .select("levelID, levelName, branchName")
    .order("levelID", { ascending: true });

  if (levelError) {
    throw new Error("Unable to load dashboard levels.");
  }

  const levelList = levels ?? [];

  if (studentIDs.length === 0 || levelList.length === 0) {
    return { levels: levelList, records: [] };
  }

  const { data, error } = await supabase
    .from("Progress")
    .select("studentID, levelID, status")
    .in("studentID", studentIDs)
    .in("levelID", levelList.map((item) => item.levelID));

  if (error) {
    throw new Error("Unable to load dashboard progress.");
  }

  return { levels: levelList, records: data ?? [] };
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
