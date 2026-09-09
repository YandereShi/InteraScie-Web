import "../../css/TeacherLayout.css";
import { useEffect } from "react";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { GetTeacherProfile } from "../../lib/staffQueries";
import TeacherSidebar from "./TeacherSideBar";

function TeacherLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: teacher,
    error,
    isPending,
  } = useQuery({
    queryKey: ["TeacherProfile"],
    queryFn: GetTeacherProfile,
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!error) {
      return;
    }

    async function RedirectInvalidTeacher() {
      queryClient.clear();
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    }

    RedirectInvalidTeacher();
  }, [error, navigate, queryClient]);

  if (isPending || !teacher) {
    return <p>Loading...</p>;
  }

  return (
    <div className="teacherlayout">
      <TeacherSidebar teacher={teacher} />
      <Outlet context={{ teacher }} />
    </div>
  );
}

export default TeacherLayout;