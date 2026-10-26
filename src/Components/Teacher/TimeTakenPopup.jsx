import { useEffect, useRef, useState } from "react";
import "../../css/QuestionAccuracyPopup.css";
import "../../css/TimeTakenPopup.css";
import { FormatLevelTime, GetLevelTimes } from "../../lib/levelTime";

function TimeTakenPopup({ branch, levels, sections, section, students, records, loading, error, onSectionChange, onClose }) {
  const dialog = useRef(null);
  const [lesson, setLesson] = useState(0);
  const [sortDirection, setSortDirection] = useState("asc");
  const branchLevels = levels.filter((level) => level.branchName === branch)
    .sort((first, second) => first.levelID - second.levelID);
  const activeLesson = Math.min(lesson, Math.max(0, branchLevels.length - 1));
  const levelID = branchLevels[activeLesson]?.levelID;
  const rows = GetLevelTimes(students, records, section, levelID, sortDirection);
  const finishedRows = rows.filter((student) => student.isFinished);
  const averageTime = !loading && !error && finishedRows.length > 0
    ? finishedRows.reduce((total, student) => total + student.timeTakenSeconds, 0) / finishedRows.length
    : null;
  const sectionNames = new Map(sections.map((item) => [String(item.sectionID), item.sectionName]));
  const branchName = branch === "Earth" ? "Earth Science" : branch;

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={dialog} className="accuracypopup timetakenpopup" aria-labelledby="timetakentitle" onCancel={(event) => {
      event.preventDefault();
      onClose();
    }} onClick={(event) => {
      if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }
    }}>
      <div className="accuracyheader">
        <div>
          <h2 id="timetakentitle">Time Taken</h2>
          <p>{branchName} · Level {activeLesson + 1}</p>
        </div>
        <button type="button" className="accuracyclose" onClick={onClose} aria-label="Close time taken">&times;</button>
      </div>

      <div className="accuracycontrols">
        <label className="accuracybranch">
          <span>Section</span>
          <select value={section} onChange={(event) => onSectionChange(event.target.value)} aria-label="Time taken section">
            <option value="all">All sections</option>
            {sections.map((item) => <option key={item.sectionID} value={String(item.sectionID)}>{item.sectionName}</option>)}
          </select>
        </label>
        <div className="timetakenlevels">
          <span className="timetakenaverage">Avg Time: {averageTime === null ? "--" : FormatLevelTime(Math.round(averageTime))}</span>
          <div className="accuracylessons" aria-label="Select level">
            {[0, 1, 2].map((index) => (
              <button key={index} type="button" className={index === activeLesson ? "accuracylesson active" : "accuracylesson"}
                aria-label={`${branchName} Level ${index + 1}`} aria-pressed={index === activeLesson}
                disabled={!branchLevels[index]} onClick={() => setLesson(index)}>{index + 1}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="timetakencolumns">
        <span>Student</span>
        <button type="button" className="timetakensort" aria-controls="timetakenresults"
          aria-label={sortDirection === "desc" ? "Sort each group from fastest to slowest, finished students first" : "Sort each group from slowest to fastest, finished students first"}
          onClick={() => setSortDirection((current) => current === "desc" ? "asc" : "desc")}>
          Time (mm:ss) <span aria-hidden="true">{sortDirection === "desc" ? "↓" : "↑"}</span>
        </button>
      </div>
      <div id="timetakenresults" className="accuracylist timetakenlist" role="region" aria-label={`${branchName} Level ${activeLesson + 1} times, finished students first, ${sortDirection === "desc" ? "slowest to fastest" : "fastest to slowest"} in each group`} tabIndex={0}>
        {loading ? <p className="accuracystate" role="status">Loading times...</p>
          : error ? <p className="accuracystate accuracyerror" role="alert">Unable to load times.</p>
          : rows.length === 0 ? <p className="accuracystate">No recorded times for this section and level yet.</p>
          : rows.map((student) => (
            <div className={student.isFinished ? "accuracyrow timetakenrow finished" : "accuracyrow timetakenrow"} key={student.studentID}>
              <div className="timetakenstudent">
                <strong>{[student.lastName, student.firstName].filter(Boolean).join(", ") || "Unnamed student"}</strong>
                {section === "all" && <span>{sectionNames.get(String(student.sectionID))}</span>}
                <span className="timetakenstatus">{student.isFinished ? "Finished" : "Not finished"}</span>
              </div>
              <span className="timetakenvalue">{FormatLevelTime(student.timeTakenSeconds)}</span>
            </div>
          ))}
      </div>
    </dialog>
  );
}

export default TimeTakenPopup;
