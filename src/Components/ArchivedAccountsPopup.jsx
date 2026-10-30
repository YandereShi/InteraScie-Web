import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SetAccountsArchived } from "../lib/archiveQueries";
import { InvalidateSectionQueries } from "../lib/studentCache";
import { limits } from "../lib/inputLimits";
import { useActionPending } from "../lib/useActionPending";
import "../css/ArchivedSectionsPopup.css";

const pageSize = 5;

function ArchivedAccountsPopup({ kind, records, sections = [], loading = false, error: loadError, onClose }) {
  const dialog = useRef(null);
  const pending = useRef(false);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [targets, setTargets] = useState({});
  const [restoring, setRestoring] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useActionPending(restoring);
  const title = kind === "students" ? "Archived Students" : "Archived Teachers";
  const term = search.trim().toLowerCase();
  const filtered = records.filter((record) => `${record.firstName} ${record.lastName}`.toLowerCase().includes(term) || `${record.lastName} ${record.firstName}`.toLowerCase().includes(term));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pages);
  if (!loading && !loadError && page > pages) setPage(pages);
  const shown = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);
  const sectionChoices = sections.filter((section) => !section.archivedAt);
  const selected = records.filter((record) => {
    const id = kind === "students" ? record.studentID : record.staffID;
    return kind === "students"
      ? sectionChoices.some((section) => String(section.sectionID) === targets[id])
      : targets[id] === "restore";
  });

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

  function ChangeTarget(id, value) {
    if (pending.current) return;
    setTargets((current) => ({ ...current, [id]: value }));
    setRowErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setError("");
    setStatus("");
  }

  async function Restore() {
    if (pending.current || loading || loadError || selected.length === 0) return;
    const jobs = new Map();
    for (const record of selected) {
      const id = kind === "students" ? record.studentID : record.staffID;
      const target = kind === "students" ? targets[id] : null;
      const job = jobs.get(target) ?? { target, ids: [] };
      job.ids.push(id);
      jobs.set(target, job);
    }
    pending.current = true;
    setRestoring(true);
    setError("");
    setStatus("");
    setRowErrors({});
    const restored = new Set();
    const failures = {};
    let count = 0;
    try {
      for (const job of jobs.values()) {
        try {
          const result = await SetAccountsArchived(kind, job.ids, false, [], kind === "students" ? Number(job.target) : null);
          count += result.accounts;
          job.ids.forEach((id) => restored.add(String(id)));
        } catch (restoreError) {
          job.ids.forEach((id) => {
            failures[id] = restoreError.message || "Unable to restore the account.";
          });
        }
      }
      setTargets((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !restored.has(id))));
      setRowErrors(failures);
      if (count > 0) setStatus(`${count} ${kind === "students" ? "student(s)" : "teacher(s)"} restored successfully.`);
      if (Object.keys(failures).length > 0) setError("Some accounts could not be restored. Review the marked rows and try again.");
      await InvalidateSectionQueries(queryClient);
    } catch (restoreError) {
      setError(restoreError.message || "Unable to refresh archived accounts. Close this popup and try again.");
    } finally {
      pending.current = false;
      setRestoring(false);
    }
  }

  return (
    <dialog ref={dialog} className="archivedsectionspopup" aria-labelledby="archivedaccountstitle" onCancel={(event) => { event.preventDefault(); if (!pending.current) onClose(); }}>
      <div className="archivedsectionsheader">
        <h2 id="archivedaccountstitle">{title}</h2>
        <button type="button" aria-label="Close archived accounts" disabled={restoring} onClick={() => { if (!pending.current) onClose(); }}>&times;</button>
      </div>
      {kind === "teachers" && <p>Restoring a teacher keeps their saved data and does not take back transferred sections.</p>}
      <p>{kind === "students" ? "Choose an active section for each student you want to restore." : "Choose Restore account for each teacher you want to restore."} Selections are kept across pages and search.</p>
      <input className="archivedsectionssearch" type="search" aria-label={`Search ${title.toLowerCase()}`} placeholder="Search names..." maxLength={limits.search} value={search} disabled={restoring} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      {(error || loadError) && <p className="archivedsectionserror" role="alert">{error || loadError.message || "Unable to load archived accounts."}</p>}
      {status && <p className="archivedsectionsstatus" role="status">{status}</p>}
      <div className="archivedsectionslist" aria-busy={loading || restoring}>
        {loading ? <p>Loading archived accounts...</p> : !loadError && shown.length === 0 ? <p>No archived accounts found.</p> : !loadError && shown.map((record) => {
          const id = kind === "students" ? record.studentID : record.staffID;
          return (
            <article className={`archivedsectionsitem${rowErrors[id] ? " archivedsectionsitemerror" : ""}`} key={id}>
              <div>
                <h3>{record.lastName}, {record.firstName}</h3>
                {kind === "students" && <p>{record.section || "No Section"}</p>}
                <p>Archived {new Date(record.archivedAt).toLocaleDateString()}</p>
              </div>
              <div className="archivedsectionsactions">
                {kind === "students" ? (
                  <select aria-label={`Section for ${record.firstName} ${record.lastName}`} value={sectionChoices.some((section) => String(section.sectionID) === targets[id]) ? targets[id] : ""} aria-invalid={Boolean(rowErrors[id])} aria-describedby={rowErrors[id] ? `archivedaccounterror-${id}` : undefined} disabled={restoring || sectionChoices.length === 0} onChange={(event) => ChangeTarget(id, event.target.value)}>
                    <option value="">Choose an active section</option>
                    {sectionChoices.map((section) => <option key={section.sectionID} value={section.sectionID}>{section.isShared ? "No Section" : section.displayName || section.sectionName}</option>)}
                  </select>
                ) : (
                  <select aria-label={`Restore ${record.firstName} ${record.lastName}`} value={targets[id] ?? ""} aria-invalid={Boolean(rowErrors[id])} aria-describedby={rowErrors[id] ? `archivedaccounterror-${id}` : undefined} disabled={restoring} onChange={(event) => ChangeTarget(id, event.target.value)}>
                    <option value="">Keep archived</option>
                    <option value="restore">Restore account</option>
                  </select>
                )}
                {rowErrors[id] && <p id={`archivedaccounterror-${id}`} className="archivedsectionserror">{rowErrors[id]}</p>}
              </div>
            </article>
          );
        })}
      </div>
      <nav className="sectionpager archivedsectionspager" aria-label="Archived accounts pages">
        <button type="button" aria-label="Previous archived accounts" disabled={activePage === 1 || restoring} onClick={() => setPage(activePage - 1)}>&lt;</button>
        <span>{activePage} of {pages}</span>
        <button type="button" aria-label="Next archived accounts" disabled={activePage === pages || restoring} onClick={() => setPage(activePage + 1)}>&gt;</button>
      </nav>
      <div className="archivedsectionsactions archiveteachersfooter">
        <button type="button" disabled={restoring || loading || Boolean(loadError) || selected.length === 0} onClick={Restore}>{restoring ? "Restoring..." : "Restore"}</button>
      </div>
    </dialog>
  );
}

export default ArchivedAccountsPopup;
