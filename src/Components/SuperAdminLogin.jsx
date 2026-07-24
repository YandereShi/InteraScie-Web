import "./Login.css";
import superadminImage from "../assets/SuperAdmin.png";

function SuperAdminLogin({ showTeacher }) {
    function ClickSuperAdmin(event) {
        event.preventDefault();

    }

    return (
        <>
            <div className="loginheaders">
                <img className="superadminicon" src={superadminImage} alt="Super Admin icon" />
                <h2>Login</h2>
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

                <input
                    type="password"
                    id="admin-password"
                    name="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                />

                <a href="#">Forgot Password</a>

                <button type="submit" className="loginbutton">
                    Log in
                </button>

                <a
                    href="#"
                    onClick={(event) => {
                    event.preventDefault();
                    showTeacher();
                    }}
                >
                    Teacher Login?
                </a>
                </form>
            </div>
        </>
    );
}

export default SuperAdminLogin;