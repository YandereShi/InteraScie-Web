import "../css/Assessments.css";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Questions from "./Questions";
import TeacherPage from "./TeacherPage";

const maxRows = 10;
const maxLessons = 3;
const maxScore = 15;

function Assessments() {
  const [view, setView] = useState("scores");
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [levels, setLevels] = useState([]);
  const [branch, setBranch] = useState("");
  const [staff, setStaff] = useState("");
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [scores, setScores] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({key: null, order: "asc",});

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

    const { data: staffData, error: staffError } =
      await supabase
        .from("SchoolStaff")
        .select("staffID")
        .eq("authUserID", user.id)
        .eq("role", "teacher")
        .single();

    if (staffError || !staffData) {
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
          .eq("staffID", staffData.staffID)
          .order("sectionName", { ascending: true }),
        supabase
          .from("Level")
          .select("levelID, levelName, branchName")
          .order("branchName", { ascending: true })
          .order("levelID", { ascending: true }),
      ]);

    if (sectionResult.error || levelResult.error) {
      console.error(
        sectionResult.error?.message ||
          levelResult.error?.message
      );
      setError("Unable to load assessment options.");
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
    ].sort((first, second) => {
      if (first === "Chemistry") {
        return -1;
      }

      if (second === "Chemistry") {
        return 1;
      }

      return first.localeCompare(second);
    });

    setStaff(staffData.staffID);
    setSections(sectionList);
    setLevels(levelList);
    setSection(String(sectionList[0]?.sectionID ?? ""));
    setBranch(branchList[0] ?? "");
    setReady(true);

    if (sectionList.length === 0 || branchList.length === 0) {
      setLoading(false);
    }
  }, []);

  const loadScores = useCallback(async () => {
    if (!ready) {
      return;
    }

    const lessonList = levels
      .filter((item) => item.branchName === branch)
      .slice(0, maxLessons);

    if (
      !section ||
      !branch ||
      !staff ||
      lessonList.length === 0
    ) {
      setStudents([]);
      setTests([]);
      setScores([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const lessonIds = lessonList.map(
      (item) => item.levelID
    );

    const [studentResult, testResult] =
      await Promise.all([
        supabase
          .from("Student")
          .select("studentID, firstName, lastName")
          .eq("sectionID", section)
          .order("lastName", { ascending: true })
          .order("firstName", { ascending: true }),
        supabase
          .from("Assessment")
          .select("assessmentID, levelID")
          .eq("staffID", staff)
          .in("levelID", lessonIds)
          .order("assessmentID", { ascending: true }),
      ]);

    if (studentResult.error || testResult.error) {
      console.error(
        studentResult.error?.message ||
          testResult.error?.message
      );
      setError("Unable to load assessment records.");
      setLoading(false);
      return;
    }

    const studentList = studentResult.data ?? [];
    const allTests = testResult.data ?? [];
    const testList = lessonList
      .map((lesson) =>
        allTests.find(
          (test) => test.levelID === lesson.levelID
        )
      )
      .filter(Boolean);
    let scoreList = [];

    if (studentList.length > 0 && testList.length > 0) {
      const studentIds = studentList.map(
        (student) => student.studentID
      );
      const testIds = testList.map(
        (test) => test.assessmentID
      );

      const { data, error: scoreError } = await supabase
        .from("StudentAssessment")
        .select("studentID, assessmentID, score")
        .in("studentID", studentIds)
        .in("assessmentID", testIds);

      if (scoreError) {
        console.error(scoreError.message);
        setError("Unable to load student scores.");
        setLoading(false);
        return;
      }

      scoreList = data ?? [];
    }

    setStudents(studentList);
    setTests(testList);
    setScores(scoreList);
    setPage(1);
    setLoading(false);
  }, [branch, levels, ready, section, staff]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPage();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadScores();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadScores]);

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
  ].sort((first, second) => {
    if (first === "Chemistry") {
      return -1;
    }

    if (second === "Chemistry") {
      return 1;
    }

    return first.localeCompare(second);
  });

  const lessons = levels
    .filter((item) => item.branchName === branch)
    .slice(0, maxLessons);

  function getScore(studentID, assessmentID) {
    const result = scores.find(
      (score) =>
        score.studentID === studentID &&
        score.assessmentID === assessmentID
    );

    if (result?.score === null || result?.score === undefined) {
      return null;
    }

    return Number(result.score);
  }

  function getTotal(studentID) {
    if (lessons.length < maxLessons) {
      return `--/${maxScore * maxLessons}`;
    }

    const values = lessons.map((lesson) => {
      const test = tests.find(
        (item) => item.levelID === lesson.levelID
      );

      return test
        ? getScore(studentID, test.assessmentID)
        : null;
    });

    if (values.some((value) => value === null)) {
      return `--/${maxScore * maxLessons}`;
    }

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    return `${total}/${maxScore * maxLessons}`;
  }

  function getValue(student, key) {
    if (key === "name") {
      return `${student.lastName}, ${student.firstName}`
        .toLowerCase();
    }

    const values = lessons.map((lesson) => {
      const test = tests.find(
        (item) => item.levelID === lesson.levelID
      );

      return test
        ? getScore(student.studentID, test.assessmentID)
        : null;
    });

    if (key === "total") {
      if (
        values.length < maxLessons ||
        values.some((value) => value === null)
      ) {
        return null;
      }

      return values.reduce(
        (sum, value) => sum + value,
        0
      );
    }

    return values[key] ?? null;
  }

  function changeSort(key) {
    setSort((current) => ({
      key,
      order:
        current.key === key &&
        current.order === "asc"
          ? "desc"
          : "asc",
    }));

    setPage(1);
  }

  function getArrow(key) {
    if (sort.key !== key) {
      return "";
    }

    return sort.order === "asc" ? "↑" : "↓";
  }

  const sorted = sort.key === null
    ? students
    : [...students].sort((firstStudent, secondStudent) => {
        const firstValue = getValue(
          firstStudent,
          sort.key
        );
        const secondValue = getValue(
          secondStudent,
          sort.key
        );

        if (firstValue === null && secondValue === null) {
          return 0;
        }

        if (firstValue === null) {
          return 1;
        }

        if (secondValue === null) {
          return -1;
        }

        const result =
          typeof firstValue === "string"
            ? firstValue.localeCompare(secondValue)
            : firstValue - secondValue;

        return sort.order === "asc"
          ? result
          : -result;
      });
  const pages = Math.max(
    1,
    Math.ceil(sorted.length / maxRows)
  );
  const first = (page - 1) * maxRows;
  const shown = sorted.slice(first, first + maxRows);
  const empty = Math.max(0, maxRows - shown.length);

  return (
    <TeacherPage title="Assessments">
      {view === "scores" ? (
      <section className="assessmentspanel">
        <div className="assessmentmanage">
          <button
            type="button"
            onClick={() => setView("questions")}
          >
            Manage Questions &rarr;
          </button>
        </div>

        <div className="assessmentbox">
          <table className="assessmenttable">
            <colgroup>
              <col className="assessmentname" />
              <col />
              <col />
              <col />
              <col className="assessmenttotal" />
            </colgroup>

            <thead>
              <tr className="assessmenttop">
                <th>
                  <select
                    value={section}
                    onChange={pickSection}
                    aria-label="Active section"
                    disabled={sections.length === 0}
                  >
                    {sections.length === 0 && (
                      <option value="">No sections</option>
                    )}

                    {sections.map((item) => (
                      <option
                        key={item.sectionID}
                        value={item.sectionID}
                      >
                        {item.sectionName}
                      </option>
                    ))}
                  </select>
                </th>

                {Array.from(
                  { length: maxLessons },
                  (_, index) => (
                    <th key={index}>
                      {lessons[index]?.levelName ||
                        `Lesson ${index + 1}`}
                    </th>
                  )
                )}

                <th>
                  <select
                    value={branch}
                    onChange={pickBranch}
                    aria-label="Assessment branch"
                    disabled={branches.length === 0}
                  >
                    {branches.length === 0 && (
                      <option value="">No branches</option>
                    )}

                    {branches.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </th>
              </tr>

              <tr>
                <th>
                  <button
                    type="button"
                    className="assessmentsort"
                    onClick={() => changeSort("name")}
                  >
                    Student Name
                    <span>{getArrow("name")}</span>
                  </button>
                </th>

                {Array.from(
                  { length: maxLessons },
                  (_, index) => (
                    <th key={index}>
                      <button
                        type="button"
                        className="assessmentsort"
                        onClick={() => changeSort(index)}
                      >
                        Score
                        <span>{getArrow(index)}</span>
                      </button>
                    </th>
                  )
                )}

                <th>
                  <button
                    type="button"
                    className="assessmentsort"
                    onClick={() => changeSort("total")}
                  >
                    Total Score
                    <span>{getArrow("total")}</span>
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="assessmentnote">
                    Loading assessment scores...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="5" className="assessmentnote">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && shown.length === 0 && (
                <tr>
                  <td colSpan="5" className="assessmentnote">
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
                      { length: maxLessons },
                      (_, index) => {
                        const lesson = lessons[index];
                        const test = lesson
                          ? tests.find(
                              (item) =>
                                item.levelID ===
                                lesson.levelID
                            )
                          : null;
                        const score = test
                          ? getScore(
                              student.studentID,
                              test.assessmentID
                            )
                          : null;

                        return (
                          <td key={index}>
                            {score === null
                              ? `--/${maxScore}`
                              : `${score}/${maxScore}`}
                          </td>
                        );
                      }
                    )}

                    <td>{getTotal(student.studentID)}</td>
                  </tr>
                ))}

              {!loading &&
                !error &&
                Array.from({ length: empty }, (_, index) => (
                  <tr
                    className="assessmentempty"
                    key={`empty-${index}`}
                  >
                    <td>&nbsp;</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="assessmentpager">
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
      ) : (
        <Questions onBack={() => setView("scores")} />
      )}
    </TeacherPage>
  );
}

export default Assessments;
