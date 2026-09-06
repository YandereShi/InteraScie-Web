import "../../css/SuperAdminDashboard.css";
import "../../css/TeacherDashboard.css";
import { useEffect, useState } from "react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { PiStudentFill } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { supabase } from "../../lib/supabase";
import SuperAdminPage from "./SuperAdminPage";

function SuperAdminDashboard() {
    const [studentTotal, setStudentTotal] = useState(0);
    const [teacherTotal, setTeacherTotal] = useState(0);
    const [sectionTotal, setSectionTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function LoadTotals() {
            setLoading(true);
            setError("");

            const { data, error: loadError } =
                await supabase.functions.invoke(
                    "superadmindashboard"
                );

            if (loadError || !data) {
                setError("Unable to load dashboard totals.");
                setLoading(false);
                return;
            }

            setStudentTotal(Number(data.studentTotal) || 0);
            setTeacherTotal(Number(data.teacherTotal) || 0);
            setSectionTotal(Number(data.sectionTotal) || 0);
            setLoading(false);
        }

        LoadTotals();
    }, []);

    const studentValue = loading ? "..." : studentTotal;
    const teacherValue = loading ? "..." : teacherTotal;
    const sectionValue = loading ? "..." : sectionTotal;

    return (
        <SuperAdminPage title="Dashboard">
            <section className="dashboardpanel">
                <div className="dashboardtotals superadmindashboardtotals">
                    <article className="totalcard totalstudentcard">
                        <PiStudentFill className="totalicon" aria-hidden="true" />
                        <div className="totaldetails">
                            <h2>Total Students</h2>
                            <p>{studentValue}</p>
                        </div>
                    </article>

                    <article className="totalcard totalteachercard">
                        <FaChalkboardTeacher className="totalicon" aria-hidden="true" />
                        <div className="totaldetails">
                            <h2>Total Teachers</h2>
                            <p>{teacherValue}</p>
                        </div>
                    </article>

                    <article className="totalcard totalsectioncard">
                        <TbUsersGroup className="totalicon" aria-hidden="true" />
                        <div className="totaldetails">
                            <h2>Total Sections</h2>
                            <p>{sectionValue}</p>
                        </div>
                    </article>
                </div>

                {error && (
                    <p className="superadmindashboardmessage" role="alert">
                        {error}
                    </p>
                )}
            </section>
        </SuperAdminPage>
    );
}

export default SuperAdminDashboard;
