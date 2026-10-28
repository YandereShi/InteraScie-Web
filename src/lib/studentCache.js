const studentQueryNames = new Set([
  "Students", "SectionStudents", "NoSectionStudents", "SectionProgress",
  "AssessmentScores", "TeacherDashboard", "SuperAdminDashboard", "TeacherRadar",
  "TeacherLevelProgress", "QuestionAccuracy", "BranchAccuracy",
]);

const sectionQueryNames = new Set([
  ...studentQueryNames, "Sections", "Teachers", "ProgressOptions",
  "AssessmentOptions", "LessonAccess", "AssessmentAccess",
]);

async function InvalidateQueries(queryClient, queryNames) {
  const filters = { predicate: (query) => queryNames.has(query.queryKey[0]) };
  // Stop older reads from restoring outdated rosters after a successful change.
  await queryClient.cancelQueries(filters);
  await queryClient.invalidateQueries(filters);
}

export function InvalidateStudentQueries(queryClient) {
  return InvalidateQueries(queryClient, studentQueryNames);
}

export function InvalidateSectionQueries(queryClient) {
  return InvalidateQueries(queryClient, sectionQueryNames);
}
