import "../css/StudentCard.css";
import studentImage from "../assets/pfp.png";

function StudentCard({ student }) {
  return (
    <article className="studentcard">
      <img
        className="studentcardimage"
        src={studentImage}
        alt={`${student.firstName} ${student.lastName}`}
      />

      <div className="studentinformation">
        <h3>
          {student.firstName} {student.lastName}
        </h3>
        <p>Username: {student.username}</p>
        <p>Section: {student.section}</p>
      </div>

      <input
        className="studentcheckbox"
        type="checkbox"
        aria-label={`Select ${student.firstName} ${student.lastName}`}
      />
    </article>
  );
}

export default StudentCard;
