import "../../css/StudentPopup.css";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import teacherImage from "../../assets/pfp.png";
import ProfilePhoto from "../ProfilePhoto";
import { GetStaffPhotoPath } from "../../lib/profilePhotos";
import { GetNameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";
import { ResendTeacherInvitation, teachersQueryKey } from "../../lib/teacherQueries";
import { useActionPending } from "../../lib/useActionPending";

function TeacherSectionPopup({ teacher, sections, onClose, onSave }) {
    const queryClient = useQueryClient();
    const resendPending = useRef(false);
    const [firstName, setFirstName] = useState(teacher.firstName ?? "");
    const [lastName, setLastName] = useState(teacher.lastName ?? "");
    const [sectionIDs, setSectionIDs] = useState(
        (teacher.sections ?? []).map((section) => section.sectionID)
    );
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendMessage, setResendMessage] = useState("");
    const [resendError, setResendError] = useState("");
    useActionPending(resending);
    const sectionMap = new Map();

    for (const section of [...(teacher.sections ?? []), ...sections]) {
        sectionMap.set(section.sectionID, section);
    }

    const eligibleSections = [...sectionMap.values()].sort((first, second) =>
        String(first.sectionName ?? "").localeCompare(
            String(second.sectionName ?? "")
        )
    );

    useEffect(() => {
        if (resendCooldown <= 0 || teacher.emailPending !== true) return;
        const timer = window.setTimeout(() => setResendCooldown((current) => Math.max(0, current - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [resendCooldown, teacher.emailPending]);

    async function HandleResend() {
        if (saving || resendPending.current || resendCooldown > 0 || teacher.emailPending !== true) return;
        resendPending.current = true;
        setResending(true);
        setResendMessage("");
        setResendError("");

        try {
            const result = await ResendTeacherInvitation(teacher.staffID);
            setResendMessage(result.message || "Invitation email resent successfully.");
            setResendCooldown(result.cooldownSeconds || 60);
        } catch (error) {
            setResendError(error.message || "Unable to resend the invitation email.");
        } finally {
            resendPending.current = false;
            setResending(false);
            void queryClient.invalidateQueries({ queryKey: teachersQueryKey, exact: true });
        }
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
        if (saving || resendPending.current) return;
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
            onMouseDown={saving || resending ? undefined : onClose}
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
                        disabled={saving || resending}
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
                        {teacher.emailPending === true && (
                            <button type="button" className="teacherresendbutton" onClick={HandleResend} disabled={saving || resending || resendCooldown > 0}>
                                {resending ? "Sending..." : resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : "Resend Email"}
                            </button>
                        )}
                        {resendMessage && <p className="teacherresendstatus" role="status">{resendMessage}</p>}
                        {resendError && <p className="teacherresenderror" role="alert">{resendError}</p>}

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
                            disabled={saving || resending}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="savestudent"
                            disabled={saving || resending}
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
