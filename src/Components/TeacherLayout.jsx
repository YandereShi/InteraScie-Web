import "../css/TeacherLayout.css";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import TeacherSidebar from "./TeacherSidebar";

function TeacherLayout() {
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

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="teacherlayout">
      <TeacherSidebar />
      <Outlet />
    </div>
  );
}

export default TeacherLayout;
