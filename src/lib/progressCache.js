import { GetLessonAccess, GetSectionProgress } from "./progressQueries";
import { PrefetchQueries } from "./prefetchQueries";

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

export async function PrefetchProgress(queryClient, sections, levels, isCancelled) {
  const branches = [...new Set(levels.map((level) => level.branchName).filter(Boolean))];
  const queries = sections.flatMap((section) => [
    GetLessonAccessOptions(section.sectionID),
    ...branches.map((branch) => GetSectionProgressOptions(
      section.sectionID,
      branch,
      levels
        .filter((level) => level.branchName === branch)
        .slice(0, progressLessonCount)
        .map((level) => level.levelID)
    )),
  ]);
  await PrefetchQueries(queryClient, queries, isCancelled);
}

export function InvalidateProgressQueries(queryClient, payload) {
  const studentIDs = [payload.new?.studentID, payload.old?.studentID]
    .filter((studentID) => studentID !== undefined && studentID !== null);

  return queryClient.invalidateQueries({
    queryKey: ["SectionProgress"],
    predicate: (query) => studentIDs.length === 0 ||
      !query.state.data ||
      query.state.data.students.some((student) => studentIDs.includes(student.studentID)),
  });
}
