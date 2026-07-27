import "../css/Students.css";
import StudentCard from "./StudentCard";
import StudentPopup from "./StudentPopup";
import TeacherPage from "./TeacherPage";
import {useCallback,useEffect,useState,} from "react";
import { supabase } from "../lib/supabase";

const maxCards = 12;

function Students() {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);

  const [loadingStudents, setLoadingStudents] =useState(true);

  const [studentError, setStudentError] =useState("");

  const [selectedStudent, setSelectedStudent] =useState(null);

  const [isPopupOpen, setIsPopupOpen] =useState(false);

  const [selectedStudentIDs, setSelectedStudentIDs,] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentError("");

    const { data, error } = await supabase
      .from("Student")
      .select(`
        studentID,
        firstName,
        lastName,
        username,
        sectionID,
        Section (
          sectionName
        )
      `)
      .order("lastName", { ascending: true });

    if (error) {
      console.error(error.message);
      setStudentError("Unable to load students.");
      setLoadingStudents(false);
      return;
    }

    const formattedStudents = data.map(
      (student) => ({
        studentID: student.studentID,
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        sectionID: student.sectionID,
        section:
          student.Section?.sectionName ??
          "No section",
      })
    );

    setStudents(formattedStudents);
    setLoadingStudents(false);
  }, []);

  const loadSections = useCallback(async () => {
    const { data, error } = await supabase
      .from("Section")
      .select("sectionID, sectionName")
      .order("sectionName", { ascending: true });

    if (error) {
      console.error(error.message);
      setStudentError("Unable to load sections.");
      return;
    }

    setSections(data);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadStudents();
      loadSections();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadStudents, loadSections]);

  function openAddPopup() {
    setSelectedStudent(null);
    setIsPopupOpen(true);
  }

  function openEditPopup(student) {
    setSelectedStudent(student);
    setIsPopupOpen(true);
  }

  function closePopup() {
    setSelectedStudent(null);
    setIsPopupOpen(false);
  }

  async function handleSaveStudent(studentData) {
    const payload = {
      firstName: studentData.firstName.trim(),
      lastName: studentData.lastName.trim(),
      username: studentData.username.trim(),
      sectionID: studentData.sectionID,
    };

    let saveResult;

    if (selectedStudent) {
      saveResult = await supabase
        .from("Student")
        .update(payload)
        .eq(
          "studentID",
          selectedStudent.studentID
        )
        .select("studentID")
        .single();
    } else {
      saveResult = await supabase
        .from("Student")
        .insert(payload)
        .select("studentID")
        .single();
    }

    if (saveResult.error) {
      throw saveResult.error;
    }

    await loadStudents();
    closePopup();
  }

  function handleStudentSelection(studentID, isChecked) {
    if (isChecked) {
      setSelectedStudentIDs((currentIDs) =>
        currentIDs.includes(studentID)
          ? currentIDs
          : [...currentIDs, studentID]
      );
      return;
    }

    setSelectedStudentIDs((currentIDs) =>
      currentIDs.filter(
        (currentID) => currentID !== studentID
      )
    );
  }

  function handleSelectAll(event) {
    if (event.target.checked) {
      setSelectedStudentIDs(
        students.map((student) => student.studentID)
      );
      return;
    }

    setSelectedStudentIDs([]);
  }

  async function handleRemoveSelected() {
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

    const { data: deletedStudents, error } =
      await supabase
        .from("Student")
        .delete()
        .in("studentID", selectedStudentIDs)
        .select("studentID");

    if (error) {
      console.error(error.message);
      alert("Unable to delete the selected students.");
      return;
    }

    setSelectedStudentIDs([]);
    await loadStudents();
    alert(`${deletedStudents.length} student(s) deleted.`);
  }

  const Sinearch = search.trim().toLowerCase();

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
      String(value ?? "")
        .toLowerCase()
        .includes(Sinearch)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / maxCards)
  );

  const firstStudentIndex = (currentPage - 1) * maxCards;

  const lastStudentIndex = firstStudentIndex + maxCards;

  const currentStudents = filteredStudents.slice(
    firstStudentIndex,
    lastStudentIndex
  );

  return (
    <TeacherPage title="Students">
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
              <button type="button" id="batch">
                Batch Upload
              </button>

              <button
                type="button"
                id="remove"
                onClick={handleRemoveSelected}
                disabled={selectedStudentIDs.length === 0}
              >
                Remove Selected
              </button>
            </div>
          </div>

          <div className="studentcontainer">
            {loadingStudents && (
              <p>Loading students...</p>
            )}

            {studentError && (
              <p>{studentError}</p>
            )}

            {!loadingStudents &&
              !studentError &&
              currentStudents.length === 0 && (
                <p>No students found.</p>
              )}

            {!loadingStudents &&
              !studentError &&
              currentStudents.map((student) => (
                <StudentCard
                  key={student.studentID}
                  student={student}
                  onEdit={openEditPopup}
                  isSelected={selectedStudentIDs.includes(
                    student.studentID
                  )}
                  onSelect={handleStudentSelection}
                />
              ))}
          </div>
          
          <div className="studentcontrols">
            <div className="check">
              <input
                type="checkbox"
                id="select-all"
                checked={
                  students.length > 0 &&
                  selectedStudentIDs.length === students.length
                }
                onChange={handleSelectAll}
              />

              <label htmlFor="select-all">
                Select All
              </label>
            </div>

            <div className="pagination">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
                disabled={currentPage === 1}
              >
                &lt;
              </button>

              <span>
                {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                aria-label="Next page"
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        <div className="add">
          <button
            type="button"
            onClick={openAddPopup}
          >
            +
          </button>
        </div>
      </section>

      {isPopupOpen && (
        <StudentPopup
          student={selectedStudent}
          sections={sections}
          onClose={closePopup}
          onSave={handleSaveStudent}
        />
      )}
    </TeacherPage>
  );
}

export default Students;
