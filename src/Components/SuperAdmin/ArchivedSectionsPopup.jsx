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
  const [restoring, setRestoring] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useActionPending(restoring !== null);
  const filtered = sections.filter((section) => section.sectionName.toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pages);
  if (page > pages) setPage(pages);
  const shown = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);

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

  async function Restore(section) {
    if (pending.current) return;
    const owner = owners[section.sectionID] ?? (teachers.some((teacher) => teacher.staffID === section.staffID) ? section.staffID : "");
    if (!owner) {
      setError("Choose an active teacher before restoring the section.");
      return;
    }
    pending.current = true;
    setRestoring(section.sectionID);
    setError("");
    setStatus("");
    try {
      const result = await SetSectionArchived(section.sectionID, false, owner);
      await InvalidateSectionQueries(queryClient);
      setConfirming(null);
      setStatus(`Section restored. ${result.students} student(s) restored with it.`);
    } catch (restoreError) {
      setError(restoreError.message || "Unable to restore the section.");
    } finally {
      pending.current = false;
      setRestoring(null);
    }
  }

  return (
    <dialog ref={dialog} className="archivedsectionspopup" aria-labelledby="archivedsectionstitle" onCancel={(event) => {
      event.preventDefault();
      if (!pending.current) onClose();
    }}>
      <div className="archivedsectionsheader">
        <h2 id="archivedsectionstitle">Archived Sections</h2>
        <button type="button" aria-label="Close archived sections" disabled={restoring !== null} onClick={onClose}>&times;</button>
      </div>
      <input className="archivedsectionssearch" type="search" aria-label="Search archived sections" placeholder="Search sections..." maxLength={limits.search} value={search} disabled={restoring !== null} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      {error && <p className="archivedsectionserror" role="alert">{error}</p>}
      {status && <p className="archivedsectionsstatus" role="status">{status}</p>}
      <div className="archivedsectionslist" aria-busy={restoring !== null}>
        {shown.length === 0 && <p>No archived sections found.</p>}
        {shown.map((section) => (
          <article className="archivedsectionsitem" key={section.sectionID}>
            <div>
              <h3>{section.sectionName}</h3>
              <p>{section.students.length} student(s) · Archived {new Date(section.archivedAt).toLocaleDateString()}</p>
              <details>
                <summary>View students</summary>
                <ul>{section.students.map((student) => <li key={student.studentID}>{student.lastName}, {student.firstName}</li>)}</ul>
              </details>
            </div>
            <div className="archivedsectionsactions">
              <select aria-label={`Teacher for ${section.sectionName}`} value={owners[section.sectionID] ?? (teachers.some((teacher) => teacher.staffID === section.staffID) ? section.staffID : "")} disabled={restoring !== null} onChange={(event) => setOwners((current) => ({ ...current, [section.sectionID]: event.target.value }))}>
                <option value="">Choose a teacher</option>
                {teachers.map((teacher) => <option key={teacher.staffID} value={teacher.staffID}>{teacher.lastName}, {teacher.firstName}</option>)}
              </select>
              {confirming === section.sectionID ? (
                <>
                  <p>Restore this section and the students archived with it? Previously archived students will stay archived.</p>
                  <button type="button" disabled={restoring !== null} onClick={() => Restore(section)}>{restoring === section.sectionID ? "Restoring..." : "Confirm Restore"}</button>
                  <button type="button" className="archivedsectionscancel" disabled={restoring !== null} onClick={() => setConfirming(null)}>Cancel</button>
                </>
              ) : (
                <button type="button" disabled={restoring !== null || teachers.length === 0} onClick={() => { setConfirming(section.sectionID); setError(""); }}>Restore Section</button>
              )}
            </div>
          </article>
        ))}
      </div>
      <nav className="sectionpager archivedsectionspager" aria-label="Archived sections pages">
        <button type="button" aria-label="Previous archived sections" disabled={activePage === 1 || restoring !== null} onClick={() => setPage(activePage - 1)}>&lt;</button>
        <span>{activePage} of {pages}</span>
        <button type="button" aria-label="Next archived sections" disabled={activePage === pages || restoring !== null} onClick={() => setPage(activePage + 1)}>&gt;</button>
      </nav>
    </dialog>
  );
}

export default ArchivedSectionsPopup;
