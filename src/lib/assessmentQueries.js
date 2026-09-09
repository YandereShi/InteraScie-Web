import { supabase } from "./supabase";

export const assessmentOptionsQueryKey = ["AssessmentOptions"];

export function GetAssessmentScoresQueryKey(sectionID, staffID, branch) {
  return ["AssessmentScores", sectionID, staffID, branch];
}

export function GetAssessmentQuestionsQueryKey(staffID, levelID) {
  return ["AssessmentQuestions", staffID, levelID];
}

export async function GetAssessmentOptions() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    throw new Error("Your login session was not found.");
  }

  const { data: staffData, error: staffError } =
    await supabase
      .from("SchoolStaff")
      .select("staffID")
      .eq("authUserID", user.id)
      .eq("role", "teacher")
      .single();

  if (staffError || !staffData) {
    throw new Error("Your teacher account was not found.");
  }

  const [sectionResult, levelResult] = await Promise.all([
    supabase
      .from("Section")
      .select("sectionID, sectionName, isShared")
      .eq("staffID", staffData.staffID)
      .order("sectionName", { ascending: true }),
    supabase
      .from("Level")
      .select("levelID, levelName, branchName")
      .order("branchName", { ascending: true })
      .order("levelID", { ascending: true }),
  ]);

  if (sectionResult.error || levelResult.error) {
    throw new Error("Unable to load assessment options.");
  }

  return {
    staffID: staffData.staffID,
    sections: (sectionResult.data ?? []).filter(
      (item) => !item.isShared
    ),
    levels: levelResult.data ?? [],
  };
}

export async function GetAssessmentScores(sectionID, staffID, levelIDs) {
  if (!sectionID || !staffID || levelIDs.length === 0) {
    return {
      students: [],
      tests: [],
      scores: [],
    };
  }

  const [studentResult, testResult] = await Promise.all([
    supabase
      .from("Student")
      .select("studentID, firstName, lastName")
      .eq("sectionID", sectionID)
      .order("lastName", { ascending: true })
      .order("firstName", { ascending: true }),
    supabase
      .from("Assessment")
      .select("assessmentID, levelID")
      .eq("staffID", staffID)
      .in("levelID", levelIDs)
      .order("assessmentID", { ascending: true }),
  ]);

  if (studentResult.error || testResult.error) {
    throw new Error("Unable to load assessment records.");
  }

  const students = studentResult.data ?? [];
  const allTests = testResult.data ?? [];
  const tests = levelIDs
    .map((levelID) =>
      allTests.find((test) => test.levelID === levelID)
    )
    .filter(Boolean);
  let scores = [];

  if (students.length > 0 && tests.length > 0) {
    const studentIDs = students.map((student) => student.studentID);
    const testIDs = tests.map((test) => test.assessmentID);
    const { data, error } = await supabase
      .from("StudentAssessment")
      .select("studentID, assessmentID, score")
      .in("studentID", studentIDs)
      .in("assessmentID", testIDs);

    if (error) {
      throw new Error("Unable to load student scores.");
    }

    scores = data ?? [];
  }

  return {
    students,
    tests,
    scores,
  };
}

export async function GetAssessmentQuestions(staffID, levelID) {
  if (!staffID || !levelID) {
    return {
      test: null,
      questions: [],
    };
  }

  const { data: test, error: testError } = await supabase
    .from("Assessment")
    .select("assessmentID, levelID")
    .eq("staffID", staffID)
    .eq("levelID", levelID)
    .order("assessmentID", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (testError) {
    throw new Error("Unable to load the lesson assessment.");
  }

  if (!test) {
    return {
      test: null,
      questions: [],
    };
  }

  const { data: questions, error: questionError } =
    await supabase
      .from("Question")
      .select("questionID, assessmentID, text, answer, choice1, choice2, choice3")
      .eq("assessmentID", test.assessmentID)
      .order("questionID", { ascending: true });

  if (questionError) {
    throw new Error("Unable to load questions.");
  }

  return {
    test,
    questions: questions ?? [],
  };
}
