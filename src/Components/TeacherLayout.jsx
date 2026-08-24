import "../css/TeacherLayout.css";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import TeacherSidebar from "./TeacherSideBar";

function TeacherLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);

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
        .select("firstName, lastName, role")
        .eq("authUserID", user.id)
        .single();

      if (error || staff.role !== "teacher") {
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }

      setTeacher(staff);
      setLoading(false);
    }

    checkTeacher();
  }, [navigate]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="teacherlayout">
      <TeacherSidebar teacher={teacher} />
      <Outlet />
    </div>
  );
}

export default TeacherLayout;
