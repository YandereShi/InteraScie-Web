import "../css/Students.css";
import StudentCard from "./StudentCard";
import TeacherPage from "./TeacherPage";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Students() {
const [students, setStudents] = useState([]);
const [loadingStudents, setLoadingStudents] = useState(true);
const [studentError, setStudentError] = useState("");

useEffect(() => {
  async function loadStudents() {
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

    const formattedStudents = data.map((student) => ({
      studentID: student.studentID,
      firstName: student.firstName,
      lastName: student.lastName,
      username: student.username,
      section: student.Section?.sectionName ?? "No section",
    }));

    setStudents(formattedStudents);
    setLoadingStudents(false);
  }

  loadStudents();
}, []);

  return (
    <TeacherPage title="Students">
      <section className="studentspanel">
        <div className="studentbox">
          <div className="tools">
            <div className="searchbar">
              <input type="text" placeholder="Search students..." />
            </div>
            <div className="buttons">
              <button type="button" id="batch">Batch Upload</button>
              <button type="button" id="remove">Remove Selected</button>
            </div>
          </div>

          <div className="studentcontainer">
            {loadingStudents && <p>Loading students...</p>}

            {studentError && <p>{studentError}</p>}

            {!loadingStudents &&
              !studentError &&
              students.map((student) => (
                <StudentCard
                  key={student.studentID}
                  student={student}
                />
              ))}
          </div>

          <div className="check">
            <input
              type="checkbox"
              id="select-all"
            />

            <label htmlFor="select-all">
              Select All
            </label>
          </div>
        </div>

        <div className="add">
          <button type="button">+</button>
        </div>
      </section>
    </TeacherPage>
  );
}

export default Students;
