import "../../css/TeacherDashboard.css";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PiStudentFill } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { supabase } from "../../lib/supabase";
import { GetTeacherDashboard, teacherDashboardQueryKey } from "../../lib/dashboardQueries";
import TeacherPage from "./TeacherPage";
import ScoreGraph from "./ScoreGraph";
import GraphPopup from "./GraphPopup";

const emptyDashboard = {
  sections: [],
  students: [],
  levels: [],
  tests: [],
  scores: [],
};

function MakeData(scores) {
  const data = Array.from({ length: 15 }, (_, index) => ({
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

function GetCharts(levels, tests, scores) {
  const chartList = levels.map((level) => {
    const test = tests.find(
      (item) => item.levelID === level.levelID
    );

    if (!test) {
      return MakeData([]);
    }

    const testScores = scores.filter(
      (item) =>
        item.assessmentID === test.assessmentID &&
        Number(item.totalQuestions) === 15
    );

    return MakeData(testScores);
  });

  return [
    chartList[0] ?? MakeData([]),
    chartList[1] ?? MakeData([]),
    chartList[2] ?? MakeData([]),
  ];
}

function TeacherDashboard() {
  const queryClient = useQueryClient();
  const [branch, setBranch] = useState("Chemistry");
  const [active, setActive] = useState(null);
  const [section, setSection] = useState("all");

  const dashboardQuery = useQuery({
    queryKey: [...teacherDashboardQueryKey, branch],
    queryFn: () => GetTeacherDashboard(branch),
    staleTime: 2 * 60 * 1000,
  });

  const dashboard = dashboardQuery.data ?? emptyDashboard;
  const { sections, students, levels, tests, scores } = dashboard;
  const studentTotal = students.length;
  const sectionTotal = sections.length;
  const loading = dashboardQuery.isPending;
  const error =
    dashboardQuery.error instanceof Error
      ? dashboardQuery.error.message
      : dashboardQuery.error
        ? "Unable to load the teacher dashboard."
        : "";
  const charts = useMemo(
    () => GetCharts(levels, tests, scores),
    [levels, scores, tests]
  );

  useEffect(() => {
    const channel = supabase
      .channel("chartChanges")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "StudentAssessment",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: teacherDashboardQueryKey,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  function GetData(index) {
    const level = levels[index];

    if (!level) {
      return MakeData([]);
    }

    const test = tests.find(
      (item) => item.levelID === level.levelID
    );

    if (!test) {
      return MakeData([]);
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

    return MakeData(scoreList);
  }

  function GetCompareData(sectionID) {
    const data = Array.from({ length: 16 }, (_, score) => ({
      score,
      students: 0,
    }));

    const level = levels[active];
    const test = tests.find(
      (item) => item.levelID === level?.levelID
    );

    if (!test) {
      return data;
    }

    const studentIDs = new Set(
      students
        .filter((student) =>
          String(student.sectionID) === String(sectionID)
        )
        .map((student) => student.studentID)
    );

    const counted = Array.from({ length: 16 }, () => new Set());

    scores.forEach((item) => {
      if (
        item.assessmentID !== test.assessmentID ||
        Number(item.totalQuestions) !== 15 ||
        !studentIDs.has(item.studentID) ||
        item.score === null ||
        item.score === undefined ||
        item.score === ""
      ) {
        return;
      }

      const score = Number(item.score);

      if (Number.isInteger(score) && score >= 0 && score <= 15) {
        counted[score].add(item.studentID);
      }
    });

    return data.map((item) => ({
      ...item,
      students: counted[item.score].size,
    }));
  }

  function OpenGraph(index) {
    setSection("all");
    setActive(index);
  }

  function CloseGraph() {
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
              <p>{loading ? "Loading..." : studentTotal}</p>
            </div>
          </div>

          <div className="totalcard totalsectioncard">
            <TbUsersGroup className="totalicon" aria-hidden="true" />

            <div className="totaldetails">
              <h2>Total Sections</h2>
              <p>{loading ? "Loading..." : sectionTotal}</p>
            </div>
          </div>
        </div>

        {error && <p className="dashboardmessage">{error}</p>}

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
              onOpen={() => OpenGraph(0)}
            />
            <ScoreGraph
              title="Lesson2"
              data={charts[1]}
              onOpen={() => OpenGraph(1)}
            />
            <ScoreGraph
              title="Lesson3"
              data={charts[2]}
              onOpen={() => OpenGraph(2)}
            />
          </div>
        </div>

        {active !== null && (
          <GraphPopup
            title={`${branch} - Lesson ${active + 1}`}
            data={GetData(active)}
            sections={sections}
            section={section}
            onPick={setSection}
            onClose={CloseGraph}
            GetCompareData={GetCompareData}
          />
        )}
      </section>
    </TeacherPage>
  );
}

export default TeacherDashboard;
