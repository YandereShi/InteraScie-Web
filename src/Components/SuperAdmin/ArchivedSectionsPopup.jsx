import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SetSectionArchived } from "../../lib/sectionQueries";
import { InvalidateSectionQueries } from "../../lib/studentCache";
import { limits } from "../../lib/inputLimits";
import { useActionPending } from "../../lib/useActionPending";
import "../../css/ArchivedSectionsPopup.css";

const pageSize = 5;

function ArchivedSectionsPopup({ sections, teachers, onClose }) {
  const dialog = useRef(null);
  const pending = useRef(false);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [owners, setOwners] = useState({});
  const [restoring, setRestoring] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useActionPending(restoring);
  const filtered = sections.filter((section) => section.sectionName.toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pages);
  if (page > pages) setPage(pages);
  const shown = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);
  const teacherChoices = teachers.filter((teacher) => !teacher.archivedAt);
  const selected = sections.filter((section) => teacherChoices.some((teacher) => teacher.staffID === owners[section.sectionID]));

  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  function ChangeOwner(id, value) {
    if (pending.current) return;
    setOwners((current) => ({ ...current, [id]: value }));
    setRowErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setError("");
    setStatus("");
  }

  async function Restore() {
    if (pending.current || selected.length === 0) return;
    pending.current = true;
    setRestoring(true);
    setError("");
    setStatus("");
    setRowErrors({});
    const restored = new Set();
    const failures = {};
    let students = 0;
    try {
      for (const section of selected) {
        try {
          const result = await SetSectionArchived(section.sectionID, false, owners[section.sectionID]);
          restored.add(String(section.sectionID));
          students += result.students;
        } catch (restoreError) {
          failures[section.sectionID] = restoreError.message || "Unable to restore the section.";
        }
      }
      setOwners((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !restored.has(id))));
      setRowErrors(failures);
      if (restored.size > 0) setStatus(`${restored.size} section(s) restored. ${students} student(s) restored with them.`);
      if (Object.keys(failures).length > 0) setError("Some sections could not be restored. Review the marked rows and try again.");
      await InvalidateSectionQueries(queryClient);
    } catch (restoreError) {
      setError(restoreError.message || "Unable to refresh archived sections. Close this popup and try again.");
    } finally {
      pending.current = false;
      setRestoring(false);
    }
  }

  return (
    <dialog ref={dialog} className="archivedsectionspopup" aria-labelledby="archivedsectionstitle" onCancel={(event) => {
      event.preventDefault();
      if (!pending.current) onClose();
    }}>
      <div className="archivedsectionsheader">
        <h2 id="archivedsectionstitle">Archived Sections</h2>
        <button type="button" aria-label="Close archived sections" disabled={restoring} onClick={() => { if (!pending.current) onClose(); }}>&times;</button>
      </div>
      <p>Choose an active teacher for each section you want to restore. Selections are kept across pages and search. Students archived with those sections will also be restored; previously archived students stay archived.</p>
      <input className="archivedsectionssearch" type="search" aria-label="Search archived sections" placeholder="Search sections..." maxLength={limits.search} value={search} disabled={restoring} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      {error && <p className="archivedsectionserror" role="alert">{error}</p>}
      {status && <p className="archivedsectionsstatus" role="status">{status}</p>}
      <div className="archivedsectionslist" aria-busy={restoring}>
        {shown.length === 0 && <p>No archived sections found.</p>}
        {shown.map((section) => (
          <article className={`archivedsectionsitem${rowErrors[section.sectionID] ? " archivedsectionsitemerror" : ""}`} key={section.sectionID}>
            <div>
              <h3>{section.sectionName}</h3>
              <p>{section.students.length} student(s) · Archived {new Date(section.archivedAt).toLocaleDateString()}</p>
              <details>
                <summary>View students</summary>
                <ul>{section.students.map((student) => <li key={student.studentID}>{student.lastName}, {student.firstName}</li>)}</ul>
              </details>
            </div>
            <div className="archivedsectionsactions">
              <select aria-label={`Teacher for ${section.sectionName}`} value={teacherChoices.some((teacher) => teacher.staffID === owners[section.sectionID]) ? owners[section.sectionID] : ""} aria-invalid={Boolean(rowErrors[section.sectionID])} aria-describedby={rowErrors[section.sectionID] ? `archivedsectionerror-${section.sectionID}` : undefined} disabled={restoring || teacherChoices.length === 0} onChange={(event) => ChangeOwner(section.sectionID, event.target.value)}>
                <option value="">Choose a teacher</option>
                {teacherChoices.map((teacher) => <option key={teacher.staffID} value={teacher.staffID}>{teacher.lastName}, {teacher.firstName}</option>)}
              </select>
              {rowErrors[section.sectionID] && <p id={`archivedsectionerror-${section.sectionID}`} className="archivedsectionserror">{rowErrors[section.sectionID]}</p>}
            </div>
          </article>
        ))}
      </div>
      <nav className="sectionpager archivedsectionspager" aria-label="Archived sections pages">
        <button type="button" aria-label="Previous archived sections" disabled={activePage === 1 || restoring} onClick={() => setPage(activePage - 1)}>&lt;</button>
        <span>{activePage} of {pages}</span>
        <button type="button" aria-label="Next archived sections" disabled={activePage === pages || restoring} onClick={() => setPage(activePage + 1)}>&gt;</button>
      </nav>
      <div className="archivedsectionsactions archiveteachersfooter">
        <button type="button" disabled={restoring || selected.length === 0} onClick={Restore}>{restoring ? "Restoring..." : "Restore"}</button>
      </div>
    </dialog>
  );
}

export default ArchivedSectionsPopup;
