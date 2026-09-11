import "../../css/Students.css";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateTeacher, DeleteTeachers, GetTeachers, teachersQueryKey } from "../../lib/teacherQueries";
import { superAdminDashboardQueryKey } from "../../lib/dashboardQueries";
import SuperAdminPage from "./SuperAdminPage";
import TeacherCard from "./TeacherCard";
import TeacherPopup from "./TeacherPopup";

const maxCards = 12;

function SuperAdminTeachers() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedTeacherIDs, setSelectedTeacherIDs] = useState([]);
    const [popupOpen, setPopupOpen] = useState(false);
    const [actionError, setActionError] = useState("");

    const teachersQuery = useQuery({
        queryKey: teachersQueryKey,
        queryFn: GetTeachers,
        staleTime: 5 * 60 * 1000,
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
        const sections = (teacher.sections ?? [])
            .map((section) => section.sectionName)
            .join(" ");
        const searchable = [
            teacher.firstName,
            teacher.lastName,
            `${teacher.firstName} ${teacher.lastName}`,
            `${teacher.lastName} ${teacher.firstName}`,
            teacher.username,
            sections,
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
        ]);
    }

    function OpenPopup() {
        setActionError("");
        setPopupOpen(true);
    }

    function ClosePopup() {
        setPopupOpen(false);
    }

    async function HandleSaveTeacher(teacherData) {
        await CreateTeacher(teacherData);

        await RefreshTeachers();
        setSelectedTeacherIDs([]);
        ClosePopup();

        alert("Teacher invitation sent successfully. The teacher must check their email to create a password.");
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
        if (selectedTeacherIDs.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Delete the selected teachers? Their sections will become unassigned."
        );

        if (!confirmed) {
            return;
        }

        setActionError("");

        try {
            const data = await DeleteTeachers(selectedTeacherIDs);
            const deleted = data.deleted?.length ?? 0;
            const failed = data.failed?.length ?? 0;

            setSelectedTeacherIDs([]);
            await RefreshTeachers();

            if (failed > 0) {
                setActionError(
                    `${failed} teacher account(s) could not be completely deleted.`
                );
            }

            alert(`${deleted} teacher(s) deleted.`);
        } catch (deleteError) {
            setActionError(
                deleteError.message || "Unable to delete teachers."
            );
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
                                id="addmobile"
                                onClick={OpenPopup}
                                disabled={loading}
                            >
                                Add Teacher
                            </button>

                            <button
                                type="button"
                                id="remove"
                                onClick={HandleDeleteTeachers}
                                disabled={selectedTeacherIDs.length === 0}
                            >
                                Remove Selected
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

                <div className="add">
                    <button
                        type="button"
                        onClick={OpenPopup}
                        disabled={loading}
                        aria-label="Add teacher"
                    >
                        +
                    </button>
                </div>
            </section>

            {popupOpen && (
                <TeacherPopup
                    sections={availableSections}
                    onClose={ClosePopup}
                    onSave={HandleSaveTeacher}
                />
            )}
        </SuperAdminPage>
    );
}

export default SuperAdminTeachers;
