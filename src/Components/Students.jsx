import "../css/Students.css";
import TeacherPage from "./TeacherPage";

function Students() {
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
