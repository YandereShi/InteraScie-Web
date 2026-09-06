import "../../css/Login.css";
import superadminImage from "../../assets/SuperAdmin.png";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

function SuperAdminLogin({ showTeacher }) {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginMessage, setLoginMessage] = useState("");
    const [lockedSeconds, setLockedSeconds] = useState(0);

    useEffect(() => {
        if (lockedSeconds <= 0) {
            return;
        }

        const timer = window.setTimeout(() => {
            setLockedSeconds((seconds) =>
                Math.max(seconds - 1, 0)
            );
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [lockedSeconds]);

    async function HandleSuperAdminLogin(event) {
        event.preventDefault();

        if (isLoading || lockedSeconds > 0) {
            return;
        }

        setIsLoading(true);
        setLoginMessage("");

        try {
            const formData = new FormData(
                event.currentTarget
            );

            const email = String(
                formData.get("email")
            );

            const password = String(
                formData.get("password")
            );

            const {
                data: loginData,
                error: loginError,
            } = await supabase.functions.invoke(
                "teacherlogin",
                {
                    body: {
                        email,
                        password,
                        expectedRole: "superadmin",
                    },
                }
            );

            if (loginError) {
                let errorMessage =
                    "Unable to log in. Please try again.";

                if (loginError.context) {
                    try {
                        const errorData =
                            await loginError.context.json();

                        errorMessage =
                            errorData.error ||
                            errorData.message ||
                            errorMessage;
                    } catch {
                        errorMessage =
                            loginError.message ||
                            errorMessage;
                    }
                }

                if (
                    errorMessage.startsWith(
                        "Too many failed attempts"
                    )
                ) {
                    setLoginMessage("");
                    setLockedSeconds(30);
                } else {
                    setLoginMessage(errorMessage);
                }

                return;
            }

            if (
                !loginData?.accessToken ||
                !loginData?.refreshToken
            ) {
                throw new Error();
            }

            const { error: sessionError } =
                await supabase.auth.setSession({
                    access_token:
                        loginData.accessToken,
                    refresh_token:
                        loginData.refreshToken,
                });

            if (sessionError) {
                throw sessionError;
            }

            navigate("/superadmin", {
                replace: true,
            });
        } catch {
            setLoginMessage(
                "An error has occurred. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    }

    const displayMessage =
        lockedSeconds > 0
            ? `Too many failed attempts. Try again in ${lockedSeconds} seconds.`
            : loginMessage;

    return (
        <>
            <div className="loginheaders">
                <img
                    className="superadminicon"
                    src={superadminImage}
                    alt="Super Admin icon"
                />

                <h2 className="loginpaneltext">
                    Login
                </h2>
            </div>

            <div className="loginform">
                <form
                    onSubmit={HandleSuperAdminLogin}
                >
                    <label
                        htmlFor="adminemail"
                        className="logintext"
                    >
                        Email
                    </label>

                    <input
                        type="email"
                        id="adminemail"
                        name="email"
                        placeholder="example@gmail.com"
                        autoComplete="email"
                        required
                        disabled={isLoading}
                    />

                    <label
                        htmlFor="adminpassword"
                        className="logintext"
                    >
                        Password
                    </label>

                    <div className="passwordfield">
                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            id="adminpassword"
                            name="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            required
                            disabled={isLoading}
                        />

                        <button
                            type="button"
                            className="passwordeye"
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                            title={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                            disabled={isLoading}
                        >
                            {showPassword
                                ? <FaEye />
                                : <FaEyeSlash />}
                        </button>
                    </div>

                    {displayMessage && (
                        <p
                            className="loginmessage"
                            role="alert"
                        >
                            {displayMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="loginbutton"
                        disabled={
                            isLoading ||
                            lockedSeconds > 0
                        }
                    >
                        {isLoading
                            ? "Logging in..."
                            : "Log in"}
                    </button>

                    <a
                        className="roleswitchlink"
                        href="#"
                        onClick={(event) => {
                            event.preventDefault();

                            if (!isLoading) {
                                showTeacher();
                            }
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
