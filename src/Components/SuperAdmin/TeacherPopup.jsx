import "../../css/StudentPopup.css";
import { useState } from "react";
import teacherImage from "../../assets/pfp.png";
import { GetNameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";

function TeacherPopup({ sections, onClose, onSave }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [sectionIDs, setSectionIDs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    function HandleNameChange(value, setName) {
        if (!/^[\p{L}\p{M} ]*$/u.test(value)) {
            setSaveError("Names can contain letters and spaces only.");
            return;
        }

        setName(value);
        setSaveError("");
    }

    function HandleSectionChange(sectionID, isChecked) {
        if (isChecked) {
            setSectionIDs((current) =>
                current.includes(sectionID)
                    ? current
                    : [...current, sectionID]
            );
            return;
        }

        setSectionIDs((current) =>
            current.filter((item) => item !== sectionID)
        );
    }

    async function HandleSubmit(event) {
        event.preventDefault();

        const nameerror = GetNameError(firstName, lastName);

        if (nameerror) {
            setSaveError(nameerror);
            return;
        }

        if (email.trim().length > limits.email) {
            setSaveError(`Email must be ${limits.email} characters or fewer.`);
            return;
        }

        setSaving(true);
        setSaveError("");

        try {
            await onSave({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                sectionIDs,
            });
        } catch (error) {
            setSaveError(error.message || "Unable to create teacher.");
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
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="studentpopupheader">
                    <h2>Add Teacher</h2>

                    <button
                        type="button"
                        className="closestudentpopup"
                        onClick={onClose}
                        disabled={saving}
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
                        src={teacherImage}
                        alt="Teacher"
                    />

                    <div className="studentpopupform">
                        <label htmlFor="teacherfirstname">
                            First name
                        </label>

                        <input
                            type="text"
                            id="teacherfirstname"
                            maxLength={limits.firstname}
                            value={firstName}
                            onChange={(event) =>
                                HandleNameChange(
                                    event.target.value,
                                    setFirstName
                                )
                            }
                            required
                        />

                        <label htmlFor="teacherlastname">
                            Last name
                        </label>

                        <input
                            type="text"
                            id="teacherlastname"
                            maxLength={limits.lastname}
                            value={lastName}
                            onChange={(event) =>
                                HandleNameChange(
                                    event.target.value,
                                    setLastName
                                )
                            }
                            required
                        />

                        <label htmlFor="teacheremail">
                            Email
                        </label>

                        <input
                            type="email"
                            id="teacheremail"
                            maxLength={limits.email}
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />

                        <fieldset className="teachersectionlist">
                            <legend>Sections</legend>

                            <div className="teachersectionscroll">
                                {sections.length === 0 && (
                                    <p className="teachersectionempty">
                                        No sections are available.
                                    </p>
                                )}

                                {sections.map((section) => (
                                    <label
                                        className="teachersectionoption"
                                        key={section.sectionID}
                                        htmlFor={`newteachersection${section.sectionID}`}
                                    >
                                        <input
                                            type="checkbox"
                                            id={`newteachersection${section.sectionID}`}
                                            checked={sectionIDs.includes(section.sectionID)}
                                            onChange={(event) =>
                                                HandleSectionChange(
                                                    section.sectionID,
                                                    event.target.checked
                                                )
                                            }
                                        />

                                        <span>{section.sectionName || "Unnamed Section"}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
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
                            disabled={saving}
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

export default TeacherPopup;
