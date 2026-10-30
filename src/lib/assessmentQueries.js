import { InvokeStudentManagement, supabase } from "./supabase";

export const assessmentOptionsQueryKey = ["AssessmentOptions"];

export function GetAssessmentScoresQueryKey(sectionID, staffID, branch) {
  return ["AssessmentScores", sectionID, staffID, branch];
}

export function GetAssessmentQuestionsQueryKey(staffID, levelID) {
  return ["AssessmentQuestions", staffID, levelID];
}

export function GetAssessmentAccessQueryKey(sectionID) {
  return ["AssessmentAccess", sectionID];
}

export async function GetAssessmentAccess(sectionID) {
  if (!sectionID) {
    return [];
  }

  const data = await InvokeStudentManagement("GetLessonAccess", {
    sectionID,
  });

  return data.lessonAccess ?? [];
}

export async function UpdateAssessmentAccess(sectionID, levelID, isAssessmentEnabled) {
  return InvokeStudentManagement("SetAssessmentAccess", {
    sectionID,
    levelID,
    isAssessmentEnabled,
  });
}

export async function CreateAssessment(staffID, levelID) {
  const { data, error } = await supabase
    .from("Assessment")
    .insert({ staffID, levelID })
    .select("assessmentID, levelID")
    .single();

  if (!error && data) return data;

  if (error?.code === "23505" && error.message?.includes("Assessment_staff_level_unique")) {
    const existing = await supabase
      .from("Assessment")
      .select("assessmentID, levelID")
      .eq("staffID", staffID)
      .eq("levelID", levelID)
      .single();

    if (!existing.error && existing.data) return existing.data;
  }

  throw new Error("Unable to create the lesson assessment.");
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
      .is("archivedAt", null)
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
      .is("archivedAt", null)
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
      .select("studentAssessmentID, studentID, assessmentID, score")
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

export async function GetAssessmentHistorySources(sectionID) {
  const data = await InvokeStudentManagement("loadassessmenthistory", { sectionID });
  return data.sources ?? [];
}

export async function GetHistoricalAssessmentScores(sectionID, staffID, levelIDs) {
  return InvokeStudentManagement("loadassessmenthistory", { sectionID, staffID, levelIDs });
}

export async function GetStudentAnswers(assessmentID, studentAssessmentID, historySectionID = null) {
  if (historySectionID) {
    const data = await InvokeStudentManagement("loadassessmenthistory", { sectionID: historySectionID, studentAssessmentID });
    return BuildStudentAnswers(data.questions ?? [], data.answers ?? []);
  }
  const [questionResult, answerResult] = await Promise.all([
    supabase
      .from("Question")
      .select("questionID, answer")
      .eq("assessmentID", assessmentID)
      .order("questionID", { ascending: true }),
    supabase
      .from("StudentAnswer")
      .select("questionID, selectedAnswer, isCorrect")
      .eq("studentAssessmentID", studentAssessmentID),
  ]);

  if (questionResult.error || answerResult.error) {
    throw new Error("Unable to load the student's answers.");
  }

  return BuildStudentAnswers(questionResult.data ?? [], answerResult.data ?? []);
}

function BuildStudentAnswers(questions, answerRows) {
  const answers = new Map(answerRows.map((answer) => [answer.questionID, answer]));

  if (answers.size === 0) return [];

  return questions.map((question, index) => {
    const answer = answers.get(question.questionID);

    return {
      questionID: question.questionID,
      number: index + 1,
      selectedAnswer: answer?.selectedAnswer ?? null,
      correctAnswer: question.answer,
      isCorrect: typeof answer?.isCorrect === "boolean" ? answer.isCorrect : null,
    };
  });
}
