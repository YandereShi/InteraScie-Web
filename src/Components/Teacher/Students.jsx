import "../../css/Students.css";
import StudentCard from "./StudentCard";
import StudentPopup from "./StudentPopup";
import BatchStudentPopup from "./BatchStudentPopup";
import TeacherPage from "./TeacherPage";
import { useCallback, useEffect, useState } from "react";
import { GetNameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";
import { InvokeStudentManagement } from "../../lib/supabase";

const maxCards = 12;

function Students({ PageComponent = TeacherPage }) {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentError, setStudentError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isBatchPopupOpen, setIsBatchPopupOpen] = useState(false);
  const [selectedStudentIDs, setSelectedStudentIDs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const LoadStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentError("");

    try {
      const data = await InvokeStudentManagement("loadstudents");
      setStudents(data.students ?? []);
      setSections(data.sections ?? []);
      setSelectedStudentIDs([]);
    } catch (error) {
      console.error(error.message);
      setStudentError(error.message || "Unable to load students.");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      LoadStudents();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [LoadStudents]);

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

  function OpenBatchPopup() {
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

    await LoadStudents();
    CloseBatchPopup();

    return batchResult;
  }

  async function HandleSaveStudent(studentData) {
    const nameerror = GetNameError(studentData.firstName, studentData.lastName);

    if (nameerror) {
      throw new Error(nameerror);
    }

    if (
      studentData.username.length > limits.username ||
      studentData.username.trim().toLowerCase().length > limits.username
    ) {
      throw new Error(`Username must be ${limits.username} characters or fewer.`);
    }

    const payload = {
      firstName: studentData.firstName.trim(),
      lastName: studentData.lastName.trim(),
      username: studentData.username.trim().toLowerCase(),
      sectionID: studentData.sectionID,
    };

    await InvokeStudentManagement(
      selectedStudent ? "update" : "create",
      selectedStudent
        ? { ...payload, studentID: selectedStudent.studentID }
        : payload
    );

    await LoadStudents();
    ClosePopup();
  }

  async function ResetPassword(student) {
    const confirmed = window.confirm(
      `Reset ${student.firstName} ${student.lastName}'s password?`
    );

    if (!confirmed) {
      return;
    }

    const data = await InvokeStudentManagement("reset", {
      studentID: student.studentID,
    });

    alert(
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
        students.map((student) => student.studentID)
      );
      return;
    }

    setSelectedStudentIDs([]);
  }

  async function HandleRemoveSelected() {
    if (selectedStudentIDs.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete the selected students?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const data = await InvokeStudentManagement("delete", {
        studentIDs: selectedStudentIDs,
      });
      const deleted = data.deleted?.length ?? 0;
      const failed = data.failed?.length ?? 0;

      setSelectedStudentIDs([]);
      await LoadStudents();

      if (failed > 0) {
        setStudentError(
          `${failed} student Auth account(s) could not be removed.`
        );
      }

      alert(`${deleted} student(s) deleted.`);
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
  }

  const searchterm = search.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    const searchable = [
      student.firstName,
      student.lastName,
      `${student.firstName} ${student.lastName}`,
      `${student.lastName} ${student.firstName}`,
      student.username,
      student.section,
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
  const firstStudentIndex = (activePage - 1) * maxCards;
  const currentStudents = filteredStudents.slice(
    firstStudentIndex,
    firstStudentIndex + maxCards
  );
  const allChecked =
    students.length > 0 &&
    students.every((student) =>
      selectedStudentIDs.includes(student.studentID)
    );

  return (
    <PageComponent title="Students">
      <section className="studentspanel">
        <div className="studentbox">
          <div className="tools">
            <div className="searchbar">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="buttons">
              <button
                type="button"
                id="batch"
                onClick={OpenBatchPopup}
                disabled={loadingStudents || sections.length === 0}
              >
                Batch Upload
              </button>

              <button
                type="button"
                id="addmobile"
                onClick={OpenAddPopup}
                disabled={loadingStudents || sections.length === 0}
              >
                Add Student
              </button>

              <button
                type="button"
                id="remove"
                onClick={HandleRemoveSelected}
                disabled={selectedStudentIDs.length === 0}
              >
                Remove Selected
              </button>
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

          <div className="studentcontrols">
            <div className="check">
              <input
                type="checkbox"
                id="selectall"
                checked={allChecked}
                onChange={HandleSelectAll}
              />

              <label htmlFor="selectall">Select All</label>
            </div>

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

        <div className="add">
          <button
            type="button"
            onClick={OpenAddPopup}
            disabled={loadingStudents || sections.length === 0}
          >
            +
          </button>
        </div>
      </section>

      {isPopupOpen && (
        <StudentPopup
          student={selectedStudent}
          sections={sections}
          onClose={ClosePopup}
          onSave={HandleSaveStudent}
          onReset={ResetPassword}
        />
      )}

      {isBatchPopupOpen && (
        <BatchStudentPopup
          Sections={sections}
          students={students}
          OnClose={CloseBatchPopup}
          OnUpload={HandleBatchUpload}
        />
      )}
    </PageComponent>
  );
}

export default Students;
