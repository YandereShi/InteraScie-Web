import "../../css/SuperAdminPage.css";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

function SuperAdminPage({ title, children }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    async function HandleLogout() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            alert(error.message);
            return;
        }

        queryClient.clear();
        navigate("/", { replace: true });
    }

    return (
        <div className="superadminpage">
            <header className="superadminheader">
                <h1>{title}</h1>

                <button type="button" onClick={HandleLogout}>
                    Logout
                </button>
            </header>

            <main className="superadminmainpanel">
                {children}
            </main>
        </div>
    );
}

export default SuperAdminPage;
