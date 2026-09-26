import { useState } from "react";

function DashboardLevelProgress({ sections, students, levels, records, loading, error }) {
  const [section, setSection] = useState("all");
  const [page, setPage] = useState(0);
  const selectedSection = section === "all" || sections.some((item) => String(item.sectionID) === section)
    ? section
    : "all";
  const selectedStudents = selectedSection === "all"
    ? students
    : students.filter((item) => String(item.sectionID) === selectedSection);
  const studentIDs = new Set(selectedStudents.map((item) => String(item.studentID)));
  const studentCount = selectedStudents.length;
  const statuses = new Map();

  records.forEach((record) => {
    if (!studentIDs.has(String(record.studentID))) {
      return;
    }

    const key = `${record.studentID}:${record.levelID}`;
    const finished = String(record.status).toLowerCase() === "finished";
    statuses.set(key, finished || statuses.get(key) === true);
  });

  const branchPositions = new Map();
  const rows = levels.map((level) => {
    const branch = level.branchName || "Other";
    const position = (branchPositions.get(branch) ?? 0) + 1;
    branchPositions.set(branch, position);
    const number = String(level.levelName ?? "").trim().match(/\d+$/)?.[0] ?? position;
    let finished = 0;
    let ongoing = 0;

    selectedStudents.forEach((student) => {
      const status = statuses.get(`${student.studentID}:${level.levelID}`);

      if (status === true) {
        finished += 1;
      } else if (status === false) {
        ongoing += 1;
      }
    });

    return {
      levelID: level.levelID,
      branch,
      name: `Level ${number}`,
      finished,
      ongoing,
      notStarted: studentCount - finished - ongoing,
      completion: studentCount > 0 ? Math.round((finished / studentCount) * 100) : 0,
    };
  });
  const groups = new Map();

  rows.forEach((row) => {
    groups.set(row.branch, [...(groups.get(row.branch) ?? []), row]);
  });
  const pages = [...groups];
  const currentPage = Math.min(page, Math.max(pages.length - 1, 0));
  const [currentBranch, currentRows] = pages[currentPage] ?? ["", []];

  return (
    <section className="dashboardprogress dashboardtile" aria-labelledby="dashboardprogresstitle">
      <div className="dashboardprogresshead">
        <div>
          <h2 id="dashboardprogresstitle">Level Progress</h2>
          <p>All subjects · {studentCount} {studentCount === 1 ? "student" : "students"}</p>
        </div>
        <select value={selectedSection} onChange={(event) => setSection(event.target.value)} aria-label="Progress section">
          <option value="all">All sections</option>
          {sections.map((item) => <option key={item.sectionID} value={String(item.sectionID)}>{item.sectionName}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="dashboardtilemessage">Loading progress...</p>
      ) : error ? (
        <p className="dashboardtilemessage">Unable to load progress.</p>
      ) : studentCount === 0 ? (
        <p className="dashboardtilemessage">No students in the selected section.</p>
      ) : rows.length === 0 ? (
        <p className="dashboardtilemessage">No levels yet.</p>
      ) : (
        <div className="dashboardprogressrows" role="group" aria-label={`${currentBranch} level progress`}>
          <div className="dashboardprogressgroup">
            <h3>{currentBranch === "Earth" ? "Earth Science" : currentBranch}</h3>
            {currentRows.map((row) => (
              <div className="dashboardprogressrow" key={row.levelID}>
                <div className="dashboardprogressrowhead">
                  <strong>{row.name}</strong>
                  <span>{row.completion}% finished · {row.finished}/{studentCount}</span>
                </div>
                <div className="dashboardprogressbar" role="img" aria-label={`${row.branch} ${row.name}: ${row.finished} finished, ${row.ongoing} ongoing, ${row.notStarted} not started out of ${studentCount} students`}>
                  <span className="dashboardprogressfinished" style={{ width: `${row.finished / studentCount * 100}%` }} />
                  <span className="dashboardprogressongoing" style={{ width: `${row.ongoing / studentCount * 100}%` }} />
                  <span className="dashboardprogressnotstarted" style={{ width: `${row.notStarted / studentCount * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboardprogressfooter">
        <div className="dashboardprogresslegend" aria-label="Progress colors">
          <span><i className="legendfinished" />Finished</span>
          <span><i className="legendongoing" />Ongoing</span>
          <span><i className="legendnotstarted" />Not started</span>
        </div>
        {!loading && !error && studentCount > 0 && pages.length > 1 && (
          <nav className="dashboardprogresspagination" aria-label="Level progress pages">
            <button type="button" aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>&lt;</button>
            <span>{currentPage + 1} of {pages.length}</span>
            <button type="button" aria-label="Next page" disabled={currentPage === pages.length - 1} onClick={() => setPage(currentPage + 1)}>&gt;</button>
          </nav>
        )}
      </div>
    </section>
  );
}

export default DashboardLevelProgress;
