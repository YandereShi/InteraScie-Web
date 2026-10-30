import "../../css/Students.css";
import StudentCard from "./StudentCard";
import StudentPopup from "./StudentPopup";
import BatchStudentPopup from "./BatchStudentPopup";
import TeacherPage from "./TeacherPage";
import { useContext, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetNameError, GetUsernameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";
import { InvokeStudentManagement } from "../../lib/supabase";
import { GetStudents, studentQueryKey } from "../../lib/studentQueries";
import { InvalidateStudentQueries } from "../../lib/studentCache";
import { PopupContext } from "../../lib/PopupContext";
import { GetProfilePhotoQueryKey, GetStudentPhotoPath, SaveProfilePhoto } from "../../lib/profilePhotos";
import { useActionPending } from "../../lib/useActionPending";
import ArchivedAccountsPopup from "../ArchivedAccountsPopup";
import { archivedStudentsQueryKey, GetArchivedStudents, SetAccountsArchived } from "../../lib/archiveQueries";

const maxCards = 12;

function Students({ PageComponent = TeacherPage }) {
  const queryClient = useQueryClient();
  const { ShowConfirmation } = useContext(PopupContext);
  const [actionError, setActionError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isBatchPopupOpen, setIsBatchPopupOpen] = useState(false);
  const [batchSectionID, setBatchSectionID] = useState("");
  const [selectedStudentIDs, setSelectedStudentIDs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const deletePending = useRef(false);
  useActionPending(deleting || archiving);

  const studentsQuery = useQuery({
    queryKey: studentQueryKey,
    queryFn: GetStudents,
    staleTime: 5 * 60 * 1000,
  });

  const students = studentsQuery.data?.students ?? [];
  const archivedQuery = useQuery({
    queryKey: archivedStudentsQueryKey,
    queryFn: GetArchivedStudents,
    enabled: archiveOpen,
    staleTime: 2 * 60 * 1000,
  });
  const sections = studentsQuery.data?.sections ?? [];
  const loadingStudents = studentsQuery.isPending;
  const queryError =
    studentsQuery.error instanceof Error
      ? studentsQuery.error.message
      : studentsQuery.error
        ? "Unable to load students."
        : "";
  const studentError = actionError || queryError;

  async function RefreshStudents() {
    setActionError("");

    await InvalidateStudentQueries(queryClient);
  }

  function OpenAddPopup() {
    setSelectedStudent(null);
    setIsPopupOpen(true);
  }

  function OpenEditPopup(student) {
    setSelectedStudent(student);
    setIsPopupOpen(true);
  }

  function ClosePopup() {
    setSelectedStudent(null);
    setIsPopupOpen(false);
  }

  function OpenBatchPopup(sectionID) {
    ClosePopup();
    setBatchSectionID(sectionID);
    setIsBatchPopupOpen(true);
  }

  function CloseBatchPopup() {
    setIsBatchPopupOpen(false);
  }

  async function HandleBatchUpload(batchData) {
    for (const student of batchData.students) {
      const nameerror = GetNameError(student.firstName, student.lastName);

      if (nameerror) {
        throw new Error(nameerror);
      }
    }

    const batchResult = await InvokeStudentManagement("batchcreate", {
      sectionID: batchData.sectionID,
      students: batchData.students,
    });

    await RefreshStudents();
    setSelectedStudentIDs([]);
    if (!batchResult.failed?.length) CloseBatchPopup();

    return batchResult;
  }

  async function HandleSaveStudent(studentData) {
    const fresh = await queryClient.fetchQuery({ queryKey: studentQueryKey, queryFn: GetStudents, staleTime: 0 });
    const nameerror = GetNameError(studentData.firstName, studentData.lastName, fresh.students, selectedStudent?.studentID ?? null);

    if (nameerror) {
      throw new Error(nameerror);
    }

    const usernameError = GetUsernameError(studentData.username, fresh.students, selectedStudent?.studentID ?? null);
    if (usernameError) throw new Error(usernameError);

    const payload = {
      firstName: studentData.firstName.trim(),
      lastName: studentData.lastName.trim(),
      username: studentData.username.trim().toLowerCase(),
      sectionID: studentData.sectionID,
    };

    const result = await InvokeStudentManagement(
      selectedStudent ? "update" : "create",
      selectedStudent
        ? { ...payload, studentID: selectedStudent.studentID }
        : payload
    );

    if (studentData.photo) {
      const path = GetStudentPhotoPath(selectedStudent?.studentID ?? result.studentID);

      try {
        await SaveProfilePhoto(path, studentData.photo.file);
        await queryClient.invalidateQueries({ queryKey: GetProfilePhotoQueryKey(path), exact: true });
      } catch (error) {
        await RefreshStudents();
        throw new Error(`Student details were saved, but the photo could not be saved. ${error.message}`, { cause: error });
      }
    }

    await RefreshStudents();
    setSelectedStudentIDs([]);
    ClosePopup();
  }

  async function ResetPassword(student) {
    const confirmed = await ShowConfirmation(
      `Reset ${student.firstName} ${student.lastName}'s password?`
    );

    if (!confirmed) {
      return;
    }

    const data = await InvokeStudentManagement("reset", {
      studentID: student.studentID,
    });

    await ShowConfirmation(
      `Password reset successfully.\nTemporary password: ${data.temporaryPassword}`
    );
  }

  function HandleStudentSelection(studentID, isChecked) {
    if (isChecked) {
      setSelectedStudentIDs((currentIDs) =>
        currentIDs.includes(studentID)
          ? currentIDs
          : [...currentIDs, studentID]
      );
      return;
    }

    setSelectedStudentIDs((currentIDs) =>
      currentIDs.filter((currentID) => currentID !== studentID)
    );
  }

  function HandleSelectAll(event) {
    if (event.target.checked) {
      setSelectedStudentIDs(
        filteredStudents.map((student) => student.studentID)
      );
      return;
    }

    setSelectedStudentIDs([]);
  }

  async function HandleRemoveSelected() {
    if (deletePending.current) return;

    if (selectedStudentIDs.length === 0) {
      await ShowConfirmation("Please select at least one student.");
      return;
    }

    const studentIDs = [...selectedStudentIDs];
    const selectedNames = students
      .filter((student) => studentIDs.includes(student.studentID))
      .map((student) => `${student.lastName}, ${student.firstName}`);

    deletePending.current = true;
    setDeleting(true);

    try {
      const confirmed = await ShowConfirmation(
        "Are you sure you want to delete the selected students?",
        true,
        selectedNames
      );

      if (!confirmed) return;

      const data = await InvokeStudentManagement("delete", {
        studentIDs,
      });
      const deleted = data.deleted?.length ?? 0;
      const failed = data.failed?.length ?? 0;

      setSelectedStudentIDs([]);
      await RefreshStudents();

      if (failed > 0) {
        setActionError(
          `${failed} student Auth account(s) could not be removed.`
        );
      }

      await ShowConfirmation(`${deleted} student(s) deleted.`);
    } catch (error) {
      console.error(error.message);
      await ShowConfirmation(error.message);
    } finally {
      deletePending.current = false;
      setDeleting(false);
    }
  }

  async function ArchiveSelectedStudents() {
    if (deletePending.current || selectedStudentIDs.length === 0) return;
    const studentIDs = [...selectedStudentIDs];
    const names = students.filter((student) => studentIDs.includes(student.studentID)).map((student) => `${student.lastName}, ${student.firstName}`);
    deletePending.current = true;
    setArchiving(true);
    try {
      const confirmed = await ShowConfirmation("Archive the selected students? Their access will be disabled and their saved data will be preserved.", false, names);
      if (!confirmed) return;
      const result = await SetAccountsArchived("students", studentIDs, true);
      setSelectedStudentIDs([]);
      await RefreshStudents();
      await ShowConfirmation(`${result.accounts} student(s) archived.`);
    } catch (archiveError) {
      await ShowConfirmation(archiveError.message || "Unable to archive the students.");
    } finally {
      deletePending.current = false;
      setArchiving(false);
    }
  }

  const searchterm = search.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    const searchable = [
      student.firstName,
      student.lastName,
      `${student.firstName} ${student.lastName}`,
      `${student.lastName} ${student.firstName}`,
    ];

    return searchable.some((value) =>
      String(value ?? "").toLowerCase().includes(searchterm)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / maxCards)
  );
  const activePage = Math.min(currentPage, totalPages);
  if (studentsQuery.isSuccess && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  const firstStudentIndex = (activePage - 1) * maxCards;
  const currentStudents = filteredStudents.slice(
    firstStudentIndex,
    firstStudentIndex + maxCards
  );
  const allChecked =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedStudentIDs.includes(student.studentID)
    );

  return (
    <PageComponent title="Students">
      <section className="studentspanel">
        <div className="studentbox">
          <div className="tools">
            <div className="studentsearchtools">
              <div className="searchbar">
                <input
                  type="text"
                  placeholder="Search students..."
                  maxLength={limits.search}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <button type="button" className="studentarchivebutton" aria-label="View archived students" aria-haspopup="dialog" disabled={deleting || archiving} onClick={() => setArchiveOpen(true)}>Archived</button>
            </div>

            <div className="buttons">
              <button
                type="button"
                className="studentadd"
                onClick={OpenAddPopup}
                disabled={deleting || archiving || loadingStudents || sections.length === 0}
              >
                Add Student
              </button>

              <button type="button" className="studentadd" disabled={deleting || archiving || selectedStudentIDs.length === 0} onClick={ArchiveSelectedStudents}>
                {archiving ? "Archiving..." : "Archive Selected"}
              </button>

              <button
                type="button"
                id="remove"
                onClick={HandleRemoveSelected}
                disabled={deleting || archiving || selectedStudentIDs.length === 0}
              >
                {deleting ? "Deleting..." : "Remove Selected"}
              </button>
            </div>
          </div>

          <div className="studentselectrow">
            <div className="check">
              <label htmlFor="selectall">Select All</label>

              <input
                type="checkbox"
                id="selectall"
                checked={allChecked}
                disabled={filteredStudents.length === 0}
                onChange={HandleSelectAll}
              />
            </div>
          </div>

          <div className="studentcontainer">
            {loadingStudents && <p>Loading students...</p>}
            {studentError && <p>{studentError}</p>}

            {!loadingStudents &&
              !studentError &&
              currentStudents.length === 0 && <p>No students found.</p>}

            {!loadingStudents &&
              !studentError &&
              currentStudents.map((student) => (
                <StudentCard
                  key={student.studentID}
                  student={student}
                  onEdit={OpenEditPopup}
                  isSelected={selectedStudentIDs.includes(student.studentID)}
                  onSelect={HandleStudentSelection}
                />
              ))}
          </div>

          <div className="studentcontrols studentspagination">
            <div className="pagination">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => setCurrentPage((page) => page - 1)}
                disabled={activePage === 1}
              >
                &lt;
              </button>

              <span>
                {activePage} of {totalPages}
              </span>

              <button
                type="button"
                aria-label="Next page"
                onClick={() => setCurrentPage((page) => page + 1)}
                disabled={activePage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </section>

      {isPopupOpen && (
        <StudentPopup
          student={selectedStudent}
          sections={sections}
          onClose={ClosePopup}
          onSave={HandleSaveStudent}
          onReset={ResetPassword}
          onOpenBatch={OpenBatchPopup}
        />
      )}

      {isBatchPopupOpen && (
        <BatchStudentPopup
          Sections={sections}
          initialSectionID={batchSectionID}
          students={students}
          OnClose={CloseBatchPopup}
          OnUpload={HandleBatchUpload}
        />
      )}
      {archiveOpen && (
        <ArchivedAccountsPopup
          kind="students"
          records={archivedQuery.data?.students ?? []}
          sections={archivedQuery.data?.sections ?? []}
          loading={archivedQuery.isPending}
          error={archivedQuery.error}
          onClose={() => setArchiveOpen(false)}
        />
      )}
    </PageComponent>
  );
}

export default Students;
