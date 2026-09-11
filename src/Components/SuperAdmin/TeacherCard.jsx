import "../../css/StudentCard.css";
import teacherImage from "../../assets/pfp.png";

function TeacherCard({ teacher, isSelected, onSelect }) {
    const sectionNames = (teacher.sections ?? [])
        .map((section) => section.sectionName)
        .filter(Boolean);
    const sectionText = sectionNames.length > 0
        ? sectionNames.join(", ")
        : "No sections handled";

    return (
        <article className="studentcard teachercard">
            <img
                className="studentcardimage"
                src={teacherImage}
                alt={`${teacher.firstName} ${teacher.lastName}`}
            />

            <div className="studentinformation">
                <h3>
                    {teacher.lastName}, {teacher.firstName}
                </h3>
                <p title={teacher.username}>
                    Username: {teacher.username || "No login email"}
                </p>
                <p title={sectionText}>
                    Sections Handled: {sectionText}
                </p>
            </div>

            <input
                className="studentcheckbox"
                type="checkbox"
                checked={isSelected}
                aria-label={`Select ${teacher.firstName} ${teacher.lastName}`}
                onChange={(event) =>
                    onSelect(
                        teacher.staffID,
                        event.target.checked
                    )
                }
            />
        </article>
    );
}

export default TeacherCard;
