import "../css/Login.css";
import loginImage from "../assets/Login.png";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ForgotPasswordPopup from "./ForgotPasswordPopup";
import { limits } from "../lib/inputLimits";
import { emailPattern, GetEmailError, NormalizeEmail } from "../lib/emailValidation";
import { supabase } from "../lib/supabase";
import { GetRememberMe, SaveRememberMe } from "../lib/authStorage";
import { useLocation, useNavigate } from "react-router";
import { CheckStaffSession } from "../lib/staffQueries";
import interascie from "../assets/InteraScie.png";
import interalogo from "../assets/interalogo.png";
import PlayImage from "../assets/play.png";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [ShowPassword, SetShowPassword] = useState(false);
  const [IsLoading, SetIsLoading] = useState(false);
  const [LoginMessage, SetLoginMessage] = useState(location.state?.loginMessage ?? "");
  const [LockedSeconds, SetLockedSeconds] = useState(0);
  const [ShowGame, SetShowGame] = useState(false);
  const [forgotpassword, SetForgotPassword] = useState(false);
  const [RememberMe, SetRememberMe] = useState(false);
  const [CheckingSession, SetCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function RestoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session || cancelled) {
          return;
        }

        await CheckStaffSession();

        const { data: staff, error: staffError } = await supabase
          .from("SchoolStaff")
          .select("role")
          .eq("authUserID", data.session.user.id)
          .maybeSingle();

        if (!cancelled && !staffError && ["teacher", "superadmin"].includes(staff?.role)) {
          navigate(staff.role === "superadmin" ? "/superadmin" : "/teacher", { replace: true });
        }
      } catch (error) {
        if (!cancelled && error?.code === "AUTH_REQUIRED") {
          SetLoginMessage(error.message);
          await supabase.auth.signOut({ scope: "local" }).catch(() => null);
          queryClient.clear();
        }
      } finally {
        if (!cancelled) {
          SetCheckingSession(false);
        }
      }
    }

    void RestoreSession();

    return () => {
      cancelled = true;
    };
  }, [navigate, queryClient]);

  useEffect(() => {
    if (LockedSeconds <= 0) {
      return;
    }

    const Timer = window.setTimeout(() => {
      SetLockedSeconds((CurrentSeconds) => Math.max(CurrentSeconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(Timer);
  }, [LockedSeconds]);

  async function HandleLogin(event) {
    event.preventDefault();

    if (IsLoading || CheckingSession || LockedSeconds > 0) {
      return;
    }

    SetIsLoading(true);
    SetLoginMessage("");

    try {
      const FormDataValue = new FormData(event.currentTarget);
      const Email = NormalizeEmail(FormDataValue.get("email"));
      const Password = String(FormDataValue.get("password"));

      const emailError = GetEmailError(Email);
      if (emailError) {
        SetLoginMessage(emailError);
        return;
      }
      if (Password.length > limits.loginpassword) {
        SetLoginMessage(`Password must be ${limits.loginpassword} characters or fewer.`);
        return;
      }

      const { data: LoginData, error: LoginError } = await supabase.functions.invoke(
        "teacherlogin",
        {
          body: {
            email: Email,
            password: Password,
          },
        }
      );

      if (LoginError) {
        let ErrorMessage = "Unable to log in. Please try again.";

        if (LoginError.context) {
          try {
            const ErrorData = await LoginError.context.json();
            ErrorMessage = ErrorData.error || ErrorData.message || ErrorMessage;
          } catch {
            ErrorMessage = LoginError.message || ErrorMessage;
          }
        }

        if (ErrorMessage.startsWith("Too many failed attempts")) {
          SetLoginMessage("");
          SetLockedSeconds(30);
        } else {
          SetLoginMessage(ErrorMessage);
        }
        return;
      }

      if (!LoginData?.accessToken || !LoginData?.refreshToken || !["teacher", "superadmin"].includes(LoginData?.role)) {
        throw new Error();
      }

      const previousRememberMe = GetRememberMe();
      SaveRememberMe(RememberMe);

      try {
        const { error: SessionError } = await supabase.auth.setSession({
          access_token: LoginData.accessToken,
          refresh_token: LoginData.refreshToken,
        });

        if (SessionError) {
          throw SessionError;
        }
      } catch (sessionError) {
        SaveRememberMe(previousRememberMe);
        throw sessionError;
      }

      queryClient.clear();
      navigate(LoginData.role === "superadmin" ? "/superadmin" : "/teacher", { replace: true });
    } catch {
      SetLoginMessage("An error has occurred. Please try again.");
    } finally {
      SetIsLoading(false);
    }
  }

  const DisplayMessage = LockedSeconds > 0
    ? `Too many failed attempts. Try again in ${LockedSeconds} seconds.` : LoginMessage;

  return (
    <>
        <div className="mainbackground">
            <div className="loginbox">
                <div className={`gameside ${ShowGame ? "mobilevisible" : ""}`}>
                  <div className="gameheader">
                    <h1>Welcome to</h1>
                    <img className="gameicon" src={interascie} alt="Game background" />
                  </div>

                  <div className="gamesidelogo">
                    <img src={interalogo} alt="Game logo" />
                  </div>

                  <div className="gamesidebutton">
                    <button className="playbutton" type="button" onClick={() => navigate("/download")}>
                      <img src={PlayImage} alt="Play Now" />
                    </button>

                    <h3>Science is No Longer Just a Subject, It's an Experience </h3>
                  </div>

                  <button
                    className="mobilegamelink"
                    type="button"
                    onClick={() => SetShowGame(false)}
                  >
                    Back to login
                  </button>
                </div>

                <div className={`loginside ${ShowGame ? "mobilehidden" : ""}`}>
                    <div className="loginheaders">
                      <img className="loginheaderimage" src={loginImage} alt="Login" />
                    </div>

                    <div className="loginform">
                      <form onSubmit={HandleLogin}>
                        <label htmlFor="email" className="logintext">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="Example@gmail.com"
                          autoComplete="email"
                          maxLength={limits.email}
                          pattern={emailPattern}
                          required
                        />

                        <label htmlFor="password" className="logintext">Password</label>
                        <div className="passwordfield">
                          <input
                            type={ShowPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            maxLength={limits.loginpassword}
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

                        <div className="loginoptions">
                          <label className="loginremember">
                            <input
                              className="loginremembercheckbox"
                              type="checkbox"
                              name="rememberMe"
                              checked={RememberMe}
                              disabled={IsLoading || CheckingSession}
                              onChange={(event) => SetRememberMe(event.target.checked)}
                            />
                            <span>Remember me</span>
                          </label>
                          <button type="button" className="forgotpasswordlink" onClick={() => SetForgotPassword(true)}>
                            Forgot Password
                          </button>
                        </div>

                        {DisplayMessage && (
                          <p className="loginmessage" role="alert">{DisplayMessage}</p>
                        )}

                        <button
                          type="submit"
                          className="loginbutton"
                          disabled={IsLoading || CheckingSession || LockedSeconds > 0}
                        >
                          {IsLoading ? "Logging in..." : CheckingSession ? "Checking session..." : LockedSeconds > 0 ? "Login locked" : "Log in"}
                        </button>
                      </form>
                    </div>
                  <button
                    className="mobilegamelink"
                    type="button"
                    onClick={() => SetShowGame(true)}
                  >
                    Play the game
                  </button>
                </div>
            </div>    
        </div>
        {forgotpassword && <ForgotPasswordPopup onclose={() => SetForgotPassword(false)} />}
    </>
    
  );
}

export default Login;
