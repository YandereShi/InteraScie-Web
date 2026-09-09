import "../../css/SuperAdminDashboard.css";
import "../../css/TeacherDashboard.css";
import { useQuery } from "@tanstack/react-query";
import { FaChalkboardTeacher } from "react-icons/fa";
import { PiStudentFill } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { GetSuperAdminDashboard, superAdminDashboardQueryKey } from "../../lib/dashboardQueries";
import SuperAdminPage from "./SuperAdminPage";

function SuperAdminDashboard() {
    const dashboardQuery = useQuery({
        queryKey: superAdminDashboardQueryKey,
        queryFn: GetSuperAdminDashboard,
        staleTime: 2 * 60 * 1000,
    });

    const studentTotal = dashboardQuery.data?.studentTotal ?? 0;
    const teacherTotal = dashboardQuery.data?.teacherTotal ?? 0;
    const sectionTotal = dashboardQuery.data?.sectionTotal ?? 0;
    const loading = dashboardQuery.isPending;
    const error =
        dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : dashboardQuery.error
                ? "Unable to load dashboard totals."
                : "";

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
