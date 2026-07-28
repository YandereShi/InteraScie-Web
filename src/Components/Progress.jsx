import "../css/Progress.css";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import TeacherPage from "./TeacherPage";

const maxRows = 10;
const maxLessons = 3;
const maxTasks = 3;

function Progress() {
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [levels, setLevels] = useState([]);
  const [branch, setBranch] = useState("");
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your login session was not found.");
      setLoading(false);
      setReady(true);
      return;
    }

    const { data: staff, error: staffError } =
      await supabase
        .from("SchoolStaff")
        .select("staffID")
        .eq("authUserID", user.id)
        .eq("role", "teacher")
        .single();

    if (staffError || !staff) {
      console.error(staffError?.message);
      setError("Your teacher account was not found.");
      setLoading(false);
      setReady(true);
      return;
    }

    const [sectionResult, levelResult] =
      await Promise.all([
        supabase
          .from("Section")
          .select("sectionID, sectionName, isShared")
          .eq("staffID", staff.staffID)
          .order("sectionName", { ascending: true }),
        supabase
          .from("Level")
          .select("levelID, branchName")
          .order("branchName", { ascending: true })
          .order("levelID", { ascending: true }),
      ]);

    if (sectionResult.error || levelResult.error) {
      console.error(
        sectionResult.error?.message ||
          levelResult.error?.message
      );
      setError("Unable to load progress options.");
      setLoading(false);
      setReady(true);
      return;
    }

    const sectionList = (sectionResult.data ?? []).filter(
      (item) => !item.isShared
    );
    const levelList = levelResult.data ?? [];
    const branchList = [
      ...new Set(
        levelList
          .map((item) => item.branchName)
          .filter(Boolean)
      ),
    ];

    setSections(sectionList);
    setLevels(levelList);
    setSection(String(sectionList[0]?.sectionID ?? ""));
    setBranch(branchList[0] ?? "");
    setReady(true);

    if (sectionList.length === 0) {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (!ready) {
      return;
    }

    if (!section) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: studentError } = await supabase
      .from("Student")
      .select("studentID, firstName, lastName")
      .eq("sectionID", section)
      .order("lastName", { ascending: true })
      .order("firstName", { ascending: true });

    if (studentError) {
      console.error(studentError.message);
      setError("Unable to load students.");
      setLoading(false);
      return;
    }

    setStudents(data ?? []);
    setPage(1);
    setLoading(false);
  }, [ready, section]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPage();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadStudents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  function pickSection(event) {
    setSection(event.target.value);
    setPage(1);
  }

  function pickBranch(event) {
    setBranch(event.target.value);
    setPage(1);
  }

  const branches = [
    ...new Set(
      levels
        .map((item) => item.branchName)
        .filter(Boolean)
    ),
  ];

  const pages = Math.max(
    1,
    Math.ceil(students.length / maxRows)
  );
  const first = (page - 1) * maxRows;
  const shown = students.slice(first, first + maxRows);
  const empty = Math.max(0, maxRows - shown.length);

  return (
    <TeacherPage title="Progress">
      <section className="progresspanel">
        <div className="progresssubject">
          <select
            value={branch}
            onChange={pickBranch}
            aria-label="Progress subject"
            disabled={branches.length === 0}
          >
            {branches.length === 0 && (
              <option value="">No subjects</option>
            )}

            {branches.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="progressbox">
          <table className="progresstable">
            <colgroup>
              <col className="progressname" />
              {Array.from(
                { length: maxLessons * maxTasks },
                (_, index) => <col key={index} />
              )}
            </colgroup>

            <thead>
              <tr className="progresstop">
                <th>
                  <select
                    value={section}
                    onChange={pickSection}
                    aria-label="Progress section"
                    disabled={sections.length === 0}
                  >
                    {sections.length === 0 && (
                      <option value="">No sections</option>
                    )}

                    {sections.map((item) => (
                      <option
                        value={item.sectionID}
                        key={item.sectionID}
                      >
                        {item.sectionName}
                      </option>
                    ))}
                  </select>
                </th>

                {Array.from(
                  { length: maxLessons },
                  (_, index) => (
                    <th colSpan={maxTasks} key={index}>
                      Lesson {index + 1}
                    </th>
                  )
                )}
              </tr>

              <tr className="progresstasks">
                <th>Student Name</th>

                {branch === "Chemistry" && (
                  <>
                    <th><p>Scientific Skills</p></th>
                    <th><p>Scientific Method</p></th>
                    <th><p>Scientific Model</p></th>

                    <th><p>State of Matter</p></th>
                    <th><p>Particles Motion</p></th>
                    <th><p>Phase Change</p></th>

                    <th><p>Solution</p></th>
                    <th><p>Concen- tration</p></th>
                    <th><p>Solubility</p></th>
                  </>
                )}

                {branch === "Biology" && (
                  <>
                    <th><p>Microscope</p></th>
                    <th><p>Cellular</p></th>
                    <th><p>Cell Structure</p></th>

                    <th><p>Mitosis</p></th>
                    <th><p>Meiosis</p></th>
                    <th><p>Asexual & Sexual</p></th>

                    <th><p>Biological Organization</p></th>
                    <th><p>Energy Flow</p></th>
                    <th><p>Review</p></th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="10" className="progressnote">
                    Loading students...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="10" className="progressnote">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && shown.length === 0 && (
                <tr>
                  <td colSpan="10" className="progressnote">
                    No students found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                shown.map((student) => (
                  <tr key={student.studentID}>
                    <td>
                      {student.lastName}, {student.firstName}
                    </td>

                    {Array.from(
                      { length: maxLessons * maxTasks },
                      (_, index) => <td key={index}></td>
                    )}
                  </tr>
                ))}

              {!loading &&
                !error &&
                Array.from({ length: empty }, (_, rowIndex) => (
                  <tr
                    className="progressempty"
                    key={`empty-${rowIndex}`}
                  >
                    <td>&nbsp;</td>

                    {Array.from(
                      { length: maxLessons * maxTasks },
                      (_, cellIndex) => (
                        <td key={cellIndex}></td>
                      )
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="progresspager">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() =>
              setPage((current) => current - 1)
            }
          >
            &lt;
          </button>

          <span>{page}</span>

          <button
            type="button"
            aria-label="Next page"
            disabled={page === pages}
            onClick={() =>
              setPage((current) => current + 1)
            }
          >
            &gt;
          </button>
        </div>
      </section>
    </TeacherPage>
  );
}

export default Progress;
