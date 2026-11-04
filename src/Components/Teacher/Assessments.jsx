import { GetSectionLabel } from "../../lib/schoolYear";
import "../../css/Assessments.css";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { GetAssessmentOptions, assessmentOptionsQueryKey, GetAssessmentHistorySources, GetHistoricalAssessmentScores } from "../../lib/assessmentQueries";
import { GetAssessmentScoresOptions, assessmentLessonCount } from "../../lib/assessmentCache";
import { GetBranchAccuracy, GetBranchAccuracyQueryKey, accuracyBranches } from "../../lib/questionAccuracyQueries";
import { GetStudentPhotoPath } from "../../lib/profilePhotos";
import studentImage from "../../assets/pfp.png";
import ProfilePhoto from "../ProfilePhoto";
import Questions from "./Questions";
import StudentAnswersPopup from "./StudentAnswersPopup";
import QuestionAccuracyPopup from "./QuestionAccuracyPopup";
import TeacherPage from "./TeacherPage";
import { GetPageSelection, SavePageSelection } from "../../lib/pageSelection";
import { GetBranches } from "../../lib/branches";

const maxRows = 10;
const maxLessons = assessmentLessonCount;
const maxScore = 15;
const emptyList = [];
const emptyScores = {
  students: [],
  tests: [],
  scores: [],
};

function Assessments() {
  const { teacher } = useOutletContext();
  const authUserID = teacher.authUserID;
  const [view, setView] = useState("scores");
  const [selectedSection, setSelectedSection] = useState(() => GetPageSelection(authUserID, "Assessments", "Section"));
  const [selectedBranch, setSelectedBranch] = useState(() => GetPageSelection(authUserID, "Assessments", "Branch"));
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, order: "asc" });
  const [selectedAnswers, setSelectedAnswers] = useState(null);
  const [accuracyOpen, setAccuracyOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState("current");

  const optionsQuery = useQuery({
    queryKey: [...assessmentOptionsQueryKey, teacher.staffID],
    queryFn: () => GetAssessmentOptions(teacher.staffID),
    staleTime: 5 * 60 * 1000,
  });

  const sections = optionsQuery.data?.sections ?? emptyList;
  const levels = optionsQuery.data?.levels ?? emptyList;
  const staffID = optionsQuery.data?.staffID ?? 0;
  const branches = GetBranches(levels);
  const section = sections.some(
    (item) => String(item.sectionID) === selectedSection
  )
    ? selectedSection
    : String(sections[0]?.sectionID ?? "");
  const branch = branches.includes(selectedBranch)
    ? selectedBranch
    : branches[0] ?? "";
  const lessonCount = branch === "Earth" ? 2 : maxLessons;
  const sectionID = Number(section) || 0;
  const activeSection = sections.find((item) => item.sectionID === sectionID);
  const sectionName = activeSection ? GetSectionLabel(activeSection) : "";
  const lessons = levels
    .filter((item) => item.branchName === branch)
    .slice(0, lessonCount);
  const lessonIDs = lessons.map((item) => item.levelID);
  const sourcesQuery = useQuery({
    queryKey: ["AssessmentHistorySources", sectionID],
    queryFn: () => GetAssessmentHistorySources(sectionID),
    enabled: sectionID > 0,
    staleTime: 2 * 60 * 1000,
  });
  const previousSources = (sourcesQuery.data ?? emptyList).filter((source) => source.staffID !== staffID);
  const source = previousSources.some((item) => item.staffID === selectedSource) ? selectedSource : "current";
  const historical = source !== "current";
  const accuracyQuery = useQuery({
    queryKey: GetBranchAccuracyQueryKey(staffID, section),
    queryFn: () => GetBranchAccuracy(staffID, section),
    enabled: Boolean(staffID) && sectionID > 0 && !historical,
    staleTime: 2 * 60 * 1000,
  });
  const accuracyLoading = optionsQuery.isPending || (Boolean(staffID) && sectionID > 0 && accuracyQuery.isPending);
  const scoresQuery = useQuery({
    ...(historical ? {
      queryKey: ["AssessmentScores", sectionID, source, branch, "history"],
      queryFn: () => GetHistoricalAssessmentScores(sectionID, source, lessonIDs),
      staleTime: 2 * 60 * 1000,
    } : GetAssessmentScoresOptions(sectionID, staffID, branch, lessonIDs)),
    enabled:
      sectionID > 0 &&
      Boolean(staffID) &&
      lessonIDs.length > 0,
  });

  const scoreData = scoresQuery.data ?? emptyScores;
  const students = scoreData.students;
  const tests = scoreData.tests;
  const scores = scoreData.scores;
  const loading =
    optionsQuery.isPending ||
    (sectionID > 0 &&
      Boolean(staffID) &&
      lessonIDs.length > 0 &&
      scoresQuery.isPending);
  const requestError = optionsQuery.error || scoresQuery.error;
  const error =
    requestError instanceof Error
      ? requestError.message
      : requestError
        ? "Unable to load assessment scores."
        : "";

  function PickSection(event) {
    const value = event.target.value;
    setSelectedSection(value);
    SavePageSelection(authUserID, "Assessments", "Section", value);
    setSelectedSource("current");
    setSelectedAnswers(null);
    setPage(1);
  }

  function PickBranch(event) {
    const value = event.target.value;
    setSelectedBranch(value);
    SavePageSelection(authUserID, "Assessments", "Branch", value);
    setPage(1);
  }

  function GetScore(studentID, assessmentID) {
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

  function GetTotal(studentID) {
    if (lessons.length < lessonCount) {
      return `--/${maxScore * lessonCount}`;
    }

    const values = lessons.map((lesson) => {
      const test = tests.find(
        (item) => item.levelID === lesson.levelID
      );

      return test
        ? GetScore(studentID, test.assessmentID)
        : null;
    });

    if (values.some((value) => value === null)) {
      return `--/${maxScore * lessonCount}`;
    }

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    return `${total}/${maxScore * lessonCount}`;
  }

  function GetValue(student, key) {
    if (key === "name") {
      return `${student.lastName}, ${student.firstName}`
        .toLowerCase();
    }

    const values = lessons.map((lesson) => {
      const test = tests.find(
        (item) => item.levelID === lesson.levelID
      );

      return test
        ? GetScore(student.studentID, test.assessmentID)
        : null;
    });

    if (key === "total") {
      if (
        values.length < lessonCount ||
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

  function ChangeSort(key) {
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

  function GetArrow(key) {
    if (sort.key !== key) {
      return "";
    }

    return sort.order === "asc" ? "↑" : "↓";
  }

  const sorted = sort.key === null
    ? students
    : [...students].sort((firstStudent, secondStudent) => {
        const firstValue = GetValue(firstStudent, sort.key);
        const secondValue = GetValue(secondStudent, sort.key);

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
  const activePage = Math.min(page, pages);
  if (scoresQuery.isSuccess && page > pages) {
    setPage(pages);
  }
  const first = (activePage - 1) * maxRows;
  const shown = sorted.slice(first, first + maxRows);
  const empty = Math.max(0, maxRows - shown.length);

  return (
    <TeacherPage title="Assessments">
      {view === "scores" ? (
        <section className="assessmentspanel">
          <div className="assessmentmanage">
            {!historical && (
              <button type="button" className="assessmentaccuracypanel" aria-label={`View question accuracy for ${sectionName || "the selected section"}`} aria-haspopup="dialog" onClick={() => setAccuracyOpen(true)}>
                <strong>Accuracy:</strong>
                <span className="assessmentaccuracybranches">
                  {accuracyBranches.map((item) => {
                    const summary = accuracyQuery.data?.[item];
                    const percentage = summary?.total > 0 ? Math.round((summary.correct / summary.total) * 100) : null;
                    const empty = accuracyLoading || percentage === null;
                    return (
                      <span className="assessmentaccuracybranch" key={item}>
                        <span className={empty ? "assessmentaccuracyring empty" : "assessmentaccuracyring"} style={empty ? undefined : {
                          background: `conic-gradient(#77d75b 0 ${percentage}%, #ff343c ${percentage}% 100%)`,
                        }} role="img" aria-label={accuracyLoading ? `${item}: loading accuracy` : percentage === null ? `${item}: no answers yet` : `${item}: ${percentage}% correct`}>
                          <span>{accuracyLoading ? "…" : percentage === null ? "—" : `${percentage}%`}</span>
                        </span>
                        <span>{item === "Earth Science" ? "Earth" : item}</span>
                      </span>
                    );
                  })}
                </span>
                {accuracyQuery.isError && <span className="assessmentaccuracyerror">Unable to load accuracy.</span>}
              </button>
            )}
            {previousSources.length > 0 && (
              <label className="assessmenthistorysource">
                Assessment Source
                <select aria-label="Assessment source" value={source} onChange={(event) => { setSelectedSource(event.target.value); setPage(1); setSelectedAnswers(null); }}>
                  <option value="current">{teacher.firstName} {teacher.lastName} — Current teacher</option>
                  {previousSources.map((item) => <option key={item.staffID} value={item.staffID}>{item.firstName} {item.lastName} — Previous assessments</option>)}
                </select>
              </label>
            )}
            {historical ? <span className="assessmenthistorynotice">Read only</span> : (
              <div className="assessmentmanageactions">
                <button type="button" onClick={() => setView("questions")}>
                  Manage Questions &rarr;
                </button>
              </div>
            )}
          </div>
          {sourcesQuery.isError && <p className="assessmenthistoryerror" role="alert">Unable to load previous assessment sources.</p>}

          <div className="assessmentbox">
            <table className="assessmenttable" style={{ "--assessment-lesson-count": lessonCount }}>
              <colgroup>
                <col className="assessmentname" />
                {Array.from({ length: lessonCount }, (_, index) => (
                  <col key={index} />
                ))}
                <col className="assessmenttotal" />
              </colgroup>

              <thead>
                <tr className="assessmenttop">
                  <th>
                    <select
                      value={section}
                      onChange={PickSection}
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
                          {GetSectionLabel(item)}
                        </option>
                      ))}
                    </select>
                  </th>

                  {Array.from(
                    { length: lessonCount },
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
                      onChange={PickBranch}
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

                <tr className="assessmentlabels">
                  <th>
                    <button
                      type="button"
                      className="assessmentsort"
                      onClick={() => ChangeSort("name")}
                    >
                      Student Name
                      <span>{GetArrow("name")}</span>
                    </button>
                  </th>

                  {Array.from(
                    { length: lessonCount },
                    (_, index) => (
                      <th key={index}>
                        <button
                          type="button"
                          className="assessmentsort"
                          onClick={() => ChangeSort(index)}
                        >
                          Score
                          <span>{GetArrow(index)}</span>
                        </button>
                      </th>
                    )
                  )}

                  <th>
                    <button
                      type="button"
                      className="assessmentsort"
                      onClick={() => ChangeSort("total")}
                    >
                      Total Score
                      <span>{GetArrow("total")}</span>
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={lessonCount + 2} className="assessmentnote">
                      Loading assessment scores...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={lessonCount + 2} className="assessmentnote">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && shown.length === 0 && (
                  <tr>
                    <td colSpan={lessonCount + 2} className="assessmentnote">
                      No students found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  shown.map((student) => (
                    <tr key={student.studentID}>
                      <td>
                        <span className="assessmentstudent">
                          <ProfilePhoto
                            path={GetStudentPhotoPath(student.studentID)}
                            fallback={studentImage}
                            className="assessmentstudentphoto"
                            alt=""
                          />
                          <span className="assessmentstudentname" title={`${student.lastName}, ${student.firstName}`}>
                            {student.lastName}, {student.firstName}
                          </span>
                        </span>
                      </td>

                      {Array.from(
                        { length: lessonCount },
                        (_, index) => {
                          const lesson = lessons[index];
                          const test = lesson
                            ? tests.find(
                                (item) =>
                                  item.levelID === lesson.levelID
                              )
                            : null;
                          const result = test && scores.find(
                            (item) => item.studentID === student.studentID &&
                              item.assessmentID === test.assessmentID
                          );
                          const score = result?.score === null || result?.score === undefined
                            ? null : Number(result.score);

                          return (
                            <td key={index}>
                              {score !== null && result?.studentAssessmentID ? (
                                <button
                                  type="button"
                                  className="assessmentscorebutton"
                                  aria-label={`View ${student.firstName} ${student.lastName}'s answers for ${branch}, Lesson ${index + 1}`}
                                  onClick={() => setSelectedAnswers({
                                    student,
                                    assessmentID: test.assessmentID,
                                    studentAssessmentID: result.studentAssessmentID,
                                    historySectionID: historical ? sectionID : null,
                                    lesson: `${branch} · ${lesson.levelName || `Lesson ${index + 1}`}`,
                                  })}
                                >
                                  {score}/{maxScore}
                                </button>
                              ) : score === null ? `--/${maxScore}` : `${score}/${maxScore}`}
                            </td>
                          );
                        }
                      )}

                      <td>{GetTotal(student.studentID)}</td>
                    </tr>
                  ))}

                {!loading &&
                  !error &&
                  Array.from({ length: empty }, (_, index) => (
                    <tr
                      className="assessmentempty"
                      key={`empty${index}`}
                    >
                      <td>&nbsp;</td>
                      {Array.from({ length: lessonCount }, (_, lessonIndex) => (
                        <td key={lessonIndex}></td>
                      ))}
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
              disabled={activePage === 1}
              onClick={() =>
                setPage((current) => current - 1)
              }
            >
              &lt;
            </button>

            <span>{activePage}</span>

            <button
              type="button"
              aria-label="Next page"
              disabled={activePage === pages}
              onClick={() =>
                setPage((current) => current + 1)
              }
            >
              &gt;
            </button>
          </div>
        </section>
      ) : (
        <Questions
          sectionID={sectionID}
          sectionName={sectionName}
          onBack={() => setView("scores")}
        />
      )}
      {selectedAnswers && (
        <StudentAnswersPopup
          key={selectedAnswers.studentAssessmentID}
          {...selectedAnswers}
          onClose={() => setSelectedAnswers(null)}
        />
      )}
      {accuracyOpen && (
        <QuestionAccuracyPopup
          initialBranch={branch}
          initialSection={section}
          onClose={() => setAccuracyOpen(false)}
        />
      )}
    </TeacherPage>
  );
}

export default Assessments;
