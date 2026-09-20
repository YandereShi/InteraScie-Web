import "../../css/QuestionAccuracyPopup.css";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetAssessmentOptions, assessmentOptionsQueryKey } from "../../lib/assessmentQueries";
import { GetQuestionAccuracy, GetQuestionAccuracyQueryKey } from "../../lib/questionAccuracyQueries";

function QuestionAccuracyPopup({ initialBranch, onClose: OnClose }) {
  const [branch, setBranch] = useState(initialBranch);
  const [lesson, setLesson] = useState(0);
  const optionsQuery = useQuery({
    queryKey: assessmentOptionsQueryKey,
    queryFn: GetAssessmentOptions,
    staleTime: 2 * 60 * 1000,
  });

  const levels = optionsQuery.data?.levels ?? [];
  const branches = [...new Set(levels.map((level) => level.branchName).filter(Boolean))];
  const selectedBranch = branches.includes(branch) ? branch : branches[0] ?? "";
  const branchLevels = levels
    .filter((level) => level.branchName === selectedBranch)
    .sort((first, second) => first.levelID - second.levelID)
    .slice(0, 3);
  const activeLesson = Math.min(lesson, Math.max(0, branchLevels.length - 1));
  const levelID = branchLevels[activeLesson]?.levelID;
  const staffID = optionsQuery.data?.staffID;
  const accuracyQuery = useQuery({
    queryKey: GetQuestionAccuracyQueryKey(staffID, levelID),
    queryFn: () => GetQuestionAccuracy(staffID, levelID),
    enabled: Boolean(staffID && levelID),
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function HandleKeyDown(event) {
      if (event.key === "Escape") {
        OnClose();
      }
    }

    document.addEventListener("keydown", HandleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", HandleKeyDown);
    };
  }, [OnClose]);

  function HandleBranchChange(event) {
    setBranch(event.target.value);
    setLesson(0);
  }

  const questions = accuracyQuery.data ?? [];
  const error = optionsQuery.error ?? accuracyQuery.error;
  const loading = optionsQuery.isPending || (Boolean(levelID) && accuracyQuery.isPending);

  return (
    <div className="accuracyoverlay" onClick={OnClose}>
      <div
        className="accuracypopup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accuracytitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="accuracyheader">
          <div>
            <h2 id="accuracytitle">Question Accuracy</h2>
            <p>See how often students answer each question correctly.</p>
          </div>
          <button type="button" className="accuracyclose" onClick={OnClose} aria-label="Close question accuracy">
            &times;
          </button>
        </div>

        <div className="accuracycontrols">
          <label className="accuracybranch">
            <span>Branch</span>
            <select value={selectedBranch} onChange={HandleBranchChange} disabled={branches.length === 0}>
              {branches.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <div className="accuracylessons" aria-label="Select lesson">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                type="button"
                className={index === activeLesson ? "accuracylesson active" : "accuracylesson"}
                aria-pressed={index === activeLesson}
                aria-label={`Lesson ${index + 1}`}
                disabled={!branchLevels[index]}
                onClick={() => setLesson(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="accuracylist" role="region" aria-label="Question accuracy results" tabIndex={0}>
          {loading && <p className="accuracystate">Loading question accuracy...</p>}
          {!loading && error && <p className="accuracystate accuracyerror">{error.message || "Unable to load question accuracy."}</p>}
          {!loading && !error && questions.length === 0 && (
            <p className="accuracystate">No questions found for this lesson.</p>
          )}
          {!loading && !error && questions.map((question) => {
            const percentage = question.total > 0
              ? Math.round((question.correct / question.total) * 100)
              : null;

            return (
              <div className="accuracyrow" key={question.questionID}>
                <div className="accuracyquestion">
                  <span>Question {question.number}</span>
                  <p>{question.text || "Untitled question"}</p>
                  <small>
                    {question.total > 0
                      ? `${question.correct} of ${question.total} correct`
                      : "No answers yet"}
                  </small>
                </div>
                <div
                  className={percentage === null ? "accuracydonut empty" : "accuracydonut"}
                  style={percentage === null ? undefined : {
                    background: `conic-gradient(#77d75b 0 ${percentage}%, #ff343c ${percentage}% 100%)`,
                  }}
                  role="img"
                  aria-label={percentage === null
                    ? `Question ${question.number}: no answers yet`
                    : `Question ${question.number}: ${percentage}% correct`}
                >
                  <span>{percentage === null ? "—" : `${percentage}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default QuestionAccuracyPopup;
