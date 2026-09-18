import "../../css/StudentCard.css";
import teacherImage from "../../assets/pfp.png";
import ProfilePhoto from "../ProfilePhoto";
import { GetStaffPhotoPath } from "../../lib/profilePhotos";

function TeacherCard({ teacher, isSelected, onSelect, onEdit }) {
    const sectionNames = (teacher.sections ?? [])
        .map((section) => section.sectionName)
        .filter(Boolean);
    const sectionText = sectionNames.length > 0
        ? sectionNames.join(", ")
        : "No sections handled";

    function HandleKeyDown(event) {
        if (
            event.target === event.currentTarget &&
            (event.key === "Enter" || event.key === " ")
        ) {
            event.preventDefault();
            onEdit(teacher);
        }
    }

    return (
        <article
            className="studentcard teachercard"
            role="button"
            tabIndex="0"
            onClick={() => onEdit(teacher)}
            onKeyDown={HandleKeyDown}
        >
            <ProfilePhoto
                className="studentcardimage"
                path={GetStaffPhotoPath(teacher.authUserID)}
                fallback={teacherImage}
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
                onClick={(event) => event.stopPropagation()}
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
