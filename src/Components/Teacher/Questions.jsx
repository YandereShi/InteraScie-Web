import "../../css/Questions.css";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { GetAssessmentOptions, GetAssessmentQuestions, GetAssessmentQuestionsQueryKey, assessmentOptionsQueryKey } from "../../lib/assessmentQueries";
import { teacherDashboardQueryKey } from "../../lib/dashboardQueries";
import QuestionCard from "./QuestionCard";
import QuestionPopup from "./QuestionPopup";
import { limits } from "../../lib/inputLimits";

const maxCards = 6;
const emptyQuestions = {
  test: null,
  questions: [],
};

function GetBranches(levels) {
  return [
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
}

function Questions({ onBack }) {
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selected, setSelected] = useState([]);
  const [current, setCurrent] = useState(null);
  const [number, setNumber] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const optionsQuery = useQuery({
    queryKey: assessmentOptionsQueryKey,
    queryFn: GetAssessmentOptions,
    staleTime: 5 * 60 * 1000,
  });

  const levels = optionsQuery.data?.levels ?? [];
  const staffID = optionsQuery.data?.staffID ?? 0;
  const branches = GetBranches(levels);
  const branch = branches.includes(selectedBranch)
    ? selectedBranch
    : branches[0] ?? "";
  const lessons = levels.filter(
    (item) => item.branchName === branch
  );
  const lesson = lessons.some(
    (item) => String(item.levelID) === selectedLesson
  )
    ? selectedLesson
    : String(lessons[0]?.levelID ?? "");
  const levelID = Number(lesson) || 0;
  const questionQueryKey = GetAssessmentQuestionsQueryKey(
    staffID,
    levelID
  );

  const questionsQuery = useQuery({
    queryKey: questionQueryKey,
    queryFn: () => GetAssessmentQuestions(staffID, levelID),
    enabled: Boolean(staffID) && levelID > 0,
    staleTime: 5 * 60 * 1000,
  });

  const questionData = questionsQuery.data ?? emptyQuestions;
  const test = questionData.test;
  const questions = questionData.questions;
  const loading =
    optionsQuery.isPending ||
    (Boolean(staffID) &&
      levelID > 0 &&
      questionsQuery.isPending);
  const requestError = optionsQuery.error || questionsQuery.error;
  const queryError =
    requestError instanceof Error
      ? requestError.message
      : requestError
        ? "Unable to load questions."
        : "";
  const error = actionError || queryError;

  function PickBranch(event) {
    setSelectedBranch(event.target.value);
    setSelected([]);
    setPage(1);
  }

  function PickLesson(event) {
    setSelectedLesson(event.target.value);
    setSelected([]);
    setPage(1);
  }

  function OpenAdd() {
    setCurrent(null);
    setNumber(questions.length + 1);
    setOpen(true);
  }

  function OpenEdit(question, questionNumber) {
    setCurrent(question);
    setNumber(questionNumber);
    setOpen(true);
  }

  function ClosePopup() {
    setCurrent(null);
    setNumber(0);
    setOpen(false);
  }

  async function RefreshQuestions() {
    setActionError("");

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: questionQueryKey,
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: teacherDashboardQueryKey,
      }),
    ]);
  }

  async function SaveQuestion(form) {
    if (form.text.length > limits.question) {
      throw new Error(`Question must be ${limits.question} characters or fewer.`);
    }

    if (form.choices.some((choice) => choice.length > limits.choice)) {
      throw new Error(`Each choice must be ${limits.choice} characters or fewer.`);
    }

    let activeTest = test;

    if (!activeTest) {
      const { data, error: testError } = await supabase
        .from("Assessment")
        .insert({
          staffID,
          levelID,
        })
        .select("assessmentID, levelID")
        .single();

      if (testError) {
        throw new Error("Unable to create the lesson assessment.");
      }

      activeTest = data;
    }

    const correct = form.choices[form.answer];
    const otherChoices = form.choices.filter(
      (_, index) => index !== form.answer
    );
    const payload = {
      assessmentID: activeTest.assessmentID,
      text: form.text,
      answer: correct,
      choice1: otherChoices[0],
      choice2: otherChoices[1],
      choice3: otherChoices[2],
    };

    const result = current
      ? await supabase
          .from("Question")
          .update(payload)
          .eq("questionID", current.questionID)
      : await supabase.from("Question").insert(payload);

    if (result.error) {
      throw new Error("Unable to save the question.");
    }

    await RefreshQuestions();
    setSelected([]);
    setPage(1);
    ClosePopup();
  }

  function SelectOne(questionID, isChecked) {
    if (isChecked) {
      setSelected((currentIDs) =>
        currentIDs.includes(questionID)
          ? currentIDs
          : [...currentIDs, questionID]
      );
      return;
    }

    setSelected((currentIDs) =>
      currentIDs.filter((id) => id !== questionID)
    );
  }

  function SelectAll(event) {
    if (event.target.checked) {
      setSelected(
        questions.map((question) => question.questionID)
      );
      return;
    }

    setSelected([]);
  }

  async function DeleteQuestions() {
    if (selected.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete the selected questions?"
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("Question")
      .delete()
      .in("questionID", selected);

    if (deleteError) {
      setActionError("Unable to delete the selected questions.");
      return;
    }

    await RefreshQuestions();
    setSelected([]);
    setPage(1);
  }

  const pages = Math.max(
    1,
    Math.ceil(questions.length / maxCards)
  );
  const activePage = Math.min(page, pages);
  const first = (activePage - 1) * maxCards;
  const shown = questions.slice(first, first + maxCards);
  const allChecked =
    questions.length > 0 &&
    questions.every((question) =>
      selected.includes(question.questionID)
    );

  return (
    <section className="questionspanel">
      <div className="questionsbox">
        <div className="questiontools">
          <select
            value={branch}
            onChange={PickBranch}
            aria-label="Question branch"
            disabled={branches.length === 0}
          >
            {branches.length === 0 && (
              <option value="">No branches</option>
            )}

            {branches.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={lesson}
            onChange={PickLesson}
            aria-label="Question lesson"
            disabled={lessons.length === 0}
          >
            {lessons.length === 0 && (
              <option value="">No lessons</option>
            )}

            {lessons.map((item, index) => (
              <option value={item.levelID} key={item.levelID}>
                Lesson {index + 1} ({item.levelName})
              </option>
            ))}
          </select>

          <label className="questionswitch">
            <span>Open Assessment</span>
            <input
              type="checkbox"
              aria-label="Open Assessment"
            />
            <span className="switchmark"></span>
          </label>

          <button
            type="button"
            className="questiondelete"
            disabled={selected.length === 0}
            onClick={DeleteQuestions}
          >
            Delete Selected
          </button>
        </div>

        <div className="questiongrid">
          {loading && (
            <p className="questionsnote">
              Loading questions...
            </p>
          )}

          {!loading && error && (
            <p className="questionsnote">{error}</p>
          )}

          {!loading && !error && shown.length === 0 && (
            <p className="questionsnote">
              No questions found.
            </p>
          )}

          {!loading &&
            !error &&
            shown.map((question, index) => (
              <QuestionCard
                key={question.questionID}
                question={question}
                number={first + index + 1}
                selected={selected.includes(
                  question.questionID
                )}
                onEdit={OpenEdit}
                onSelect={SelectOne}
              />
            ))}
        </div>

        <div className="questioncontrols">
          <label className="questioncheck">
            <input
              type="checkbox"
              checked={allChecked}
              disabled={questions.length === 0}
              onChange={SelectAll}
            />
            <span>Select All</span>
          </label>

          <div className="questionpager">
            <button
              type="button"
              aria-label="Previous page"
              disabled={activePage === 1}
              onClick={() =>
                setPage((currentPage) => currentPage - 1)
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
                setPage((currentPage) => currentPage + 1)
              }
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <div className="questionsside">
        <button
          type="button"
          className="questionsback"
          onClick={onBack}
        >
          View Scores &rarr;
        </button>

        <button
          type="button"
          className="questionadd"
          aria-label="Add question"
          disabled={!lesson || !staffID}
          onClick={OpenAdd}
        >
          +
        </button>
      </div>

      {open && (
        <QuestionPopup
          question={current}
          number={number}
          onClose={ClosePopup}
          onSave={SaveQuestion}
        />
      )}
    </section>
  );
}

export default Questions;
