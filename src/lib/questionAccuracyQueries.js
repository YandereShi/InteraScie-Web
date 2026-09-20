import { supabase } from "./supabase";

export const accuracyBranches = ["Chemistry", "Biology", "Physics", "Earth Science"];

export function GetQuestionAccuracyQueryKey(staffID, levelID) {
  return ["QuestionAccuracy", staffID, levelID];
}

export function GetBranchAccuracyQueryKey(staffID) {
  return ["BranchAccuracy", staffID];
}

async function GetAnswerCounts(questionIDs) {
  const counts = new Map(
    questionIDs.map((questionID) => [questionID, { correct: 0, total: 0 }])
  );
  const countedAnswers = new Set();
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data: answers, error: answerError } = await supabase
      .from("StudentAnswer")
      .select("studentAssessmentID, questionID, isCorrect")
      .in("questionID", questionIDs)
      .order("studentAnswerID", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (answerError) {
      throw new Error("Unable to load student answer accuracy.");
    }

    const answerList = answers ?? [];

    answerList.forEach((answer) => {
      const count = counts.get(answer.questionID);
      const answerKey = `${answer.studentAssessmentID}:${answer.questionID}`;

      if (count && !countedAnswers.has(answerKey)) {
        countedAnswers.add(answerKey);
        count.total += 1;

        if (answer.isCorrect === true) {
          count.correct += 1;
        }
      }
    });

    if (answerList.length < pageSize) {
      break;
    }
  }

  return counts;
}

export async function GetBranchAccuracy(staffID) {
  const summary = Object.fromEntries(
    accuracyBranches.map((branch) => [branch, { correct: 0, total: 0 }])
  );

  if (!staffID) {
    return summary;
  }

  const [levelResult, assessmentResult] = await Promise.all([
    supabase.from("Level").select("levelID, branchName").in("branchName", accuracyBranches),
    supabase.from("Assessment").select("assessmentID, levelID").eq("staffID", staffID).order("assessmentID", { ascending: true }),
  ]);

  if (levelResult.error || assessmentResult.error) {
    throw new Error("Unable to load branch accuracy.");
  }

  const branches = new Map(
    (levelResult.data ?? []).map((level) => [level.levelID, level.branchName])
  );
  const assessments = [];
  const selectedLevels = new Set();

  (assessmentResult.data ?? []).forEach((assessment) => {
    if (branches.has(assessment.levelID) && !selectedLevels.has(assessment.levelID)) {
      assessments.push(assessment);
      selectedLevels.add(assessment.levelID);
    }
  });

  if (assessments.length === 0) {
    return summary;
  }

  const assessmentLevels = new Map(
    assessments.map((assessment) => [assessment.assessmentID, assessment.levelID])
  );
  const { data: questions, error: questionError } = await supabase
    .from("Question")
    .select("questionID, assessmentID")
    .in("assessmentID", assessments.map((assessment) => assessment.assessmentID));

  if (questionError) {
    throw new Error("Unable to load branch questions.");
  }

  const questionList = questions ?? [];

  if (questionList.length === 0) {
    return summary;
  }

  const counts = await GetAnswerCounts(questionList.map((question) => question.questionID));

  questionList.forEach((question) => {
    const branch = branches.get(assessmentLevels.get(question.assessmentID));
    const count = counts.get(question.questionID);

    if (branch && count) {
      summary[branch].correct += count.correct;
      summary[branch].total += count.total;
    }
  });

  return summary;
}

export async function GetQuestionAccuracy(staffID, levelID) {
  if (!staffID || !levelID) {
    return [];
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("Assessment")
    .select("assessmentID")
    .eq("staffID", staffID)
    .eq("levelID", levelID)
    .order("assessmentID", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (assessmentError) {
    throw new Error("Unable to load the lesson assessment.");
  }

  if (!assessment) {
    return [];
  }

  const { data: questions, error: questionError } = await supabase
    .from("Question")
    .select("questionID, text")
    .eq("assessmentID", assessment.assessmentID)
    .order("questionID", { ascending: true });

  if (questionError) {
    throw new Error("Unable to load the lesson questions.");
  }

  const questionList = questions ?? [];

  if (questionList.length === 0) {
    return [];
  }

  const counts = await GetAnswerCounts(questionList.map((question) => question.questionID));

  return questionList.map((question, index) => ({
    questionID: question.questionID,
    number: index + 1,
    text: question.text ?? "",
    ...counts.get(question.questionID),
  }));
}
