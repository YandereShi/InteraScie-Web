import { supabase } from "./supabase";
import { GetBranches } from "./branches";

async function ReadRows(makeQuery) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await makeQuery().range(offset, offset + 499);
    if (error) throw new Error("Unable to load the report data. Please try again.", { cause: error });
    rows.push(...(data ?? []));
    if ((data ?? []).length < 500) return rows;
  }
}

async function ReadBatches(ids, makeQuery) {
  const rows = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    rows.push(...await ReadRows(() => makeQuery(ids.slice(offset, offset + 100))));
  }
  return rows;
}

export async function GetSectionReportData(staffID, sectionIDs, branches) {
  if (!staffID) throw new Error("Your teacher account was not found.");
  const selectedSections = [...new Set(sectionIDs.map(String))];
  const selectedBranches = [...new Set(branches)];
  if (!selectedSections.length || !selectedBranches.length) throw new Error("Select at least one section and branch.");
  const [sections, allLevels] = await Promise.all([
    ReadBatches(selectedSections, (ids) => supabase.from("Section")
        .select("sectionID, sectionName")
        .eq("staffID", staffID).eq("isShared", false)
        .is("archivedAt", null).in("sectionID", ids).order("sectionID")),
    ReadRows(() => supabase.from("Level")
      .select("levelID, levelName, branchName")
      .in("branchName", selectedBranches).order("levelID")),
  ]);
  if (sections.length !== selectedSections.length) throw new Error("One or more selected sections are no longer available. Update your selection and try again.");
  const levels = GetBranches(allLevels).flatMap((name) => allLevels
    .filter((level) => level.branchName === name)
    .slice(0, name === "Earth" ? 2 : 3)
    .map((level, index) => ({ ...level, lesson: index + 1 })));
  if (levels.length === 0) throw new Error("No levels are available for the selected branch.");
  if (GetBranches(levels).length !== selectedBranches.length) throw new Error("One or more selected branches are no longer available.");
  const levelIDs = levels.map((level) => level.levelID);
  const [students, tests] = await Promise.all([
    ReadBatches(sections.map((item) => item.sectionID), (ids) => supabase.from("Student")
      .select("studentID, sectionID, firstName, lastName")
      .in("sectionID", ids).is("archivedAt", null).order("studentID")),
    ReadRows(() => supabase.from("Assessment")
      .select("assessmentID, levelID").eq("staffID", staffID)
      .in("levelID", levelIDs).order("assessmentID")),
  ]);
  const studentIDs = students.map((student) => student.studentID);
  const testIDs = tests.map((test) => test.assessmentID);
  const [records, scores] = await Promise.all([
    ReadBatches(studentIDs, (ids) => supabase.from("Progress")
      .select("progressID, studentID, levelID, status, timeTakenSeconds")
      .in("studentID", ids).in("levelID", levelIDs).order("progressID")),
    testIDs.length === 0 ? [] : ReadBatches(studentIDs, (ids) => supabase.from("StudentAssessment")
      .select("studentAssessmentID, studentID, assessmentID, score, totalQuestions")
      .in("studentID", ids).in("assessmentID", testIDs).order("studentAssessmentID")),
  ]);
  return { sections, levels, students, tests, records, scores };
}
