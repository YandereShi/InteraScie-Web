import "../../css/Students.css";
import { useContext, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateTeacher, DeleteTeachers, GetTeachers, UpdateTeacher, teachersQueryKey } from "../../lib/teacherQueries";
import { superAdminDashboardQueryKey } from "../../lib/dashboardQueries";
import SuperAdminPage from "./SuperAdminPage";
import TeacherCard from "./TeacherCard";
import TeacherPopup from "./TeacherPopup";
import TeacherSectionPopup from "./TeacherSectionPopup";
import { PopupContext } from "../../lib/PopupContext";
import { limits } from "../../lib/inputLimits";
import { GetNameError } from "../../lib/nameValidation";
import { useActionPending } from "../../lib/useActionPending";

const maxCards = 12;

function SuperAdminTeachers() {
    const queryClient = useQueryClient();
    const { ShowConfirmation } = useContext(PopupContext);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedTeacherIDs, setSelectedTeacherIDs] = useState([]);
    const [popupOpen, setPopupOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [actionError, setActionError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const deletePending = useRef(false);
    useActionPending(deleting);

    const teachersQuery = useQuery({
        queryKey: teachersQueryKey,
        queryFn: GetTeachers,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: "always",
    });

    const teachers = teachersQuery.data?.teachers ?? [];
    const availableSections = teachersQuery.data?.availableSections ?? [];
    const loading = teachersQuery.isPending;
    const queryError = teachersQuery.error instanceof Error
        ? teachersQuery.error.message
        : teachersQuery.error
            ? "Unable to load teachers."
            : "";
    const error = actionError || queryError;
    const searchterm = search.trim().toLowerCase();
    const filteredTeachers = teachers.filter((teacher) => {
        const searchable = [
            teacher.firstName,
            teacher.lastName,
            `${teacher.firstName} ${teacher.lastName}`,
            `${teacher.lastName} ${teacher.firstName}`,
        ];

        return searchable.some((value) =>
            String(value ?? "").toLowerCase().includes(searchterm)
        );
    });
    const pages = Math.max(
        1,
        Math.ceil(filteredTeachers.length / maxCards)
    );
    const activePage = Math.min(page, pages);
    if (teachersQuery.isSuccess && page > pages) {
        setPage(pages);
    }
    const first = (activePage - 1) * maxCards;
    const shown = filteredTeachers.slice(
        first,
        first + maxCards
    );
    const allChecked =
        filteredTeachers.length > 0 &&
        filteredTeachers.every((teacher) =>
            selectedTeacherIDs.includes(teacher.staffID)
        );

    async function RefreshTeachers() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: teachersQueryKey,
                exact: true,
            }),
            queryClient.invalidateQueries({
                queryKey: superAdminDashboardQueryKey,
                exact: true,
            }),
            queryClient.invalidateQueries({
                queryKey: ["Sections"],
            }),
            queryClient.invalidateQueries({
                queryKey: ["ProgressOptions"],
            }),
            queryClient.invalidateQueries({
                queryKey: ["AssessmentOptions"],
            }),
        ]);
    }

    function OpenPopup() {
        setActionError("");
        setPopupOpen(true);
    }

    function ClosePopup() {
        setPopupOpen(false);
    }

    function OpenSectionPopup(teacher) {
        setActionError("");
        setSelectedTeacher(teacher);
        if (teacher.emailPending === true) void teachersQuery.refetch();
    }

    function CloseSectionPopup() {
        setSelectedTeacher(null);
    }

    async function HandleSaveTeacher(teacherData) {
        const fresh = await queryClient.fetchQuery({ queryKey: teachersQueryKey, queryFn: GetTeachers, staleTime: 0 });
        const nameError = GetNameError(teacherData.firstName, teacherData.lastName, fresh.teachers);
        if (nameError) throw new Error(nameError);
        await CreateTeacher(teacherData);

        await RefreshTeachers();
        setSelectedTeacherIDs([]);
        ClosePopup();

        await ShowConfirmation("Teacher invitation sent successfully. The teacher must check their email to create a password.");
    }

    async function HandleUpdateTeacher({ firstName, lastName, sectionIDs }) {
        if (!selectedTeacher) {
            return;
        }

        const fresh = await queryClient.fetchQuery({ queryKey: teachersQueryKey, queryFn: GetTeachers, staleTime: 0 });
        const nameError = GetNameError(firstName, lastName, fresh.teachers, selectedTeacher.staffID);
        if (nameError) throw new Error(nameError);

        await UpdateTeacher(
            selectedTeacher.staffID,
            firstName,
            lastName,
            sectionIDs
        );

        await RefreshTeachers();
        setSelectedTeacherIDs([]);
        CloseSectionPopup();

        await ShowConfirmation("Teacher updated successfully.");
    }

    function HandleTeacherSelection(staffID, isChecked) {
        if (isChecked) {
            setSelectedTeacherIDs((current) =>
                current.includes(staffID)
                    ? current
                    : [...current, staffID]
            );
            return;
        }

        setSelectedTeacherIDs((current) =>
            current.filter((item) => item !== staffID)
        );
    }

    function HandleSelectAll(event) {
        if (event.target.checked) {
            setSelectedTeacherIDs(
                filteredTeachers.map((teacher) => teacher.staffID)
            );
            return;
        }

        setSelectedTeacherIDs([]);
    }

    async function HandleDeleteTeachers() {
        if (deletePending.current || selectedTeacherIDs.length === 0) {
            return;
        }

        const staffIDs = [...selectedTeacherIDs];
        deletePending.current = true;
        setDeleting(true);

        try {
            const confirmed = await ShowConfirmation(
                "Delete the selected teachers? Their sections will become unassigned.",
                true
            );

            if (!confirmed) return;

            setActionError("");
            const data = await DeleteTeachers(staffIDs);
            const deleted = data.deleted?.length ?? 0;
            const failed = data.failed?.length ?? 0;

            setSelectedTeacherIDs([]);
            await RefreshTeachers();

            if (failed > 0) {
                setActionError(
                    `${failed} teacher account(s) could not be completely deleted.`
                );
            }

            await ShowConfirmation(`${deleted} teacher(s) deleted.`);
        } catch (deleteError) {
            setActionError(
                deleteError.message || "Unable to delete teachers."
            );
        } finally {
            deletePending.current = false;
            setDeleting(false);
        }
    }

    return (
        <SuperAdminPage title="Teachers">
            <section className="studentspanel">
                <div className="studentbox">
                    <div className="tools">
                        <div className="searchbar">
                            <input
                                type="text"
                                placeholder="Search teachers..."
                                maxLength={limits.search}
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="buttons">
                            <button
                                type="button"
                                className="studentadd"
                                onClick={OpenPopup}
                                disabled={deleting || loading}
                            >
                                Add Teacher
                            </button>

                            <button
                                type="button"
                                id="remove"
                                onClick={HandleDeleteTeachers}
                                disabled={deleting || selectedTeacherIDs.length === 0}
                            >
                                {deleting ? "Deleting..." : "Remove Selected"}
                            </button>
                        </div>
                    </div>

                    <div className="studentcontainer">
                        {loading && <p>Loading teachers...</p>}
                        {!loading && error && <p>{error}</p>}

                        {!loading && !error && shown.length === 0 && (
                            <p>No teachers found.</p>
                        )}

                        {!loading && !error && shown.map((teacher) => (
                            <TeacherCard
                                key={teacher.staffID}
                                teacher={teacher}
                                isSelected={selectedTeacherIDs.includes(
                                    teacher.staffID
                                )}
                                onSelect={HandleTeacherSelection}
                                onEdit={OpenSectionPopup}
                            />
                        ))}
                    </div>

                    <div className="studentcontrols">
                        <div className="check">
                            <input
                                type="checkbox"
                                id="selectallteachers"
                                checked={allChecked}
                                disabled={filteredTeachers.length === 0}
                                onChange={HandleSelectAll}
                            />

                            <label htmlFor="selectallteachers">
                                Select All
                            </label>
                        </div>

                        <div className="pagination">
                            <button
                                type="button"
                                aria-label="Previous page"
                                disabled={activePage === 1}
                                onClick={() =>
                                    setPage((current) => current - 1)
                                }
                            >
                                &lt;
                            </button>

                            <span>
                                {activePage} of {pages}
                            </span>

                            <button
                                type="button"
                                aria-label="Next page"
                                disabled={activePage === pages}
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {popupOpen && (
                <TeacherPopup
                    sections={availableSections}
                    onClose={ClosePopup}
                    onSave={HandleSaveTeacher}
                />
            )}

            {selectedTeacher && (
                <TeacherSectionPopup
                    teacher={teachers.find((teacher) => teacher.staffID === selectedTeacher.staffID) ?? selectedTeacher}
                    sections={availableSections}
                    onClose={CloseSectionPopup}
                    onSave={HandleUpdateTeacher}
                />
            )}
        </SuperAdminPage>
    );
}

export default SuperAdminTeachers;
