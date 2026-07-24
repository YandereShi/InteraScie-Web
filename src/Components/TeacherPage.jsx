import "./TeacherPage.css";
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
        {children}
      </main>
    </div>
  );
}

export default TeacherPage;
