import "../css/TeacherPage.css";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";

function TeacherPage({ title, children }) {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <div className="teacherpage">
      <header className="teacherheader">
        <h1>{title}</h1>

        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="mainpanel">
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
            <p>Student Name</p>
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
      </main>
    </div>
  );
}

export default TeacherPage;
