import "../../css/StudentPopup.css";
import { useState } from "react";
import studentImage from "../../assets/pfp.png";
import { GetNameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";

function StudentPopup({
  student,
  sections,
  onClose,
  onSave,
  onReset,
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
  const [resetting, setResetting] = useState(false);

  async function resetPassword() {
    setResetting(true);
    setSaveError("");

    try {
      await onReset(student);
    } catch (error) {
      console.error(error.message);
      setSaveError(error.message);
    } finally {
      setResetting(false);
    }
  }

  function HandleNameChange(value, SetName) {
    if (!/^[\p{L}\p{M} ]*$/u.test(value)) {
      setSaveError("Names can contain letters and spaces only.");
      return;
    }

    SetName(value);
    setSaveError("");
  }

  async function HandleSubmit(event) {
    event.preventDefault();

    const nameerror = GetNameError(firstName, lastName);

    if (nameerror) {
      setSaveError(nameerror);
      return;
    }

    if (
      username.length > limits.username ||
      username.trim().toLowerCase().length > limits.username
    ) {
      setSaveError(`Username must be ${limits.username} characters or fewer.`);
      return;
    }

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
          onSubmit={HandleSubmit}
        >
          <img
            className="studentpopupimage"
            src={studentImage}
            alt="Student"
          />

          <div className="studentpopupform">
            <label htmlFor="studentfirstname">
              First name
            </label>

            <input
              type="text"
              id="studentfirstname"
              maxLength={limits.firstname}
              value={firstName}
              onChange={(event) =>
                HandleNameChange(event.target.value, setFirstName)
              }
              required
            />

            <label htmlFor="studentlastname">
              Last name
            </label>

            <input
              type="text"
              id="studentlastname"
              maxLength={limits.lastname}
              value={lastName}
              onChange={(event) =>
                HandleNameChange(event.target.value, setLastName)
              }
              required
            />

            <label htmlFor="studentusername">
              Username
            </label>

            <input
              type="text"
              id="studentusername"
              maxLength={limits.username}
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />

            <label htmlFor="studentsection">
              Section
            </label>

            <select
              id="studentsection"
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
                  {section.displayName ?? section.sectionName}
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
            {isEditing && (
              <button
                type="button"
                className="resetstudent"
                onClick={resetPassword}
                disabled={saving || resetting}
              >
                {resetting
                  ? "Resetting..."
                  : "Reset Password"}
              </button>
            )}

            <button
              type="button"
              className="cancelstudent"
              onClick={onClose}
              disabled={saving || resetting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="savestudent"
              disabled={saving || resetting}
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
