import "../css/Login.css";
import teacherImage from "../assets/teacher.png";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SuperAdminLogin from "./SuperAdminLogin";
import ForgotPasswordPopup from "./ForgotPasswordPopup";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router";
import interascie from "../assets/InteraScie.png";
import interalogo from "../assets/interalogo.png";
import PlayImage from "../assets/play.png";

function Login() {
  const navigate = useNavigate();
  const [ShowPassword, SetShowPassword] = useState(false);
  const [IsLoading, SetIsLoading] = useState(false);
  const [LoginType, SetLoginType] = useState("teacher");
  const [LoginMessage, SetLoginMessage] = useState("");
  const [LockedSeconds, SetLockedSeconds] = useState(0);
  const [ShowGame, SetShowGame] = useState(false);
  const [forgotpassword, SetForgotPassword] = useState(false);

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

    if (IsLoading || LockedSeconds > 0) {
      return;
    }

    SetIsLoading(true);
    SetLoginMessage("");

    try {
      const FormDataValue = new FormData(event.currentTarget);
      const Email = String(FormDataValue.get("email"));
      const Password = String(FormDataValue.get("password"));

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

      if (!LoginData?.accessToken || !LoginData?.refreshToken) {
        throw new Error();
      }

      const { error: SessionError } = await supabase.auth.setSession({
        access_token: LoginData.accessToken,
        refresh_token: LoginData.refreshToken,
      });

      if (SessionError) {
        throw SessionError;
      }

      navigate("/teacher", { replace: true });
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
                  {LoginType === "teacher" ? (
                  <>
                    <div className="loginheaders">
                      <img className="teachericon" src={teacherImage} alt="Teacher icon" />
                      <h2 className="loginpaneltext">Login</h2>
                    </div>

                    <div className="loginform">
                      <form onSubmit={HandleLogin}>
                        <label htmlFor="email" className="logintext">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="example@gmail.com"
                          autoComplete="email"
                          required
                        />

                        <label htmlFor="password" className="logintext">Password</label>
                        <div className="passwordfield">
                          <input
                            type={ShowPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            placeholder="Password"
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

                        <button type="button" className="forgotpasswordlink" onClick={() => SetForgotPassword(true)}>
                          Forgot Password
                        </button>

                        {DisplayMessage && (
                          <p className="loginmessage" role="alert">{DisplayMessage}</p>
                        )}

                        <button
                          type="submit"
                          className="loginbutton"
                          disabled={IsLoading || LockedSeconds > 0}
                        >
                          {IsLoading ? "Logging in..." : LockedSeconds > 0 ? "Login locked" : "Log in"}
                        </button>

                        <a className="roleswitchlink" href="#" onClick={(event) => {
                            event.preventDefault();
                            SetLoginType("admin");
                          }}>
                          Super Admin?
                        </a>
                      </form>
                    </div>
                  </>
                  ) : (
                    <SuperAdminLogin showTeacher={() => SetLoginType("teacher")} />
                  )}

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
