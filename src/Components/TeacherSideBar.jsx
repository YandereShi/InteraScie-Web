import "../css/TeacherSideBar.css";
import InteraScie from "../assets/InteraScie.png";
import teacherPfp from "../assets/pfp.png";
import { NavLink } from "react-router";
import { FaHome, FaPen } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { TbProgressCheck } from "react-icons/tb";

function TeacherSidebar() {
    return (
        <aside className="teachersidebar">
            <img src={InteraScie} alt="InteraScie Logo" id="interascielogo" />
            <img src={teacherPfp} alt="Teacher Icon" id="teacherpfp" />
            <h2>Firstname, Lastname</h2>
            <h4>Teacher</h4>

        <ul className="sidebarlist">
            <li>
                <NavLink className="navlink" to="/teacher" end>
                    <FaHome className="sidebaricon" />
                    <span>Dashboard</span>
                </NavLink>
            </li>
            <li>
                <NavLink className="navlink" to="/teacher/students" >
                    <IoPerson className="sidebaricon" />
                    <span>Students</span>
                </NavLink>
            </li>
            <li>
                <NavLink className="navlink" to="/teacher/sections" >
                    <FaPeopleGroup className="sidebaricon" />
                    <span>Sections</span>
                </NavLink>
            </li>
            <li>
                <NavLink className="navlink"to="/teacher/assessments" >
                    <FaPen className="sidebaricon" />
                    <span>Assessments</span>
                </NavLink>
            </li>
            <li>
                <NavLink className="navlink" to="/teacher/progress" >
                    <TbProgressCheck className="sidebaricon" />
                    <span>Progress</span>
                </NavLink>
            </li>
        </ul>
        </aside>
    )
}

export default TeacherSidebar;
