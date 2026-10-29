import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AssignTeacherSections } from "../../lib/teacherQueries";
import { InvokeStudentManagement } from "../../lib/supabase";
import { InvalidateSectionQueries } from "../../lib/studentCache";
import { useActionPending } from "../../lib/useActionPending";
import { GetStudentPhotoPath } from "../../lib/profilePhotos";
import ProfilePhoto from "../ProfilePhoto";
import studentImage from "../../assets/pfp.png";
import "../../css/ImportantPopup.css";

const labels = {
  students: { title: "Students Without a Section", empty: "All students have a section." },
  sections: { title: "Sections Without a Teacher", empty: "All sections have a teacher." },
  teachers: { title: "Teachers Without Sections", empty: "All teachers have a section." },
};

function ImportantPopup({ category, records, students, sections, teachers, loading, error, onClose }) {
  const dialog = useRef(null);
  const pending = useRef(false);
  const queryClient = useQueryClient();
  const [selections, setSelections] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [status, setStatus] = useState("");
  useActionPending(saving);
  const label = labels[category];
  const sectionChoices = sections.filter((section) => section.isShared !== true)
    .sort((first, second) => String(first.sectionName ?? "").localeCompare(String(second.sectionName ?? "")));
  const availableSections = sectionChoices.filter((section) => section.staffID === null);
  const teacherChoices = [...teachers].sort((first, second) =>
    `${first.lastName ?? ""} ${first.firstName ?? ""}`.localeCompare(`${second.lastName ?? ""} ${second.firstName ?? ""}`)
  );
  const sortedRecords = [...records].sort((first, second) => GetName(first).localeCompare(GetName(second)));
  const selectedRecords = sortedRecords.filter((item) => selections[GetID(item)]?.length > 0);
  const sectionOwners = new Map();

  if (category === "teachers") {
    selectedRecords.forEach((item) => {
      selections[GetID(item)].forEach((sectionID) => sectionOwners.set(sectionID, GetID(item)));
    });
  }

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();

    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function GetID(item) {
    return String(category === "students" ? item.studentID : category === "sections" ? item.sectionID : item.staffID);
  }

  function GetName(item) {
    return category === "sections"
      ? item.sectionName || "Unnamed Section"
      : [item.lastName, item.firstName].filter(Boolean).join(", ") || "Unnamed account";
  }

  function ChangeSelection(id, values) {
    if (pending.current) return;
    setSelections((current) => ({ ...current, [id]: values }));
    setRowErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setSaveError("");
    setStatus("");
  }

  async function SaveAssignments(event) {
    event.preventDefault();
    if (pending.current || loading || error || selectedRecords.length === 0) return;

    const jobs = new Map();
    const chosenSections = new Set();

    for (const item of selectedRecords) {
      const id = GetID(item);
      const values = [...new Set(selections[id])];

      if (category === "teachers") {
        if (values.some((sectionID) => chosenSections.has(sectionID))) {
          setSaveError("A section can only be assigned to one teacher.");
          return;
        }
        values.forEach((sectionID) => chosenSections.add(sectionID));
      }

      const target = category === "teachers" ? item.staffID : values[0];
      const job = jobs.get(target) ?? { target, ids: [], recordIDs: [] };
      job.ids.push(...(category === "teachers" ? values.map(Number) : [Number(id)]));
      job.recordIDs.push(id);
      jobs.set(target, job);
    }

    pending.current = true;
    setSaving(true);
    setSaveError("");
    setStatus("");
    setRowErrors({});
    const saved = new Set();
    const failures = {};

    try {
      for (const job of jobs.values()) {
        try {
          if (category === "students") {
            await InvokeStudentManagement("movetosection", {
              studentIDs: job.ids,
              sectionID: Number(job.target),
            });
          } else {
            await AssignTeacherSections(job.target, job.ids);
          }
          job.recordIDs.forEach((id) => saved.add(id));
        } catch (requestError) {
          job.recordIDs.forEach((id) => {
            failures[id] = requestError.message || "Unable to save the assignment.";
          });
        }
      }

      setSelections((current) => Object.fromEntries(
        Object.entries(current).filter(([id]) => !saved.has(id))
      ));
      setRowErrors(failures);
      if (Object.keys(failures).length > 0) {
        setSaveError("Some assignments could not be saved. Review the marked rows and try again.");
      } else {
        setStatus("Assignments saved successfully.");
      }
      await InvalidateSectionQueries(queryClient);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} className="importantpopup" aria-labelledby="importantpopuptitle" onCancel={(event) => {
      event.preventDefault();
      if (!pending.current) onClose();
    }}>
      <div className="importantpopupheader">
        <h2 id="importantpopuptitle">{label.title}</h2>
        <button type="button" className="importantpopupclose" onClick={() => { if (!pending.current) onClose(); }} disabled={saving} aria-label="Close important records">&times;</button>
      </div>
      {status && <p className="importantpopupstatus" role="status">{status}</p>}
      <form className="importantpopupform" onSubmit={SaveAssignments}>
        <div className="importantpopuplist" role="region" aria-label={label.title} tabIndex={0}>
          {loading ? <p className="importantpopupstate" role="status">Loading records...</p>
            : error ? <p className="importantpopupstate importantpopuperror" role="alert">Unable to load records. Close this popup and try again.</p>
            : sortedRecords.length === 0 ? <p className="importantpopupstate">{label.empty}</p>
            : sortedRecords.map((item) => {
              const id = GetID(item);
              const selected = selections[id] ?? [];
              const rowError = rowErrors[id];

              return (
                <div className={rowError ? "importantpopuprow importantpopuprowerror" : "importantpopuprow"} key={id}>
                  <div className="importantpopupidentity">
                    {category === "students" && <ProfilePhoto path={GetStudentPhotoPath(item.studentID)} fallback={studentImage} className="importantstudentphoto" alt="" />}
                    <div>
                      <strong>{GetName(item)}</strong>
                      {category === "sections" && <span>Students: {students.filter((student) => student.sectionID === item.sectionID).length}</span>}
                    </div>
                  </div>
                  <div className="importantpopupselection">
                    {category === "teachers" ? (
                      <details className="importantsectionsdropdown">
                        <summary onClick={(event) => { if (pending.current) event.preventDefault(); }}>
                          {selected.length > 0 ? `${selected.length} ${selected.length === 1 ? "section" : "sections"} selected` : "Choose sections"}
                        </summary>
                        <fieldset disabled={saving} aria-label={`Sections for ${GetName(item)}`}>
                          {availableSections.length === 0 ? <p>No unassigned sections are available.</p>
                            : availableSections.map((section) => {
                              const value = String(section.sectionID);
                              const owner = sectionOwners.get(value);
                              return (
                                <label className="importantsectionoption" key={section.sectionID}>
                                  <input type="checkbox" checked={selected.includes(value)} disabled={Boolean(owner && owner !== id)} onChange={(event) => {
                                    ChangeSelection(id, event.target.checked ? [...selected, value] : selected.filter((sectionID) => sectionID !== value));
                                  }} />
                                  <span>{section.sectionName || "Unnamed Section"}</span>
                                </label>
                              );
                            })}
                        </fieldset>
                      </details>
                    ) : (
                      <select value={selected[0] ?? ""} onChange={(event) => ChangeSelection(id, event.target.value ? [event.target.value] : [])}
                        aria-label={`${category === "students" ? "Section" : "Teacher"} for ${GetName(item)}`}
                        aria-invalid={Boolean(rowError)} aria-describedby={rowError ? `importantrowerror-${id}` : undefined}
                        disabled={saving || (category === "students" ? sectionChoices : teacherChoices).length === 0}>
                        <option value="">{category === "students"
                          ? sectionChoices.length > 0 ? "Choose a section" : "No sections available"
                          : teacherChoices.length > 0 ? "Choose a teacher" : "No teachers available"}</option>
                        {category === "students" ? sectionChoices.map((section) => (
                          <option key={section.sectionID} value={section.sectionID}>{section.sectionName || "Unnamed Section"}</option>
                        )) : teacherChoices.map((teacher) => (
                          <option key={teacher.staffID} value={teacher.staffID}>{[teacher.lastName, teacher.firstName].filter(Boolean).join(", ")}</option>
                        ))}
                      </select>
                    )}
                    {rowError && <p id={`importantrowerror-${id}`} className="importantpopuperror">{rowError}</p>}
                  </div>
                </div>
              );
            })}
        </div>
        {saveError && <p className="importantpopuperror" role="alert">{saveError}</p>}
        <div className="importantpopupactions">
          <button type="submit" className="importantpopupsave" disabled={saving || loading || Boolean(error) || selectedRecords.length === 0}>{saving ? "Saving..." : "Save All"}</button>
        </div>
      </form>
    </dialog>
  );
}

export default ImportantPopup;
