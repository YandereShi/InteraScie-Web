import { GetAssessmentScores, GetAssessmentScoresQueryKey } from "./assessmentQueries";
import { PrefetchQueries } from "./prefetchQueries";

export const assessmentLessonCount = 3;

export function GetAssessmentScoresOptions(sectionID, staffID, branch, levelIDs) {
  return {
    queryKey: GetAssessmentScoresQueryKey(sectionID, staffID, branch),
    queryFn: () => GetAssessmentScores(sectionID, staffID, levelIDs),
    staleTime: 2 * 60 * 1000,
  };
}

export async function PrefetchAssessments(queryClient, staffID, sections, levels, isCancelled) {
  const branches = [...new Set(levels.map((level) => level.branchName).filter(Boolean))];
  const queries = sections.flatMap((section) => branches.map((branch) =>
    GetAssessmentScoresOptions(
      section.sectionID,
      staffID,
      branch,
      levels
        .filter((level) => level.branchName === branch)
        .slice(0, assessmentLessonCount)
        .map((level) => level.levelID)
    )
  ));

  await PrefetchQueries(queryClient, queries, isCancelled);
}

export function InvalidateAssessmentScoresQueries(queryClient, payload) {
  const studentIDs = [payload.new?.studentID, payload.old?.studentID]
    .filter((studentID) => studentID !== undefined && studentID !== null);

  return queryClient.invalidateQueries({
    queryKey: ["AssessmentScores"],
    predicate: (query) => studentIDs.length === 0 ||
      !query.state.data ||
      query.state.data.students.some((student) => studentIDs.includes(student.studentID)),
  });
}
