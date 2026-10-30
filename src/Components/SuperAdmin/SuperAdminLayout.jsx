import "../../css/SuperAdminLayout.css";
import { useContext, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import RealtimeSync from "../RealtimeSync";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { GetStaffProfile, staffSessionOptions } from "../../lib/staffQueries";
import { PopupContext } from "../../lib/PopupContext";
import AccountCheckError from "../AccountCheckError";

function SuperAdminLayout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { actionPending } = useContext(PopupContext);
    const redirecting = useRef(false);
    const { data: superadmin, error, isPending, isFetching, isPaused, refetch } = useQuery({
        queryKey: ["SuperAdminProfile"],
        queryFn: () => GetStaffProfile("superadmin"),
        staleTime: 30 * 60 * 1000,
        retry: (failureCount, queryError) => queryError.code !== "AUTH_REQUIRED" && failureCount < 1,
    });
    const sessionQuery = useQuery({ ...staffSessionOptions, enabled: Boolean(superadmin) });
    const loginError = sessionQuery.error?.code === "AUTH_REQUIRED" ? sessionQuery.error : error;

    useEffect(() => {
        if (loginError?.code !== "AUTH_REQUIRED" || actionPending || redirecting.current) return;
        async function RedirectInvalidAdmin() {
            redirecting.current = true;
            await supabase.auth.signOut({ scope: "local" }).catch(() => null);
            queryClient.clear();
            navigate("/", { replace: true, state: { loginMessage: loginError.message } });
        }

        void RedirectInvalidAdmin();
    }, [actionPending, loginError, navigate, queryClient]);

    if (loginError?.code === "AUTH_REQUIRED") {
        return <p role="status">Returning to login...</p>;
    }

    if (!superadmin && (error || isPaused)) {
        return <AccountCheckError onRetry={() => refetch()} retrying={isFetching} />;
    }

    if (isPending || !superadmin) {
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
            <div className="superadminlayout">
                <RealtimeSync />
                <SuperAdminSidebar superadmin={superadmin} />
                <Outlet context={{ superadmin }} />
            </div>
        </>
    );
}

export default SuperAdminLayout;
