import "../../css/SuperAdminSidebar.css";
import InteraScie from "../../assets/InteraScie.png";
import superAdminPfp from "../../assets/pfp.png";
import { NavLink } from "react-router";
import { FaChalkboardTeacher, FaHome } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { useState } from "react";
import StaffProfilePopup from "../StaffProfilePopup";

function SuperAdminSidebar({ superadmin }) {
    const [profileOpen, SetProfileOpen] = useState(false);

    return (
        <aside className="superadminsidebar">
            <img
                className="superadminlogo"
                src={InteraScie}
                alt="InteraScie Logo"
            />

            <button type="button" className="staffprofiletrigger" aria-label="Open my profile" onClick={() => SetProfileOpen(true)}>
                <img className="superadminpfp" src={superAdminPfp} alt="" />
            </button>

            <h2>
                {superadmin.firstName} {superadmin.lastName}
            </h2>
            <h4>Super Admin</h4>

            <ul className="superadminnavlist">
                <li>
                    <NavLink className="superadminnavlink" to="/superadmin" end>
                        <FaHome className="superadminnavicon" />
                        <span>Dashboard</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink className="superadminnavlink" to="/superadmin/students">
                        <IoPerson className="superadminnavicon" />
                        <span>Students</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink className="superadminnavlink" to="/superadmin/sections">
                        <FaPeopleGroup className="superadminnavicon" />
                        <span>Sections</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink className="superadminnavlink" to="/superadmin/teachers">
                        <FaChalkboardTeacher className="superadminnavicon" />
                        <span>Teachers</span>
                    </NavLink>
                </li>
                <li className="staffmobileprofileitem">
                    <button type="button" className="staffmobileprofilebutton" aria-label="Open my profile" onClick={() => SetProfileOpen(true)}>
                        <img src={superAdminPfp} alt="" />
                    </button>
                </li>
            </ul>
            {profileOpen && <StaffProfilePopup staff={superadmin} onclose={() => SetProfileOpen(false)} />}
        </aside>
    );
}

export default SuperAdminSidebar;
