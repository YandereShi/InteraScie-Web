import "./Login.css";
import teacherImage from "../assets/teacher.png";
import { useState } from "react";
import SuperAdminLogin from "./SuperAdminLogin";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router";

function Login() {
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error.message);
      alert("Invalid email or password.");
      return;
    }

    const { data: staff, error: staffError } = await supabase
      .from("SchoolStaff")
      .select("role")
      .eq("authUserID", data.user.id)
      .single();

    if (staffError || staff.role !== "teacher") {
      await supabase.auth.signOut();
      alert("This account is not registered as a teacher.");
      return;
    }

    navigate("/teacher-dashboard", { replace: true });
  }

  const [loginType, setLoginType] = useState("teacher");
  return (
    <>
        <div className="mainbackground">
            <div className="loginbox">
                <div className="gameside">
                  
                </div>

                <div className="loginside">
                  {loginType === "teacher" ? (
                  <>
                    <div className="loginheaders">
                      <img className="teachericon" src={teacherImage} alt="Teacher icon" />
                      <h2>Login</h2>
                    </div>

                    <div className="loginform">
                      <form onSubmit={handleLogin}>
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
                        <input
                          type="password"
                          id="password"
                          name="password"
                          placeholder="Password"
                          required
                        />

                        <a href="#">Forgot Password</a>

                        <button type="submit" className="loginbutton">Log in</button>

                        <a href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setLoginType("admin");
                          }}
                        >
                          Super Admin?
                        </a>
                      </form>
                    </div>
                  </>
                  ) : (
                    <SuperAdminLogin showTeacher={() => setLoginType("teacher")} />
                  )}
                </div>
            </div>    
        </div>
        
    </>
    
  );
}

export default Login;
