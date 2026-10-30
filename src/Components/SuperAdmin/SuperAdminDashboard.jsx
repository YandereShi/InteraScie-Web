import "../../css/TeacherDashboard.css";
import "../../css/SuperAdminDashboard.css";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaChalkboardTeacher } from "react-icons/fa";
import { PiStudentFill } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { GetSuperAdminDashboard, superAdminDashboardQueryKey } from "../../lib/dashboardQueries";
import DashboardLevelProgress from "../Teacher/DashboardLevelProgress";
import SuperAdminPage from "./SuperAdminPage";
import ImportantPopup from "./ImportantPopup";
import ArchivedSectionsPopup from "./ArchivedSectionsPopup";
import ArchivedAccountsPopup from "../ArchivedAccountsPopup";

const maxTeachers = 5;
const emptyList = [];

function SuperAdminDashboard() {
  const [page, setPage] = useState(0);
  const [important, setImportant] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(null);
  const dashboardQuery = useQuery({
    queryKey: superAdminDashboardQueryKey,
    queryFn: GetSuperAdminDashboard,
    staleTime: 2 * 60 * 1000,
  });
  const dashboard = dashboardQuery.data;
  const students = dashboard?.students ?? emptyList;
  const sections = dashboard?.sections ?? emptyList;
  const teachers = dashboard?.teachers ?? emptyList;
  const loading = dashboardQuery.isPending;
  const error = dashboardQuery.error;
  const sectionMap = new Map(sections.map((section) => [section.sectionID, section]));
  const teacherIDs = new Set(teachers.map((teacher) => teacher.staffID));
  const teacherSections = new Map();
  const teacherStudents = new Map();

  sections.forEach((section) => {
    if (section.isShared !== true && teacherIDs.has(section.staffID)) {
      teacherSections.set(section.staffID, (teacherSections.get(section.staffID) ?? 0) + 1);
    }
  });

  students.forEach((student) => {
    const section = sectionMap.get(student.sectionID);
    if (section && section.isShared !== true && teacherIDs.has(section.staffID)) {
      teacherStudents.set(section.staffID, (teacherStudents.get(section.staffID) ?? 0) + 1);
    }
  });

  const unassignedStudents = students.filter((student) => {
    const section = sectionMap.get(student.sectionID);
    return !section || section.isShared === true;
  });
  const unassignedSections = sections.filter(
    (section) => section.isShared !== true && !teacherIDs.has(section.staffID)
  );
  const unassignedTeachers = teachers.filter(
    (teacher) => !teacherSections.has(teacher.staffID)
  );
  const progressSections = sections.map((section) => ({
    ...section,
    sectionName: section.isShared === true ? "No Section" : section.sectionName || "Unnamed Section",
  })).sort((first, second) => first.sectionName.localeCompare(second.sectionName));
  const sortedTeachers = [...teachers].sort((first, second) =>
    `${first.lastName ?? ""} ${first.firstName ?? ""}`.localeCompare(`${second.lastName ?? ""} ${second.firstName ?? ""}`)
  );
  const pages = Math.max(1, Math.ceil(sortedTeachers.length / maxTeachers));
  const activePage = Math.min(page, pages - 1);
  if (dashboardQuery.isSuccess && page > pages - 1) {
    setPage(pages - 1);
  }
  const shown = sortedTeachers.slice(activePage * maxTeachers, (activePage + 1) * maxTeachers);

  return (
    <SuperAdminPage title="Dashboard">
      <section className="dashboardpanel superadmindashboardpanel">
        <div className="dashboardtotals dashboardtile superadmindashboardtotals">
          <article className="totalcard totalstudentcard">
            <PiStudentFill className="totalicon" aria-hidden="true" />
            <div className="totaldetails">
              <h2>Total Students</h2>
              <p>{loading ? "..." : error ? "--" : dashboard?.studentTotal ?? 0}</p>
            </div>
          </article>
          <article className="totalcard totalteachercard">
            <FaChalkboardTeacher className="totalicon" aria-hidden="true" />
            <div className="totaldetails">
              <h2>Total Teachers</h2>
              <p>{loading ? "..." : error ? "--" : dashboard?.teacherTotal ?? 0}</p>
            </div>
          </article>
          <article className="totalcard totalsectioncard">
            <TbUsersGroup className="totalicon" aria-hidden="true" />
            <div className="totaldetails">
              <h2>Total Sections</h2>
              <p>{loading ? "..." : error ? "--" : dashboard?.sectionTotal ?? 0}</p>
            </div>
          </article>
        </div>

        <DashboardLevelProgress
          sections={progressSections}
          students={students}
          levels={dashboard?.levels ?? emptyList}
          records={dashboard?.records ?? emptyList}
          loading={loading}
          error={error}
        />

        <section className="superadminimportant dashboardtile" aria-labelledby="superadminimportanttitle">
          <h2 id="superadminimportanttitle">Important</h2>
          {loading ? <p className="dashboardtilemessage" role="status">Loading records...</p>
            : error ? <p className="dashboardtilemessage" role="alert">Unable to load records.</p>
            : (
              <div className="superadminimportantitems">
                <button type="button" className="superadminimportantitem" onClick={() => setImportant("students")} aria-haspopup="dialog">
                  <strong>{unassignedStudents.length}</strong>
                  <span>Students without a section</span>
                </button>
                <button type="button" className="superadminimportantitem" onClick={() => setImportant("sections")} aria-haspopup="dialog">
                  <strong>{unassignedSections.length}</strong>
                  <span>Sections without a teacher</span>
                </button>
                <button type="button" className="superadminimportantitem" onClick={() => setImportant("teachers")} aria-haspopup="dialog">
                  <strong>{unassignedTeachers.length}</strong>
                  <span>Teachers without sections</span>
                </button>
              </div>
            )}
        </section>

        <section className="superadminoverview dashboardtile" aria-labelledby="superadminoverviewtitle">
          <div className="performancehead">
            <h2 id="superadminoverviewtitle">Teacher Overview</h2>
          </div>
          {loading ? <p className="dashboardtilemessage" role="status">Loading teachers...</p>
            : error ? <p className="superadmindashboardmessage" role="alert">{error.message || "Unable to load the dashboard."}</p>
            : teachers.length === 0 ? <p className="dashboardtilemessage">No teachers yet.</p>
            : (
              <>
                <div className="superadminoverviewtablewrap">
                  <table className="superadminoverviewtable">
                    <thead>
                      <tr>
                        <th scope="col">Teacher</th>
                        <th scope="col">Sections</th>
                        <th scope="col">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((teacher) => (
                        <tr key={teacher.staffID}>
                          <th scope="row">{[teacher.lastName, teacher.firstName].filter(Boolean).join(", ") || "Unnamed teacher"}</th>
                          <td>{teacherSections.get(teacher.staffID) ?? 0}</td>
                          <td>{teacherStudents.get(teacher.staffID) ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pages > 1 && (
                  <nav className="dashboardprogresspagination superadminoverviewpager" aria-label="Teacher overview pages">
                    <button type="button" aria-label="Previous teachers" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>&lt;</button>
                    <span>{activePage + 1} of {pages}</span>
                    <button type="button" aria-label="Next teachers" disabled={activePage === pages - 1} onClick={() => setPage(activePage + 1)}>&gt;</button>
                  </nav>
                )}
              </>
            )}
        </section>

        <section className="superadminarchive dashboardtile" aria-labelledby="superadminarchivetitle">
          <h2 id="superadminarchivetitle">Archive</h2>
          <button type="button" disabled={loading || Boolean(error)} onClick={() => setArchiveOpen("students")} aria-haspopup="dialog">
            <strong>{loading ? "..." : error ? "—" : dashboard?.archivedStudents?.length ?? 0}</strong>
            <span>Archived Students</span>
          </button>
          <button type="button" disabled={loading || Boolean(error)} onClick={() => setArchiveOpen("teachers")} aria-haspopup="dialog">
            <strong>{loading ? "..." : error ? "—" : dashboard?.archivedTeachers?.length ?? 0}</strong>
            <span>Archived Teachers</span>
          </button>
          <button type="button" disabled={loading || Boolean(error)} onClick={() => setArchiveOpen("sections")} aria-haspopup="dialog">
            <strong>{loading ? "..." : error ? "—" : dashboard?.archivedSections?.length ?? 0}</strong>
            <span>Archived Sections</span>
          </button>
        </section>
      </section>
      {archiveOpen === "sections" && (
        <ArchivedSectionsPopup
          sections={dashboard?.archivedSections ?? emptyList}
          teachers={teachers}
          onClose={() => setArchiveOpen(null)}
        />
      )}
      {(archiveOpen === "students" || archiveOpen === "teachers") && (
        <ArchivedAccountsPopup
          key={archiveOpen}
          kind={archiveOpen}
          records={archiveOpen === "students" ? dashboard?.archivedStudents ?? emptyList : dashboard?.archivedTeachers ?? emptyList}
          sections={sections}
          onClose={() => setArchiveOpen(null)}
        />
      )}
      {important && (
        <ImportantPopup
          category={important}
          records={important === "students" ? unassignedStudents : important === "sections" ? unassignedSections : unassignedTeachers}
          students={students}
          sections={sections}
          teachers={teachers}
          loading={loading}
          error={error}
          onClose={() => setImportant(null)}
        />
      )}
    </SuperAdminPage>
  );
}

export default SuperAdminDashboard;
