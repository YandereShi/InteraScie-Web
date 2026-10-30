const studentQueryNames = new Set([
  "SectionProgress", "AssessmentScores", "TeacherDashboard",
  "TeacherLevelProgress", "TeacherRadar",
]);

function MatchesStudents(query, studentIDs) {
  if (studentIDs === null || !query.state.data) return true;

  let students = query.state.data.students?.map((student) => student.studentID);
  if (query.queryKey[0] === "TeacherLevelProgress") students = query.queryKey[2];
  if (query.queryKey[0] === "TeacherRadar") students = query.queryKey[2]?.map(([id]) => id);

  return !students || students.some((id) => studentIDs.has(id));
}

export function CreateRealtimeRefresh(queryClient) {
  const pendingQueries = new Map();
  let refreshTimer;
  let refreshing = false;
  let disposed = false;

  function ScheduleRefresh(queryNames, payload) {
    if (disposed) return;
    const studentIDs = [payload?.new?.studentID, payload?.old?.studentID]
      .filter((id) => id !== undefined && id !== null);

    for (const name of queryNames) {
      if (!studentQueryNames.has(name) || studentIDs.length === 0) {
        pendingQueries.set(name, null);
      } else if (pendingQueries.get(name) !== null) {
        const pending = pendingQueries.get(name) ?? new Set();
        studentIDs.forEach((id) => pending.add(id));
        pendingQueries.set(name, pending);
      }
    }

    // Keep the first deadline so continuous saves cannot postpone the refresh.
    if (!refreshing && refreshTimer === undefined && pendingQueries.size > 0) {
      refreshTimer = setTimeout(FlushRefresh, 5000);
    }
  }

  async function FlushRefresh() {
    refreshTimer = undefined;
    if (disposed) return;
    const queries = new Map(pendingQueries);
    pendingQueries.clear();
    refreshing = true;

    try {
      await queryClient.invalidateQueries({
        predicate: (query) => queries.has(query.queryKey[0]) &&
          MatchesStudents(query, queries.get(query.queryKey[0])),
      });
    } finally {
      refreshing = false;
      // Changes received during the request need a subsequent refresh.
      if (!disposed) ScheduleRefresh([]);
    }
  }

  function Dispose() {
    disposed = true;
    clearTimeout(refreshTimer);
    pendingQueries.clear();
  }

  return { ScheduleRefresh, Dispose };
}
