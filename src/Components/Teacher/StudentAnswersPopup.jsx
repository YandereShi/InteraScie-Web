import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetStudentAnswers } from "../../lib/assessmentQueries";
import "../../css/StudentAnswersPopup.css";

function StudentAnswersPopup({ student, assessmentID, studentAssessmentID, lesson, onClose }) {
  const dialog = useRef(null);
  const answersQuery = useQuery({
    queryKey: ["StudentAnswers", assessmentID, studentAssessmentID],
    queryFn: () => GetStudentAnswers(assessmentID, studentAssessmentID),
    refetchOnMount: "always",
  });
  const answers = answersQuery.data ?? [];

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
    <dialog
      ref={dialog}
      className="studentanswerspopup"
      aria-labelledby="studentanswerstitle"
      aria-describedby="studentanswersname"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="studentanswersheader">
        <div>
          <h2 id="studentanswerstitle">Student Answer</h2>
          <p id="studentanswersname">{student.lastName}, {student.firstName}</p>
          <span>{lesson}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close student answers">&times;</button>
      </div>

      <div className="studentanswerslist" role="region" aria-label="Student answers" tabIndex={0}>
        {answersQuery.isPending ? (
          <p className="studentanswersstate" role="status">Loading answers...</p>
        ) : answersQuery.isError ? (
          <p className="studentanswersstate" role="alert">{answersQuery.error.message}</p>
        ) : answers.length === 0 ? (
          <p className="studentanswersstate">No answer details were recorded for this assessment.</p>
        ) : (
          <table className="studentanswerstable">
            <thead>
              <tr>
                <th scope="col">Question #</th>
                <th scope="col">Student Answer</th>
                <th scope="col">Correct Answer</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer) => (
                <tr key={answer.questionID} className={answer.isCorrect === null
                  ? "" : answer.isCorrect ? "studentanswercorrect" : "studentanswerincorrect"}>
                  <th scope="row">{answer.number}</th>
                  <td>
                    {answer.selectedAnswer ?? "No recorded answer"}
                  </td>
                  <td>{answer.correctAnswer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </dialog>
  );
}

export default StudentAnswersPopup;
