export const studentQueryNames = new Set([
  "Students", "SectionStudents", "NoSectionStudents", "SectionProgress",
  "AssessmentScores", "TeacherDashboard", "SuperAdminDashboard", "TeacherRadar",
  "TeacherLevelProgress", "QuestionAccuracy", "BranchAccuracy", "StudentAnswers", "ArchivedStudents", "AssessmentHistorySources",
]);

export const sectionQueryNames = new Set([
  ...studentQueryNames, "Sections", "Teachers", "ProgressOptions",
  "AssessmentOptions", "LessonAccess", "AssessmentAccess",
]);

async function InvalidateQueries(queryClient, queryNames) {
  const filters = { predicate: (query) => queryNames.has(query.queryKey[0]) };
  await queryClient.cancelQueries(filters);
  await queryClient.invalidateQueries(filters);
}

export function InvalidateStudentQueries(queryClient) {
  return InvalidateQueries(queryClient, studentQueryNames);
}

export function InvalidateSectionQueries(queryClient) {
  return InvalidateQueries(queryClient, sectionQueryNames);
}
