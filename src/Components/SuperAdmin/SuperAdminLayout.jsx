import "../../css/SuperAdminLayout.css";
import { useContext, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import RealtimeSync from "../RealtimeSync";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { GetStaffProfile } from "../../lib/staffQueries";
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

    useEffect(() => {
        if (error?.code !== "AUTH_REQUIRED" || actionPending || redirecting.current) return;
        async function RedirectInvalidAdmin() {
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

        void RedirectInvalidAdmin();
    }, [actionPending, error, navigate, queryClient]);

    if (error?.code === "AUTH_REQUIRED") {
        return <p role="status">Returning to login...</p>;
    }

    if (!superadmin && (error || isPaused)) {
        return <AccountCheckError onRetry={() => refetch()} retrying={isFetching} />;
    }

    if (isPending || !superadmin) {
        return <p role="status">Checking your account...</p>;
    }

    return (
        <>
            {(error || isPaused) && <AccountCheckError onRetry={() => refetch()} retrying={isFetching} inline />}
            <div className="superadminlayout">
                <RealtimeSync />
                <SuperAdminSidebar superadmin={superadmin} />
                <Outlet context={{ superadmin }} />
            </div>
        </>
    );
}

export default SuperAdminLayout;
