import "../../css/TeacherDashboard.css";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PiStudentFill } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { supabase } from "../../lib/supabase";
import { GetTeacherDashboard, GetTeacherLevelProgress, GetTeacherRadarData, teacherDashboardQueryKey } from "../../lib/dashboardQueries";
import { GetBranchAccuracy, GetBranchAccuracyQueryKey, accuracyBranches } from "../../lib/questionAccuracyQueries";
import TeacherPage from "./TeacherPage";
import ScoreGraph from "./ScoreGraph";
import GraphPopup from "./GraphPopup";
import QuestionAccuracyPopup from "./QuestionAccuracyPopup";
import DashboardRadar from "./DashboardRadar";
import DashboardLevelProgress from "./DashboardLevelProgress";

const emptyDashboard = {
  staffID: null,
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
  const [accuracyOpen, setAccuracyOpen] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: [...teacherDashboardQueryKey, branch],
    queryFn: () => GetTeacherDashboard(branch),
    staleTime: 2 * 60 * 1000,
  });

  const dashboard = dashboardQuery.data ?? emptyDashboard;
  const { staffID, sections, students, levels, tests, scores } = dashboard;
  const studentIDs = useMemo(() => students.map((item) => item.studentID), [students]);
  const accuracyQuery = useQuery({
    queryKey: GetBranchAccuracyQueryKey(staffID),
    queryFn: () => GetBranchAccuracy(staffID),
    enabled: Boolean(staffID),
  });
  const radarQuery = useQuery({
    queryKey: ["TeacherRadar", staffID, studentIDs],
    queryFn: () => GetTeacherRadarData(staffID, studentIDs),
    enabled: Boolean(staffID),
    staleTime: 2 * 60 * 1000,
  });
  const progressQuery = useQuery({
    queryKey: ["TeacherLevelProgress", staffID, studentIDs],
    queryFn: () => GetTeacherLevelProgress(studentIDs),
    enabled: Boolean(staffID),
    staleTime: 2 * 60 * 1000,
  });
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
          queryClient.invalidateQueries({ queryKey: ["TeacherRadar"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Progress" },
        () => queryClient.invalidateQueries({ queryKey: ["TeacherLevelProgress"] })
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
          <div className="dashboardtotals dashboardtile">
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

          <DashboardLevelProgress
            sections={sections}
            students={students}
            levels={progressQuery.data?.levels ?? []}
            records={progressQuery.data?.records ?? []}
            loading={!dashboardQuery.isError && !progressQuery.isError && (loading || progressQuery.isPending)}
            error={dashboardQuery.isError || progressQuery.isError}
          />

        <DashboardRadar levels={radarQuery.data ?? []} loading={loading || radarQuery.isPending} error={radarQuery.isError} />

        <div className="performance">
          {error && <p className="dashboardmessage">{error}</p>}
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
              <option value="Physics">Physics</option>
              <option value="Earth">Earth Science</option>
            </select>
          </div>

          <div className="charts">
            {levels.map((level, index) => (
              <ScoreGraph key={level.levelID} title={`Lesson ${index + 1}`} data={charts[index]} height={180} onOpen={() => OpenGraph(index)} />
            ))}
          </div>
        </div>

        <button type="button" className="accuracycard" onClick={() => setAccuracyOpen(true)}>
          <span className="accuracycardtitle">Question Accuracy</span>
          <span className="accuracycardcontent">
            {accuracyBranches.map((item) => {
              const summary = accuracyQuery.data?.[item];
              const percentage = summary?.total > 0
                ? Math.round((summary.correct / summary.total) * 100)
                : null;
              const pending = loading || (Boolean(staffID) && accuracyQuery.isPending);
              const value = pending ? "…" : percentage === null ? "—" : `${percentage}%`;

              return (
                <span className="accuracycardbranch" key={item}>
                  <span
                    className={percentage === null || pending ? "accuracycardring empty" : "accuracycardring"}
                    style={percentage === null || pending ? undefined : {
                      background: `conic-gradient(#77d75b 0 ${percentage}%, #ff343c ${percentage}% 100%)`,
                    }}
                    role="img"
                    aria-label={pending
                      ? `${item}: loading accuracy`
                      : percentage === null
                        ? `${item}: no answers yet`
                        : `${item}: ${percentage}% correct`}
                  >
                    <span>{value}</span>
                  </span>
                  <span className="accuracycardbranchname">{item}</span>
                </span>
              );
            })}
          </span>
          {accuracyQuery.isError && <span className="accuracycarderror">Unable to load accuracy.</span>}
        </button>

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

        {accuracyOpen && (
          <QuestionAccuracyPopup
            initialBranch={branch}
            onClose={() => setAccuracyOpen(false)}
          />
        )}
      </section>
    </TeacherPage>
  );
}

export default TeacherDashboard;
