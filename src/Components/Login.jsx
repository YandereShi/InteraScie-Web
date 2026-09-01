import "../css/Login.css";
import teacherImage from "../assets/teacher.png";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SuperAdminLogin from "./SuperAdminLogin";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router";

function Login() {
  const navigate = useNavigate();
  const [ShowPassword, SetShowPassword] = useState(false);
  const [IsLoading, SetIsLoading] = useState(false);
  const [LoginType, SetLoginType] = useState("teacher");
  const [LoginMessage, SetLoginMessage] = useState("");
  const [LockedSeconds, SetLockedSeconds] = useState(0);

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
                <div className="gameside">
                  
                </div>

                <div className="loginside">
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

                        <a href="#">Forgot Password</a>

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

                        <a href="#" onClick={(event) => {
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
                </div>
            </div>    
        </div>
        
    </>
    
  );
}

export default Login;
