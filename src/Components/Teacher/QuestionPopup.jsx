import "../../css/QuestionPopup.css";
import { useRef, useState } from "react";
import { limits } from "../../lib/inputLimits";
import { GetQuestionError } from "../../lib/questionImport";
import { useActionPending } from "../../lib/useActionPending";

function QuestionPopup({
  question,
  questions,
  number,
  onClose,
  onSave,
}) {
  const [text, setText] = useState(question?.text ?? "");
  const [choices, setChoices] = useState(
    question
      ? [
          question.answer,
          question.choice1,
          question.choice2,
          question.choice3,
        ]
      : ["", "", "", ""]
  );
  const [answer, setAnswer] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savePending = useRef(false);
  useActionPending(saving);

  function ClosePopup() {
    if (!savePending.current) onClose();
  }

  function ChangeChoice(index, value) {
    setChoices((current) =>
      current.map((choice, choiceIndex) =>
        choiceIndex === index ? value : choice
      )
    );
  }

  async function Submit(event) {
    event.preventDefault();
    if (savePending.current) return;

    const cleanText = text.trim();
    const cleanChoices = choices.map((choice) =>
      choice.trim()
    );

    const message = GetQuestionError({ text: cleanText, choices: cleanChoices, answer }, questions, question?.questionID ?? null);
    if (message) {
      setError(message);
      return;
    }

    savePending.current = true;
    setSaving(true);
    setError("");

    try {
      await onSave({
        text: cleanText,
        choices: cleanChoices,
        answer,
      });
    } catch (saveError) {
      console.error(saveError?.message);
      setError(saveError?.message || "Unable to save the question. Please try again.");
    } finally {
      savePending.current = false;
      setSaving(false);
    }
  }

  return (
    <div
      className="questionoverlay"
      onMouseDown={ClosePopup}
    >
      <div
        className="questionpopup"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="questionpopuphead">
          <h2>
            {question ? `Question #${number}` : "New Question"}
          </h2>

          <button
            type="button"
            aria-label="Close popup"
            onClick={ClosePopup}
            disabled={saving}
          >
            x
          </button>
        </div>

        <form onSubmit={Submit} aria-busy={saving}>
          <textarea
            className="questioninput"
            placeholder="Type the question..."
            value={text}
            maxLength={limits.question}
            disabled={saving}
            autoFocus
            onChange={(event) =>
              setText(event.target.value)
            }
          />

          <div className="choiceinputs">
            {choices.map((choice, index) => (
              <label className="choiceinput" key={index}>
                <input
                  type="radio"
                  disabled={saving}
                  name="correct-answer"
                  checked={answer === index}
                  aria-label={`Mark choice ${index + 1} as correct`}
                  onChange={() => setAnswer(index)}
                />

                <input
                  type="text"
                  disabled={saving}
                  placeholder={`Choice ${index + 1}`}
                  value={choice}
                  maxLength={limits.choice}
                  onChange={(event) =>
                    ChangeChoice(index, event.target.value)
                  }
                />
              </label>
            ))}
          </div>

          {error && (
            <p className="questionpopuperror" role="alert">{error}</p>
          )}

          <div className="questionpopupactions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionPopup;
