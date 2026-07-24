import "./TeacherSideBar.css";
import InteraScie from "../assets/InteraScie.png";
import teacherPfp from "../assets/pfp.png";

function TeacherSideBar() {
    return (
        <aside className="teachersidebar">
            <img src={InteraScie} alt="InteraScie Logo" id="interascielogo" />
            <img src={teacherPfp} alt="Teacher Icon" id="teacherpfp" />
            <h2>Firstname, Lastname</h2>
            <h4>Teacher</h4>

        <ul className="sidebarlist">
            <li>
                <button type="button">Dashboard</button>
            </li>
            <li>
                <button type="button">Students</button>
            </li>
            <li>
                <button type="button">Section</button>
            </li>
            <li>
                <button type="button">Assessment</button>
            </li>
            <li>
                <button type="button">Progress</button>
            </li>
        </ul>
        </aside>
    )
}

export default TeacherSideBar;