import "../../css/StudentPopup.css";
import { useState } from "react";
import teacherImage from "../../assets/pfp.png";
import ProfilePhoto from "../ProfilePhoto";
import { GetStaffPhotoPath } from "../../lib/profilePhotos";
import { GetNameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";

function TeacherSectionPopup({ teacher, sections, onClose, onSave }) {
    const [firstName, setFirstName] = useState(teacher.firstName ?? "");
    const [lastName, setLastName] = useState(teacher.lastName ?? "");
    const [sectionIDs, setSectionIDs] = useState(
        (teacher.sections ?? []).map((section) => section.sectionID)
    );
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const sectionMap = new Map();

    for (const section of [...(teacher.sections ?? []), ...sections]) {
        sectionMap.set(section.sectionID, section);
    }

    const eligibleSections = [...sectionMap.values()].sort((first, second) =>
        String(first.sectionName ?? "").localeCompare(
            String(second.sectionName ?? "")
        )
    );

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
        const nameError = GetNameError(firstName, lastName);

        if (nameError) {
            setSaveError(nameError);
            return;
        }

        setSaving(true);
        setSaveError("");

        try {
            await onSave({
                firstName: firstName.normalize("NFC").trim(),
                lastName: lastName.normalize("NFC").trim(),
                sectionIDs,
            });
        } catch (error) {
            setSaveError(error.message || "Unable to update teacher.");
            setSaving(false);
        }
    }

    return (
        <div
            className="studentpopupoverlay"
            onMouseDown={saving ? undefined : onClose}
        >
            <div
                className="studentpopup"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="studentpopupheader">
                    <h2>Edit Teacher</h2>

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
                    <ProfilePhoto
                        className="studentpopupimage"
                        path={GetStaffPhotoPath(teacher.authUserID)}
                        fallback={teacherImage}
                        alt="Teacher"
                    />

                    <div className="studentpopupform">
                        <label htmlFor="selectedteacherfirstname">
                            First name
                        </label>

                        <input
                            type="text"
                            id="selectedteacherfirstname"
                            value={firstName}
                            maxLength={limits.firstname}
                            onChange={(event) => setFirstName(event.target.value)}
                            required
                        />

                        <label htmlFor="selectedteacherlastname">
                            Last name
                        </label>

                        <input
                            type="text"
                            id="selectedteacherlastname"
                            value={lastName}
                            maxLength={limits.lastname}
                            onChange={(event) => setLastName(event.target.value)}
                            required
                        />

                        <label htmlFor="selectedteacheremail">
                            Email
                        </label>

                        <input
                            type="text"
                            id="selectedteacheremail"
                            className="teachersectionidentity"
                            value={teacher.username || "No login email"}
                            readOnly
                        />

                        <fieldset className="teachersectionlist">
                            <legend>Sections</legend>

                            <div className="teachersectionscroll">
                                {eligibleSections.length === 0 && (
                                    <p className="teachersectionempty">
                                        No sections are available.
                                    </p>
                                )}

                                {eligibleSections.map((section) => (
                                    <label
                                        className="teachersectionoption"
                                        key={section.sectionID}
                                        htmlFor={`teachersection${section.sectionID}`}
                                    >
                                        <input
                                            type="checkbox"
                                            id={`teachersection${section.sectionID}`}
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

export default TeacherSectionPopup;
