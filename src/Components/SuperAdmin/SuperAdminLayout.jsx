import "../../css/SuperAdminLayout.css";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import SuperAdminSidebar from "./SuperAdminSidebar";

function SuperAdminLayout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [superadmin, setSuperAdmin] = useState(null);

    useEffect(() => {
        async function CheckSuperAdmin() {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                navigate("/", { replace: true });
                return;
            }

            const { data: staff, error } = await supabase
                .from("SchoolStaff")
                .select("firstName, lastName, role")
                .eq("authUserID", user.id)
                .single();

            if (error || staff?.role !== "superadmin") {
                await supabase.auth.signOut();
                navigate("/", { replace: true });
                return;
            }

            setSuperAdmin(staff);
            setLoading(false);
        }

        CheckSuperAdmin();
    }, [navigate]);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="superadminlayout">
            <SuperAdminSidebar superadmin={superadmin} />
            <Outlet />
        </div>
    );
}

export default SuperAdminLayout;
