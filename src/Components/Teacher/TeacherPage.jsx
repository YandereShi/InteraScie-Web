import "../../css/TeacherPage.css";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useContext } from "react";
import { supabase } from "../../lib/supabase";
import { PopupContext } from "../../lib/PopupContext";

function TeacherPage({ title, children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ShowConfirmation } = useContext(PopupContext);

  async function HandleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      await ShowConfirmation(error.message);
      return;
    }

    queryClient.clear();
    navigate("/", { replace: true });
  }

  return (
    <div className="teacherpage">
      <header className="teacherheader">
        <h1>{title}</h1>

        <button type="button" onClick={HandleLogout}>
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
