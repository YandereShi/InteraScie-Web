import "../css/QuestionCard.css";

function QuestionCard({
  question,
  number,
  selected,
  onEdit,
  onSelect,
}) {
  const choices = [
    question.answer,
    question.choice1,
    question.choice2,
    question.choice3,
  ];

  return (
    <article
      className="questioncard"
      onClick={() => onEdit(question, number)}
    >
      <div className="questioncardhead">
        <h3>Question #{number}</h3>

        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select question ${number}`}
          onChange={(event) =>
            onSelect(
              question.questionID,
              event.target.checked
            )
          }
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      <p className="questiontext">{question.text}</p>

      <div className="questionchoices">
        {choices.map((choice, index) => (
          <div className="questionchoice" key={index}>
            <span
              className={index === 0 ? "correctchoice" : ""}
            ></span>
            <span>{choice}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default QuestionCard;
