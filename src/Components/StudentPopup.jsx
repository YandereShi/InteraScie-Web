import "../css/StudentPopup.css";
import { useState } from "react";
import studentImage from "../assets/pfp.png";

function StudentPopup({
  student,
  sections,
  onClose,
  onSave,
}) {
  const isEditing = Boolean(student);

  const [firstName, setFirstName] = useState(
    student?.firstName ?? ""
  );

  const [lastName, setLastName] = useState(
    student?.lastName ?? ""
  );

  const [username, setUsername] = useState(
    student?.username ?? ""
  );

  const [sectionID, setSectionID] = useState(
    student?.sectionID
      ? String(student.sectionID)
      : ""
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setSaveError("");

    try {
      await onSave({
        firstName,
        lastName,
        username,
        sectionID: Number(sectionID),
      });
    } catch (error) {
      console.error(error.message);
      setSaveError(error.message);
      setSaving(false);
    }
  }

  return (
    <div
      className="studentpopupoverlay"
      onMouseDown={onClose}
    >
      <div
        className="studentpopup"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="studentpopupheader">
          <h2>
            {isEditing ? "Edit Student" : "Add Student"}
          </h2>

          <button
            type="button"
            className="closestudentpopup"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          className="studentpopupcontent"
          onSubmit={handleSubmit}
        >
          <img
            className="studentpopupimage"
            src={studentImage}
            alt="Student"
          />

          <div className="studentpopupform">
            <label htmlFor="student-first-name">
              First name
            </label>

            <input
              type="text"
              id="student-first-name"
              value={firstName}
              onChange={(event) =>
                setFirstName(event.target.value)
              }
              required
            />

            <label htmlFor="student-last-name">
              Last name
            </label>

            <input
              type="text"
              id="student-last-name"
              value={lastName}
              onChange={(event) =>
                setLastName(event.target.value)
              }
              required
            />

            <label htmlFor="student-username">
              Username
            </label>

            <input
              type="text"
              id="student-username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />

            <label htmlFor="student-section">
              Section
            </label>

            <select
              id="student-section"
              value={sectionID}
              onChange={(event) =>
                setSectionID(event.target.value)
              }
              required
            >
              <option value="" disabled>
                Select Section
              </option>

              {sections.map((section) => (
                <option
                  key={section.sectionID}
                  value={section.sectionID}
                >
                  {section.sectionName}
                </option>
              ))}
            </select>
          </div>

          {saveError && (
            <p className="studentpopuperror">
              {saveError}
            </p>
          )}

          <div className="studentpopupactions">
            <button
              type="button"
              className="cancelstudent"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="savestudent"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentPopup;
