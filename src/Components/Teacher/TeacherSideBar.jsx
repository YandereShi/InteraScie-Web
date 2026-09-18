import "../../css/TeacherSideBar.css";
import InteraScie from "../../assets/InteraScie.png";
import teacherPfp from "../../assets/pfp.png";
import { NavLink } from "react-router";
import { FaHome, FaPen } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { TbProgressCheck } from "react-icons/tb";
import { useState } from "react";
import StaffProfilePopup from "../StaffProfilePopup";
import ProfilePhoto from "../ProfilePhoto";
import { GetStaffPhotoPath } from "../../lib/profilePhotos";

function TeacherSidebar({ teacher }) {
    const [profileOpen, SetProfileOpen] = useState(false);

    return (
        <aside className="teachersidebar">
            <img src={InteraScie} alt="InteraScie Logo" id="interascielogo" />
            <button type="button" className="staffprofiletrigger" aria-label="Open my profile" onClick={() => SetProfileOpen(true)}>
                <ProfilePhoto path={GetStaffPhotoPath(teacher.authUserID)} fallback={teacherPfp} alt="" id="teacherpfp" />
            </button>
            <h2>
                {teacher.firstName} {teacher.lastName}
            </h2>
            <h4>{teacher.role}</h4>

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
            <li className="staffmobileprofileitem">
                <button type="button" className="staffmobileprofilebutton" aria-label="Open my profile" onClick={() => SetProfileOpen(true)}>
                    <ProfilePhoto path={GetStaffPhotoPath(teacher.authUserID)} fallback={teacherPfp} alt="" />
                </button>
            </li>
        </ul>
        {profileOpen && <StaffProfilePopup staff={teacher} onclose={() => SetProfileOpen(false)} />}
        </aside>
    )
}

export default TeacherSidebar;
