import "../css/QuestionPopup.css";
import { useState } from "react";

function QuestionPopup({
  question,
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

  function changeChoice(index, value) {
    setChoices((current) =>
      current.map((choice, choiceIndex) =>
        choiceIndex === index ? value : choice
      )
    );
  }

  async function submit(event) {
    event.preventDefault();

    const cleanText = text.trim();
    const cleanChoices = choices.map((choice) =>
      choice.trim()
    );

    if (!cleanText || cleanChoices.some((choice) => !choice)) {
      setError("Enter the question and all four choices.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({
        text: cleanText,
        choices: cleanChoices,
        answer,
      });
    } catch (saveError) {
      console.error(saveError.message);
      setError(saveError.message);
      setSaving(false);
    }
  }

  return (
    <div
      className="questionoverlay"
      onMouseDown={onClose}
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
            onClick={onClose}
          >
            x
          </button>
        </div>

        <form onSubmit={submit}>
          <textarea
            className="questioninput"
            placeholder="Type the question..."
            value={text}
            maxLength={500}
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
                  name="correct-answer"
                  checked={answer === index}
                  aria-label={`Mark choice ${index + 1} as correct`}
                  onChange={() => setAnswer(index)}
                />

                <input
                  type="text"
                  placeholder={`Choice ${index + 1}`}
                  value={choice}
                  maxLength={200}
                  onChange={(event) =>
                    changeChoice(index, event.target.value)
                  }
                />
              </label>
            ))}
          </div>

          {error && (
            <p className="questionpopuperror">{error}</p>
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
