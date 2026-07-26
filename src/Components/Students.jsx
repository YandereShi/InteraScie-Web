import "../css/Students.css";
import StudentCard from "./StudentCard";
import TeacherPage from "./TeacherPage";

function Students() {
  const students = [
    {
      studentID: 1,
      firstName: "Juan",
      lastName: "Dela Cruz",
      section: "Section A",
    },
    {
      studentID: 2,
      firstName: "Maria",
      lastName: "Santos",
      section: "Section A",
    },
    {
      studentID: 3,
      firstName: "Alex",
      lastName: "Reyes",
      section: "Section B",
    },
    {
      studentID: 4,
      firstName: "Angela",
      lastName: "Garcia",
      section: "Section B",
    },
    {
      studentID: 5,
      firstName: "John",
      lastName: "Mendoza",
      section: "Section C",
    },
    {
      studentID: 6,
      firstName: "Sofia",
      lastName: "Flores",
      section: "Section C",
    },
    {
      studentID: 7,
      firstName: "Daniel",
      lastName: "Castro",
      section: "Section D",
    },
    {
      studentID: 8,
      firstName: "Nicole",
      lastName: "Ramos",
      section: "Section D",
    },
  ];

  return (
    <TeacherPage title="Students">
      <section className="studentspanel">
        <div className="studentbox">
          <div className="tools">
            <div className="searchbar">
              <input type="text" placeholder="Search students..." />
            </div>
            <div className="buttons">
              <button type="button">Batch Upload</button>
              <button type="button">Delete Selected</button>
            </div>
          </div>

          <div className="studentcontainer">
            {students.map((student) => (
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
