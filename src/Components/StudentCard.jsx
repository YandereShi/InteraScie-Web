import "../css/StudentCard.css";
import studentImage from "../assets/pfp.png";

function StudentCard({
  student,
  onEdit,
  isSelected,
  onSelect,
}) {
  return (
    <article className="studentcard" onClick={() => onEdit(student)}>
      <img
        className="studentcardimage"
        src={studentImage}
        alt={`${student.firstName} ${student.lastName}`}
      />

      <div className="studentinformation">
        <h3>
          {student.lastName}, {student.firstName} 
        </h3>
        <p>Username: {student.username}</p>
        <p>Section: {student.section}</p>
      </div>

      <input
        className="studentcheckbox"
        type="checkbox"
        checked={isSelected}
        aria-label={`Select ${student.firstName} ${student.lastName}`}
        onChange={(event) =>
          onSelect(
            student.studentID,
            event.target.checked
          )
        }
        onClick={(event) => event.stopPropagation()}
      />
    </article>
  );
}

export default StudentCard;
