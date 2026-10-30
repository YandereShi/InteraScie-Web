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
  const [confirming, setConfirming] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useActionPending(restoring !== null);
  const title = kind === "students" ? "Archived Students" : "Archived Teachers";
  const term = search.trim().toLowerCase();
  const filtered = records.filter((record) => `${record.firstName} ${record.lastName}`.toLowerCase().includes(term) || `${record.lastName} ${record.firstName}`.toLowerCase().includes(term));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pages);
  if (!loading && !loadError && page > pages) setPage(pages);
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

  async function Restore(record) {
    if (pending.current) return;
    const id = kind === "students" ? record.studentID : record.staffID;
    const target = targets[id] ?? (sections.some((section) => section.sectionID === record.sectionID) ? String(record.sectionID) : "");
    if (kind === "students" && !target) {
      setError("Choose an active section before restoring the student.");
      return;
    }
    pending.current = true;
    setRestoring(id);
    setError("");
    setStatus("");
    try {
      await SetAccountsArchived(kind, [id], false, [], kind === "students" ? Number(target) : null);
      await InvalidateSectionQueries(queryClient);
      setConfirming(null);
      setStatus(`${record.firstName} ${record.lastName} restored successfully.`);
    } catch (restoreError) {
      setError(restoreError.message || "Unable to restore the account.");
    } finally {
      pending.current = false;
      setRestoring(null);
    }
  }

  return (
    <dialog ref={dialog} className="archivedsectionspopup" aria-labelledby="archivedaccountstitle" onCancel={(event) => { event.preventDefault(); if (!pending.current) onClose(); }}>
      <div className="archivedsectionsheader">
        <h2 id="archivedaccountstitle">{title}</h2>
        <button type="button" aria-label="Close archived accounts" disabled={restoring !== null} onClick={onClose}>&times;</button>
      </div>
      {kind === "teachers" && <p>Restoring a teacher keeps their saved data and does not take back transferred sections.</p>}
      <input className="archivedsectionssearch" type="search" aria-label={`Search ${title.toLowerCase()}`} placeholder="Search names..." maxLength={limits.search} value={search} disabled={restoring !== null} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      {(error || loadError) && <p className="archivedsectionserror" role="alert">{error || loadError.message || "Unable to load archived accounts."}</p>}
      {status && <p className="archivedsectionsstatus" role="status">{status}</p>}
      <div className="archivedsectionslist" aria-busy={loading || restoring !== null}>
        {loading ? <p>Loading archived accounts...</p> : !loadError && shown.length === 0 ? <p>No archived accounts found.</p> : !loadError && shown.map((record) => {
          const id = kind === "students" ? record.studentID : record.staffID;
          return (
            <article className="archivedsectionsitem" key={id}>
              <div>
                <h3>{record.lastName}, {record.firstName}</h3>
                {kind === "students" && <p>{record.section || "No Section"}</p>}
                <p>Archived {new Date(record.archivedAt).toLocaleDateString()}</p>
              </div>
              <div className="archivedsectionsactions">
                {kind === "students" && (
                  <select aria-label={`Section for ${record.firstName} ${record.lastName}`} value={targets[id] ?? (sections.some((section) => section.sectionID === record.sectionID) ? String(record.sectionID) : "")} disabled={restoring !== null} onChange={(event) => setTargets((current) => ({ ...current, [id]: event.target.value }))}>
                    <option value="">Choose an active section</option>
                    {sections.map((section) => <option key={section.sectionID} value={section.sectionID}>{section.isShared ? "No Section" : section.displayName || section.sectionName}</option>)}
                  </select>
                )}
                {confirming === id ? <>
                  <p>Restore this account with its saved data?</p>
                  <button type="button" disabled={restoring !== null} onClick={() => Restore(record)}>{restoring === id ? "Restoring..." : "Confirm Restore"}</button>
                  <button type="button" className="archivedsectionscancel" disabled={restoring !== null} onClick={() => setConfirming(null)}>Cancel</button>
                </> : <button type="button" disabled={restoring !== null || (kind === "students" && sections.length === 0)} onClick={() => { setConfirming(id); setError(""); }}>Restore Account</button>}
              </div>
            </article>
          );
        })}
      </div>
      <nav className="sectionpager archivedsectionspager" aria-label="Archived accounts pages">
        <button type="button" aria-label="Previous archived accounts" disabled={activePage === 1 || restoring !== null} onClick={() => setPage(activePage - 1)}>&lt;</button>
        <span>{activePage} of {pages}</span>
        <button type="button" aria-label="Next archived accounts" disabled={activePage === pages || restoring !== null} onClick={() => setPage(activePage + 1)}>&gt;</button>
      </nav>
    </dialog>
  );
}

export default ArchivedAccountsPopup;
