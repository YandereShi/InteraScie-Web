import "../../css/TeacherLayout.css";
import { useContext, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { GetTeacherProfile } from "../../lib/staffQueries";
import RealtimeSync from "../RealtimeSync";
import TeacherSidebar from "./TeacherSideBar";
import AccountCheckError from "../AccountCheckError";
import { PopupContext } from "../../lib/PopupContext";

function TeacherLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actionPending } = useContext(PopupContext);
  const redirecting = useRef(false);

  const {
    data: teacher,
    error,
    isPending,
    isFetching,
    isPaused,
    refetch,
  } = useQuery({
    queryKey: ["TeacherProfile"],
    queryFn: GetTeacherProfile,
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, queryError) => queryError.code !== "AUTH_REQUIRED" && failureCount < 1,
  });

  useEffect(() => {
    if (error?.code !== "AUTH_REQUIRED" || actionPending || redirecting.current) {
      return;
    }

    async function RedirectInvalidTeacher() {
      redirecting.current = true;
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // A failed sign-out request must not keep an invalid account on this page.
      } finally {
        queryClient.clear();
        navigate("/", { replace: true });
      }
    }

    void RedirectInvalidTeacher();
  }, [actionPending, error, navigate, queryClient]);

  if (error?.code === "AUTH_REQUIRED") {
    return <p role="status">Returning to login...</p>;
  }

  if (!teacher && (error || isPaused)) {
    return <AccountCheckError onRetry={() => refetch()} retrying={isFetching} />;
  }

  if (isPending || !teacher) {
    return <p role="status">Checking your account...</p>;
  }

  return (
    <>
      {(error || isPaused) && <AccountCheckError onRetry={() => refetch()} retrying={isFetching} inline />}
      <div className="teacherlayout">
        <RealtimeSync />
        <TeacherSidebar teacher={teacher} />
        <Outlet context={{ teacher }} />
      </div>
    </>
  );
}

export default TeacherLayout;
