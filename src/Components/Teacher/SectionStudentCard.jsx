import studentImage from "../../assets/pfp.png";
import ProfilePhoto from "../ProfilePhoto";
import { GetStudentPhotoPath } from "../../lib/profilePhotos";

function SectionStudentCard({ student, isSelected, onSelect }) {
  return (
    <label className="sectionstudentcard">
      <ProfilePhoto
        className="sectionstudentphoto"
        path={GetStudentPhotoPath(student.studentID)}
        fallback={studentImage}
        alt=""
      />

      <span className="sectionstudentname" title={`${student.lastName}, ${student.firstName}`}>
        {student.lastName}, {student.firstName}
      </span>

      <input
        className="sectionstudentcheckbox"
        type="checkbox"
        checked={isSelected}
        aria-label={`Select ${student.firstName} ${student.lastName}`}
        onChange={(event) => onSelect(student.studentID, event.target.checked)}
      />
    </label>
  );
}

export default SectionStudentCard;
