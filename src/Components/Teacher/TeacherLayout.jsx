import "../../css/TeacherLayout.css";
import { useContext, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { GetTeacherProfile, staffSessionOptions } from "../../lib/staffQueries";
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
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    retry: (failureCount, queryError) => queryError.code !== "AUTH_REQUIRED" && failureCount < 1,
  });
  const sessionQuery = useQuery({ ...staffSessionOptions, enabled: Boolean(teacher) });
  const loginError = sessionQuery.error?.code === "AUTH_REQUIRED" ? sessionQuery.error : error;

  useEffect(() => {
    if (loginError?.code !== "AUTH_REQUIRED" || actionPending || redirecting.current) {
      return;
    }

    async function RedirectInvalidTeacher() {
      redirecting.current = true;
      await supabase.auth.signOut({ scope: "local" }).catch(() => null);
      queryClient.clear();
      navigate("/login", { replace: true, state: { loginMessage: loginError.message } });
    }

    void RedirectInvalidTeacher();
  }, [actionPending, loginError, navigate, queryClient]);

  if (loginError?.code === "AUTH_REQUIRED") {
    return <p role="status">Returning to login...</p>;
  }

  if (!teacher && (error || isPaused)) {
    return <AccountCheckError onRetry={() => refetch()} retrying={isFetching} />;
  }

  if (isPending || !teacher) {
    return <p role="status">Checking your account...</p>;
  }

  if (!sessionQuery.data) {
    return sessionQuery.error || sessionQuery.isPaused
      ? <AccountCheckError onRetry={() => sessionQuery.refetch()} retrying={sessionQuery.isFetching} />
      : <p role="status">Checking your session...</p>;
  }

  return (
    <>
      {(error || isPaused) && <AccountCheckError onRetry={() => refetch()} retrying={isFetching} inline />}
      {(sessionQuery.error || sessionQuery.isPaused) && <AccountCheckError onRetry={() => sessionQuery.refetch()} retrying={sessionQuery.isFetching} inline />}
      <div className="teacherlayout">
        <RealtimeSync />
        <TeacherSidebar teacher={teacher} />
        <Outlet context={{ teacher }} />
      </div>
    </>
  );
}

export default TeacherLayout;
