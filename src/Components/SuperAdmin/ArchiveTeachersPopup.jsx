import { useEffect, useRef, useState } from "react";
import { useActionPending } from "../../lib/useActionPending";
import "../../css/ArchivedSectionsPopup.css";

function ArchiveTeachersPopup({ selectedTeachers, teachers, onSave, onClose }) {
  const dialog = useRef(null);
  const pending = useRef(false);
  const [assignments, setAssignments] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useActionPending(saving);
  const selectedIDs = new Set(selectedTeachers.map((teacher) => teacher.staffID));
  const choices = teachers.filter((teacher) => !selectedIDs.has(teacher.staffID));
  const sections = selectedTeachers.flatMap((teacher) => teacher.sections.map((section) => ({ ...section, teacherName: `${teacher.lastName}, ${teacher.firstName}` })));

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

  async function Save() {
    if (pending.current) return;
    if (sections.some((section) => !choices.some((teacher) => teacher.staffID === assignments[section.sectionID]))) {
      setError("Choose an active replacement teacher for every section.");
      return;
    }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave([...selectedIDs], sections.map((section) => ({ sectionID: section.sectionID, staffID: assignments[section.sectionID] })));
    } catch (saveError) {
      setError(saveError.message || "Unable to archive the teachers.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} className="archivedsectionspopup" aria-labelledby="archiveteacherstitle" onCancel={(event) => { event.preventDefault(); if (!pending.current) onClose(); }}>
      <div className="archivedsectionsheader">
        <h2 id="archiveteacherstitle">Archive Teachers</h2>
        <button type="button" aria-label="Close archive teachers" disabled={saving} onClick={onClose}>&times;</button>
      </div>
      <p>Archive {selectedTeachers.length} teacher(s)? Their accounts will be disabled. Students stay active, and previous assessments and answers are preserved.</p>
      <p>Choose who will handle each active section. Lesson and assessment access will close until the replacement teacher opens them.</p>
      {error && <p className="archivedsectionserror" role="alert">{error}</p>}
      <div className="archivedsectionslist">
        {selectedTeachers.map((teacher) => <p key={teacher.staffID}>{teacher.lastName}, {teacher.firstName}</p>)}
        {sections.map((section) => (
          <div className="archivedsectionsitem" key={section.sectionID}>
            <div><h3>{section.sectionName}</h3><p>{section.teacherName}</p></div>
            <div className="archivedsectionsactions">
              <select aria-label={`Replacement teacher for ${section.sectionName}`} disabled={saving} value={assignments[section.sectionID] ?? ""} onChange={(event) => { setAssignments((current) => ({ ...current, [section.sectionID]: event.target.value })); setError(""); }}>
                <option value="">Choose a teacher</option>
                {choices.map((teacher) => <option key={teacher.staffID} value={teacher.staffID}>{teacher.lastName}, {teacher.firstName}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
      <div className="archivedsectionsactions archiveteachersfooter">
        <button type="button" className="archivedsectionscancel" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="button" disabled={saving || (sections.length > 0 && choices.length === 0)} onClick={Save}>{saving ? "Archiving..." : "Archive Teachers"}</button>
      </div>
    </dialog>
  );
}

export default ArchiveTeachersPopup;
