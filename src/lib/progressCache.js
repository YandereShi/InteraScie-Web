import { GetLessonAccess, GetSectionProgress } from "./progressQueries";

export const progressLessonCount = 3;

export function GetLessonAccessOptions(sectionID) {
  return {
    queryKey: ["LessonAccess", sectionID],
    queryFn: () => GetLessonAccess(sectionID),
    staleTime: 5 * 60 * 1000,
  };
}

export function GetSectionProgressOptions(sectionID, branch, levelIDs) {
  return {
    queryKey: ["SectionProgress", sectionID, branch],
    queryFn: () => GetSectionProgress(sectionID, levelIDs),
    staleTime: 2 * 60 * 1000,
  };
}
