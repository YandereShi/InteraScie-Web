import "../css/TeacherDashboard.css";
import TeacherPage from "./TeacherPage";
import {useEffect, useState} from "react";
import {PiStudentFill} from "react-icons/pi";
import {TbUsersGroup} from "react-icons/tb";
import {supabase} from "../lib/supabase";
import ScoreGraph from "./ScoreGraph";
import GraphPopup from "./GraphPopup";

function makeData(scores) {
  const data = Array.from({length: 15}, (_, index) => ({
    score: index + 1,
    students: 0,
  }));

  scores.forEach((item) => {
    const value = Number(item.score);

    if (Number.isInteger(value) && value >= 1 && value <= 15) {
      data[value - 1].students += 1;
    }
  });

  return data;
}

function TeacherDashboard() {

  const [studentTotal, setStudentTotal] = useState(0);
  const [sectionTotal, setSectionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState("Chemistry");
  const [charts, setCharts] = useState(() => [
    makeData([]),
    makeData([]),
    makeData([]),
  ]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [tests, setTests] = useState([]);
  const [scores, setScores] = useState([]);
  const [active, setActive] = useState(null);
  const [section, setSection] = useState("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      async function loadTotals() {
        setLoading(true);
        setError("");
        setCharts([makeData([]), makeData([]), makeData([])]);
        setSections([]);
        setStudents([]);
        setLevels([]);
        setTests([]);
        setScores([]);
        setActive(null);
        setSection("all");

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

        const {data: sectionData, error: sectionError} = await supabase
          .from("Section")
          .select("sectionID, sectionName")
          .eq("staffID", staff.staffID)
          .eq("isShared", false);

        if (sectionError) {
          setError("Failed to fetch sections");
          setLoading(false);
          return;
        }

        const sectionList = sectionData ?? [];
        const sectionIDs = sectionList.map((section) => section.sectionID);

        setSections(sectionList);
        setSectionTotal(sectionList.length);

      if (sectionIDs.length === 0){
        setStudentTotal(0);
        setLoading(false);
        return;
      }

      const {data: studentData, error: studentError} = await supabase
        .from("Student")
        .select("studentID, sectionID")
        .in("sectionID", sectionIDs);

      if (studentError) {
        setError("Failed to fetch students");
        setLoading(false);
        return;
      }

      const studentList = studentData ?? [];

      setStudents(studentList);
      setStudentTotal(studentList.length);
      const {data: levelData, error: levelError} = await supabase
        .from("Level")
        .select("levelID, levelName")
        .eq("branchName", branch)
        .order("levelID", {ascending: true})
        .limit(3);

      if (levelError) {
        setError(`Failed to fetch ${branch} lessons`);
        setLoading(false);
        return;
      }

const levelList = levelData ?? [];
const levelIDs = levelList.map((level) => level.levelID);

if (levelIDs.length === 0) {
  setError(`No ${branch} lessons found`);
  setLoading(false);
  return;
}

const {data: testData, error: testError} = await supabase
  .from("Assessment")
  .select("assessmentID, levelID")
  .eq("staffID", staff.staffID)
  .in("levelID", levelIDs)
  .order("assessmentID", {ascending: true});

if (testError) {
  setError("Failed to fetch assessments");
  setLoading(false);
  return;
}

const testList = testData ?? [];
const studentIDs = studentList.map((student) => student.studentID);
const testIDs = testList.map((test) => test.assessmentID);

let scoreList = [];

if (studentIDs.length > 0 && testIDs.length > 0) {
  const {data: scoreData, error: scoreError} = await supabase
    .from("StudentAssessment")
    .select("studentID, assessmentID, score, totalQuestions")
    .in("studentID", studentIDs)
    .in("assessmentID", testIDs);

  if (scoreError) {
    setError("Failed to fetch assessment scores");
    setLoading(false);
    return;
  }

  scoreList = scoreData ?? [];
}

setLevels(levelList);
setTests(testList);
setScores(scoreList);

const chartList = levelList.map((level) => {
  const test = testList.find(
    (item) => item.levelID === level.levelID
  );

  if (!test) {
    return makeData([]);
  }

  const testScores = scoreList.filter(
    (item) =>
      item.assessmentID === test.assessmentID &&
      Number(item.totalQuestions) === 15
  );

  return makeData(testScores);
});

setCharts([
  chartList[0] ?? makeData([]),
  chartList[1] ?? makeData([]),
  chartList[2] ?? makeData([]),
]);
      setLoading(false);
    }

    loadTotals();
  }, 0);

  return () => window.clearTimeout(timer);
  }, [branch]);

  function getData(index) {
    const level = levels[index];

    if (!level) {
      return makeData([]);
    }

    const test = tests.find((item) => item.levelID === level.levelID);

    if (!test) {
      return makeData([]);
    }

    let scoreList = scores.filter(
      (item) =>
        item.assessmentID === test.assessmentID &&
        Number(item.totalQuestions) === 15
    );

    if (section !== "all") {
      const studentIDs = students
        .filter((item) => String(item.sectionID) === section)
        .map((item) => item.studentID);

      scoreList = scoreList.filter((item) =>
        studentIDs.includes(item.studentID)
      );
    }

    return makeData(scoreList);
  }

  function openGraph(index) {
    setSection("all");
    setActive(index);
  }

  function closeGraph() {
    setActive(null);
  }

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

        <div className="performance">
          <div className="performancehead">
            <h2>Performance Overview</h2>

            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              aria-label="Select graph branch"
              disabled={loading}
            >
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>
          </div>

          <div className="charts">
            <ScoreGraph
              title="Lesson1"
              data={charts[0]}
              onOpen={() => openGraph(0)}
            />
            <ScoreGraph
              title="Lesson2"
              data={charts[1]}
              onOpen={() => openGraph(1)}
            />
            <ScoreGraph
              title="Lesson3"
              data={charts[2]}
              onOpen={() => openGraph(2)}
            />
          </div>
        </div>

        {active !== null && (
          <GraphPopup
            title={`${branch} - Lesson ${active + 1}`}
            data={getData(active)}
            sections={sections}
            section={section}
            onPick={setSection}
            onClose={closeGraph}
          />
        )}
      </section>
    </TeacherPage>
  );
}

export default TeacherDashboard;
