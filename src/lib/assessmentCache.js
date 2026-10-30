import { GetAssessmentScores, GetAssessmentScoresQueryKey } from "./assessmentQueries";

export const assessmentLessonCount = 3;

export function GetAssessmentScoresOptions(sectionID, staffID, branch, levelIDs) {
  return {
    queryKey: GetAssessmentScoresQueryKey(sectionID, staffID, branch),
    queryFn: () => GetAssessmentScores(sectionID, staffID, levelIDs),
    staleTime: 2 * 60 * 1000,
  };
}
