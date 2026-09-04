import "../css/Login.css";
import superadminImage from "../assets/SuperAdmin.png";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function SuperAdminLogin({ showTeacher }) {
    const [ShowPassword, SetShowPassword] = useState(false);

    function ClickSuperAdmin(event) {
        event.preventDefault();

    }

    return (
        <>
            <div className="loginheaders">
                <img className="superadminicon" src={superadminImage} alt="Super Admin icon" />
                <h2 className="loginpaneltext">Login</h2>
            </div>

            <div className="loginform">
                <form onSubmit={ClickSuperAdmin}>
                <label htmlFor="admin-email" className="logintext">
                    Email
                </label>

                <input
                    type="email"
                    id="admin-email"
                    name="email"
                    placeholder="example@gmail.com"
                    autoComplete="email"
                    required
                />

                <label htmlFor="admin-password" className="logintext">
                    Password
                </label>

                <div className="passwordfield">
                    <input
                        type={ShowPassword ? "text" : "password"}
                        id="admin-password"
                        name="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="button"
                        className="passwordeye"
                        onClick={() => SetShowPassword(!ShowPassword)}
                        title={ShowPassword ? "Hide password" : "Show password"}
                    >
                        {ShowPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                </div>

                <button type="submit" className="loginbutton">
                    Log in
                </button>

                <a
                    className="roleswitchlink"
                    href="#"
                    onClick={(event) => {
                    event.preventDefault();
                    showTeacher();
                    }}
                >
                    Teacher?
                </a>
                </form>
            </div>
        </>
    );
}

export default SuperAdminLogin;
