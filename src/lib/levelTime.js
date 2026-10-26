export function GetLevelTimes(students, records, sectionID, levelID, direction = "asc") {
  const selectedStudents = new Map(students
    .filter((student) => sectionID === "all" || String(student.sectionID) === String(sectionID))
    .map((student) => [String(student.studentID), student]));

  return records.flatMap((record) => {
    const student = selectedStudents.get(String(record.studentID));
    const seconds = Number(record.timeTakenSeconds);
    if (!student || String(record.levelID) !== String(levelID) || !Number.isFinite(seconds) || seconds <= 0) {
      return [];
    }
    return [{ ...student, timeTakenSeconds: seconds, isFinished: String(record.status ?? "").trim().toLowerCase() === "finished" }];
  }).sort((first, second) => Number(second.isFinished) - Number(first.isFinished) ||
    (first.timeTakenSeconds - second.timeTakenSeconds) * (direction === "asc" ? 1 : -1) ||
    `${first.lastName ?? ""} ${first.firstName ?? ""}`.localeCompare(`${second.lastName ?? ""} ${second.firstName ?? ""}`) ||
    String(first.studentID).localeCompare(String(second.studentID)));
}

export function FormatLevelTime(seconds) {
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
