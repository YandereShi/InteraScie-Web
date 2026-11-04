import "../../css/TeacherDashboard.css";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { PiStudentFill } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { announcementCharacterLimit } from "../../lib/announcementQueries";
import { GetTeacherDashboard, GetTeacherLevelProgress, GetTeacherRadarData, teacherDashboardQueryKey } from "../../lib/dashboardQueries";
import TeacherPage from "./TeacherPage";
import ScoreGraph from "./ScoreGraph";
import GraphPopup from "./GraphPopup";
import AnnouncementPopup from "./AnnouncementPopup";
import DashboardRadar from "./DashboardRadar";
import DashboardLevelProgress from "./DashboardLevelProgress";
import RadarGraphPopup from "./RadarGraphPopup";
import ExportDataPopup from "./ExportDataPopup";
import SectionSelect from "../SectionSelect";
import { MatchesSchoolYear } from "../../lib/schoolYear";
import { FilterRadarLevels } from "../../lib/radarData";

const emptyDashboard = {
  staffID: null,
  sections: [],
  students: [],
  levels: [],
  tests: [],
  scores: [],
};

function IsValidScore(score) {
  const value = Number(score);

  return score !== null && score !== undefined && score !== "" &&
    Number.isInteger(value) && value >= 0 && value <= 15;
}

function MakeData(scores) {
  const data = Array.from({ length: 16 }, (_, index) => ({
    score: index,
    students: 0,
  }));

  scores.forEach((item) => {
    const value = Number(item.score);

    if (IsValidScore(item.score)) {
      data[value].students += 1;
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
  const { teacher } = useOutletContext();
  const [branch, setBranch] = useState("Chemistry");
  const [active, setActive] = useState(null);
  const [section, setSection] = useState("all");
  const [performanceSchoolYear, setPerformanceSchoolYear] = useState("all");
  const [radarSchoolYear, setRadarSchoolYear] = useState("all");
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const OpenRadar = useCallback(() => setRadarOpen(true), []);
  const CloseRadar = useCallback(() => setRadarOpen(false), []);

  const dashboardQuery = useQuery({
    queryKey: [...teacherDashboardQueryKey, teacher.staffID, branch],
    queryFn: () => GetTeacherDashboard(teacher.staffID, branch),
    staleTime: 2 * 60 * 1000,
  });

  const dashboard = dashboardQuery.data ?? emptyDashboard;
  const { staffID, sections, students, levels, tests, scores } = dashboard;
  const performanceSections = sections.filter((item) => MatchesSchoolYear(item, performanceSchoolYear));
  const selectedSection = performanceSections.some((item) => String(item.sectionID) === section) ? section : "all";
  const performanceSectionIDs = new Set(performanceSections.filter((item) => selectedSection === "all" || String(item.sectionID) === selectedSection).map((item) => String(item.sectionID)));
  const performanceStudentIDs = new Set(students.filter((item) => performanceSectionIDs.has(String(item.sectionID))).map((item) => String(item.studentID)));
  const performanceScores = scores.filter((item) => performanceStudentIDs.has(String(item.studentID)));
  const radarSections = sections.filter((item) => MatchesSchoolYear(item, radarSchoolYear));
  const studentIDs = useMemo(() => students.map((item) => item.studentID), [students]);
  const radarQuery = useQuery({
    queryKey: ["TeacherRadar", staffID, students.map((student) => [student.studentID, student.sectionID]), "sectionTotals"],
    queryFn: () => GetTeacherRadarData(staffID, students),
    enabled: Boolean(staffID),
    staleTime: 2 * 60 * 1000,
  });
  const progressQuery = useQuery({
    queryKey: ["TeacherLevelProgress", staffID, studentIDs],
    queryFn: () => GetTeacherLevelProgress(staffID, studentIDs),
    enabled: Boolean(staffID),
    staleTime: 2 * 60 * 1000,
  });
  const studentTotal = students.length;
  const sectionTotal = sections.length;
  const loading = dashboardQuery.isPending;
  const radarLoading = !dashboardQuery.isError && !radarQuery.isError && (loading || radarQuery.isPending);
  const radarError = dashboardQuery.isError || radarQuery.isError;
  const error =
    dashboardQuery.error instanceof Error
      ? dashboardQuery.error.message
      : dashboardQuery.error
        ? "Unable to load the teacher dashboard."
        : "";
  const charts = GetCharts(levels, tests, performanceScores);
  const radarLevels = FilterRadarLevels(radarQuery.data ?? [], radarSections);

  function ChangePerformanceSchoolYear(value) {
    setPerformanceSchoolYear(value);
    setSection("all");
  }

  function GetScores(index) {
    const level = levels[index];

    if (!level) {
      return [];
    }

    const test = tests.find(
      (item) => item.levelID === level.levelID
    );

    if (!test) {
      return [];
    }

    return performanceScores.filter(
      (item) =>
        item.assessmentID === test.assessmentID &&
        Number(item.totalQuestions) === 15 &&
        IsValidScore(item.score)
    );
  }

  function OpenGraph(index) {
    setActive(index);
  }

  function CloseGraph() {
    setActive(null);
  }

  const activeScores = active === null ? [] : GetScores(active);
  const averageScore = activeScores.length > 0
    ? activeScores.reduce((total, item) => total + Number(item.score), 0) / activeScores.length
    : null;

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

        <DashboardRadar levels={radarLevels} sections={sections} schoolYear={radarSchoolYear} onSchoolYearChange={setRadarSchoolYear} loading={radarLoading} error={radarError} onOpen={OpenRadar} />

        <div className="performance">
          {error && <p className="dashboardmessage">{error}</p>}
          <div className="performancehead">
            <h2>Performance Overview</h2>

            <div className="performanceactions">
              <button type="button" className="dashboardexportbutton" disabled={loading || !staffID} onClick={() => setExportOpen(true)}>Export Data</button>
              <SectionSelect sections={sections} value={selectedSection} onChange={setSection} schoolYear={performanceSchoolYear} onSchoolYearChange={ChangePerformanceSchoolYear} label="Performance overview section" allowAll disabled={loading} />
              <select
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                aria-label="Select graph branch"
                disabled={loading}
              >
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Physics">Physics</option>
                <option value="Earth">Earth</option>
              </select>
            </div>
          </div>

          <div className="charts">
            {levels.map((level, index) => (
              <ScoreGraph key={level.levelID} title={`Lesson ${index + 1}`} data={charts[index]} height={180} onOpen={() => OpenGraph(index)} />
            ))}
          </div>
        </div>

        <button type="button" className="announcementcard" onClick={() => setAnnouncementOpen(true)} aria-haspopup="dialog">
          <span className="announcementcardtitle">Announcement</span>
          <span className="announcementcardcontent">
            <HiOutlineSpeakerphone className="announcementcardicon" aria-hidden="true" />
            <span>Share a reminder or update with your section.</span>
            <small>Up to {announcementCharacterLimit} characters</small>
          </span>
          <span className="announcementcardaction">Write announcement</span>
        </button>

        {active !== null && (
          <GraphPopup
            title={`${branch} - Lesson ${active + 1}`}
            data={MakeData(activeScores)}
            averageScore={averageScore}
            sections={sections}
            schoolYear={performanceSchoolYear}
            onSchoolYearChange={ChangePerformanceSchoolYear}
            section={selectedSection}
            onPick={setSection}
            onClose={CloseGraph}
          />
        )}

        {announcementOpen && (
          <AnnouncementPopup
            staffID={teacher.staffID}
            onClose={() => setAnnouncementOpen(false)}
          />
        )}

        {radarOpen && (
          <RadarGraphPopup levels={radarLevels} sections={sections} schoolYear={radarSchoolYear} onSchoolYearChange={setRadarSchoolYear} loading={radarLoading} error={radarError} onClose={CloseRadar} />
        )}
        {exportOpen && <ExportDataPopup teacherName={[teacher.firstName, teacher.lastName].filter(Boolean).join(" ")} onClose={() => setExportOpen(false)} />}
      </section>
    </TeacherPage>
  );
}

export default TeacherDashboard;
