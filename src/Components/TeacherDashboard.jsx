import "../css/TeacherDashboard.css";
import TeacherPage from "./TeacherPage";
import {useEffect, useState} from "react";
import {PiStudentFill} from "react-icons/pi";
import {TbUsersGroup} from "react-icons/tb";
import {supabase} from "../lib/supabase";

function TeacherDashboard() {

  const [studentTotal, setStudentTotal] = useState(0);
  const [sectionTotal, setSectionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      async function loadTotals() {
        setLoading(true);
        setError("");

        const {
          data: {user},
          error: userError,
        } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError("Failed to fetch user information");
          setLoading(false);
          return;
        }

        const {data: staff, error:staffError} = await supabase
          .from("SchoolStaff")
          .select("staffID")
          .eq("authUserID", user.id)
          .eq("role", "teacher")
          .single();

        if (staffError || !staff) {
          setError("Failed to fetch staff information");
          setLoading(false);
          return;
        }

        const {data: sections, error: sectionError} = await supabase
          .from("Section")
          .select("sectionID")
          .eq("staffID", staff.staffID)
          .eq("isShared", false);

        if (sectionError) {
          setError("Failed to fetch sections");
          setLoading(false);
          return;
        }

        const sectionList = sections ?? [];
        const sectionIDs = sectionList.map((section) => section.sectionID);

        setSectionTotal(sectionList.length);

      if (sectionIDs.length === 0){
        setStudentTotal(0);
        setLoading(false);
        return;
      }

      const {count, error: studentError,} = await supabase
        .from("Student")
        .select("studentID", {count: "exact", head: true})
        .in("sectionID", sectionIDs);

      if (studentError) {
        setError("Failed to fetch student count");
        setLoading(false);
        return;
      }

      setStudentTotal(count ?? 0);
      setLoading(false);
    }

    loadTotals();
  }, 0);

  return () => window.clearTimeout(timer);
  }, []);

  return (
    <TeacherPage title="Teacher Dashboard">
      <section className="dashboardpanel">
        <div className="dashboardtotals">
          <div className="totalcard totalstudentcard">
            <PiStudentFill className="totalicon" aria-hidden="true" />

            <div className="totaldetails">
              <h2>Total Students</h2>
              <p>
                {loading ? "Loading..." : studentTotal}
              </p>
            </div>
          </div>

          <div className="totalcard totalsectioncard">
            <TbUsersGroup className="totalicon" aria-hidden="true" />

            <div className="totaldetails">
              <h2>Total Sections</h2>
              <p>
                {loading ? "Loading..." : sectionTotal}
              </p>
            </div>
          </div>
        </div>

        {error && (<p className="dashboardmessage">{error}</p>)}
      </section>
    </TeacherPage>
  );
}

export default TeacherDashboard;
