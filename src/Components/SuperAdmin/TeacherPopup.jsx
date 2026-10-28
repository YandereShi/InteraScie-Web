import "../../css/StudentPopup.css";
import { useRef, useState } from "react";
import teacherImage from "../../assets/pfp.png";
import { GetNameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";
import { emailPattern, GetEmailError, NormalizeEmail } from "../../lib/emailValidation";
import { useActionPending } from "../../lib/useActionPending";

function TeacherPopup({ sections, onClose, onSave }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [sectionIDs, setSectionIDs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const savePending = useRef(false);
    useActionPending(saving);

    function ClosePopup() {
        if (!savePending.current) onClose();
    }

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
        if (savePending.current) return;

        const nameerror = GetNameError(firstName, lastName);

        if (nameerror) {
            setSaveError(nameerror);
            return;
        }

        const emailError = GetEmailError(email);
        if (emailError) {
            setSaveError(emailError);
            return;
        }

        savePending.current = true;
        setSaving(true);
        setSaveError("");

        try {
            await onSave({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: NormalizeEmail(email),
                sectionIDs,
            });
        } catch (error) {
            setSaveError(error?.message || "Unable to create teacher.");
        } finally {
            savePending.current = false;
            setSaving(false);
        }
    }

    return (
        <div
            className="studentpopupoverlay"
            onMouseDown={ClosePopup}
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
                        onClick={ClosePopup}
                        disabled={saving}
                    >
                        ×
                    </button>
                </div>

                <form
                    className="studentpopupcontent"
                    onSubmit={HandleSubmit}
                    aria-busy={saving}
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
                            disabled={saving}
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
                            disabled={saving}
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
                            disabled={saving}
                            maxLength={limits.email}
                            pattern={emailPattern}
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />

                        <fieldset className="teachersectionlist" disabled={saving}>
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
                        <p className="studentpopuperror" role="alert">
                            {saveError}
                        </p>
                    )}

                    <div className="studentpopupactions">
                        <button
                            type="button"
                            className="cancelstudent"
                            onClick={ClosePopup}
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
