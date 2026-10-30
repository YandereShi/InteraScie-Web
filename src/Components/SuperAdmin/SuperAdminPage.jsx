import "../../css/SuperAdminPage.css";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useContext } from "react";
import { supabase } from "../../lib/supabase";
import { PopupContext } from "../../lib/PopupContext";

function SuperAdminPage({ title, children }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { ShowConfirmation, actionPending } = useContext(PopupContext);

    async function HandleLogout() {
        if (actionPending) return;
        const { error } = await supabase.auth.signOut({ scope: "local" });

        if (error) {
            await ShowConfirmation(error.message);
            return;
        }

        queryClient.clear();
        navigate("/login", { replace: true });
    }

    return (
        <div className="superadminpage">
            <header className="superadminheader">
                <h1>{title}</h1>

                <button type="button" onClick={HandleLogout} disabled={actionPending}>
                    Logout
                </button>
            </header>

            <main className="superadminmainpanel" tabIndex={-1}>
                {children}
            </main>
        </div>
    );
}

export default SuperAdminPage;
