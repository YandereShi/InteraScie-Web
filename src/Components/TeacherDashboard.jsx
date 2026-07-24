import "./TeacherDashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import TeacherSideBar from "./TeacherSideBar";

function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTeacher() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data: staff, error } = await supabase
        .from("SchoolStaff")
        .select("role")
        .eq("authUserID", user.id)
        .single();

      if (error || staff.role !== "teacher") {
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }

      setLoading(false);
    }

    checkTeacher();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (

    <div className="teacherpage">
      <TeacherSideBar />

      <div className="teacherdashboard">
        <div className="dashboardheader">
          <h1>Teacher Dashboard</h1>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>
        
      </div>
    </div>
  );
}

export default TeacherDashboard;
