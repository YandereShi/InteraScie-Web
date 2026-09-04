import "../css/Questions.css";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import QuestionCard from "./QuestionCard";
import QuestionPopup from "./QuestionPopup";
import { limits } from "../lib/inputLimits";

const maxCards = 6;

function Questions({ onBack }) {
  const [levels, setLevels] = useState([]);
  const [branch, setBranch] = useState("");
  const [lesson, setLesson] = useState("");
  const [staff, setStaff] = useState("");
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [current, setCurrent] = useState(null);
  const [number, setNumber] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

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

    const { data, error: levelError } = await supabase
      .from("Level")
      .select("levelID, levelName, branchName")
      .order("branchName", { ascending: true })
      .order("levelID", { ascending: true });

    if (levelError) {
      console.error(levelError.message);
      setError("Unable to load branches and lessons.");
      setLoading(false);
      setReady(true);
      return;
    }

    const levelList = data ?? [];
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
    const firstBranch = branchList[0];
    const firstLesson = levelList.find(
      (item) => item.branchName === firstBranch
    );

    setStaff(staffData.staffID);
    setLevels(levelList);
    setBranch(firstBranch ?? "");
    setLesson(String(firstLesson?.levelID ?? ""));
    setReady(true);

    if (!firstBranch || !firstLesson) {
      setLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    if (!ready) {
      return;
    }

    if (!lesson || !staff) {
      setTest(null);
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: testData, error: testError } =
      await supabase
        .from("Assessment")
        .select("assessmentID, levelID")
        .eq("staffID", staff)
        .eq("levelID", lesson)
        .order("assessmentID", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (testError) {
      console.error(testError.message);
      setError("Unable to load the lesson assessment.");
      setLoading(false);
      return;
    }

    setTest(testData ?? null);

    if (!testData) {
      setQuestions([]);
      setSelected([]);
      setPage(1);
      setLoading(false);
      return;
    }

    const { data, error: questionError } = await supabase
      .from("Question")
      .select(`
        questionID,
        assessmentID,
        text,
        answer,
        choice1,
        choice2,
        choice3
      `)
      .eq("assessmentID", testData.assessmentID)
      .order("questionID", { ascending: true });

    if (questionError) {
      console.error(questionError.message);
      setError("Unable to load questions.");
      setLoading(false);
      return;
    }

    const loadedQuestions = data ?? [];
    const loadedPages = Math.max(
      1,
      Math.ceil(loadedQuestions.length / maxCards)
    );

    setQuestions(loadedQuestions);
    setSelected([]);
    setPage((currentPage) =>
      Math.min(currentPage, loadedPages)
    );
    setLoading(false);
  }, [lesson, ready, staff]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPage();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadQuestions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadQuestions]);

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

  const lessons = levels.filter(
    (item) => item.branchName === branch
  );

  function pickBranch(event) {
    const value = event.target.value;
    const firstLesson = levels.find(
      (item) => item.branchName === value
    );

    setBranch(value);
    setLesson(String(firstLesson?.levelID ?? ""));
    setSelected([]);
    setPage(1);
  }

  function pickLesson(event) {
    setLesson(event.target.value);
    setSelected([]);
    setPage(1);
  }

  function openAdd() {
    setCurrent(null);
    setNumber(questions.length + 1);
    setOpen(true);
  }

  function openEdit(question, questionNumber) {
    setCurrent(question);
    setNumber(questionNumber);
    setOpen(true);
  }

  function closePopup() {
    setCurrent(null);
    setNumber(0);
    setOpen(false);
  }

  async function saveQuestion(form) {
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
          staffID: staff,
          levelID: Number(lesson),
        })
        .select("assessmentID, levelID")
        .single();

      if (testError) {
        console.error(testError.message);
        throw new Error("Unable to create the lesson assessment.");
      }

      activeTest = data;
      setTest(data);
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
      console.error(result.error.message);
      throw new Error("Unable to save the question.");
    }

    await loadQuestions();
    closePopup();
  }

  function selectOne(questionID, isChecked) {
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

  function selectAll(event) {
    if (event.target.checked) {
      setSelected(
        questions.map((question) => question.questionID)
      );
      return;
    }

    setSelected([]);
  }

  async function deleteQuestions() {
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
      console.error(deleteError.message);
      setError("Unable to delete the selected questions.");
      return;
    }

    setSelected([]);
    await loadQuestions();
  }

  const pages = Math.max(
    1,
    Math.ceil(questions.length / maxCards)
  );
  const first = (page - 1) * maxCards;
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
            onChange={pickBranch}
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
            onChange={pickLesson}
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
            onClick={deleteQuestions}
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
                onEdit={openEdit}
                onSelect={selectOne}
              />
            ))}
        </div>

        <div className="questioncontrols">
          <label className="questioncheck">
            <input
              type="checkbox"
              checked={allChecked}
              disabled={questions.length === 0}
              onChange={selectAll}
            />
            <span>Select All</span>
          </label>

          <div className="questionpager">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() =>
                setPage((currentPage) => currentPage - 1)
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
          disabled={!lesson || !staff}
          onClick={openAdd}
        >
          +
        </button>
      </div>

      {open && (
        <QuestionPopup
          question={current}
          number={number}
          onClose={closePopup}
          onSave={saveQuestion}
        />
      )}
    </section>
  );
}

export default Questions;
