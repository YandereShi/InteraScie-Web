import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { createClient } from "@supabase/supabase-js";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/PasswordRecovery.css";

const client = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "teacherpasswordrecovery" } }
);

function ResetPassword() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("type") === "recovery" ? params.get("token_hash") : null;
  });
  const [stage, SetStage] = useState(token ? "password" : "invalid");
  const [loading, SetLoading] = useState(false);
  const [message, SetMessage] = useState("");
  const verified = useRef(false);
  const [visible, SetVisible] = useState(false);
  const [confirmvisible, SetConfirmVisible] = useState(false);

  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  async function CheckTeacher() {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error("Your reset session has expired. Please request a new link.");
    const { data: staff, error: stafferror } = await client
      .from("SchoolStaff")
      .select("role")
      .eq("authUserID", data.user.id)
      .single();
    if (stafferror || staff?.role !== "teacher") {
      throw new Error("Unable to verify a teacher account. Please contact your administrator.");
    }
    return data.user;
  }

  async function VerifyTeacher() {
    try {
      if (!verified.current) {
        const { error } = await client.auth.verifyOtp({ token_hash: token, type: "recovery" });
        if (error) throw new Error("This reset link is invalid or expired. Please request a new link.");
        verified.current = true;
      }
      await CheckTeacher();
    } catch (error) {
      SetStage("invalid");
      await client.auth.signOut({ scope: "local" });
      throw error;
    }
  }

  async function SavePassword(event) {
    event.preventDefault();
    if (loading || stage !== "password") return;
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password"));
    const confirmation = String(values.get("confirmation"));
    if (password.length < 8 || password.length > 16) {
      SetMessage("Use 8–16 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      SetMessage("Passwords do not match.");
      return;
    }
    SetLoading(true);
    SetMessage("");
    try {
      await VerifyTeacher();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      SetStage("success");
      await client.auth.signOut({ scope: "local" });
    } catch (error) {
      SetMessage(error.message || "Unable to update your password. Please try again.");
    } finally {
      SetLoading(false);
    }
  }

  return (
    <main className="recoverypage">
      <section className="recoverycard" aria-labelledby="resetpasswordtitle">
        <h1 id="resetpasswordtitle">Reset teacher password</h1>
        {stage !== "success" && <form onSubmit={SavePassword}>
          <p>Enter and confirm your new teacher account password.</p>
          <label htmlFor="newpassword">New Password</label>
          <div className="recoverypasswordfield">
            <input id="newpassword" name="password" type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} aria-describedby="passwordrequirements" />
            <button className="recoverypasswordeye" type="button" disabled={loading} aria-label={visible ? "Hide new password" : "Show new password"} title={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => SetVisible(!visible)}>
              {visible ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <p id="passwordrequirements">Use 8–16 characters.</p>
          <label htmlFor="confirmpassword">Confirm New Password</label>
          <div className="recoverypasswordfield">
            <input id="confirmpassword" name="confirmation" type={confirmvisible ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} />
            <button className="recoverypasswordeye" type="button" disabled={loading} aria-label={confirmvisible ? "Hide confirm password" : "Show confirm password"} title={confirmvisible ? "Hide password" : "Show password"} aria-pressed={confirmvisible} onClick={() => SetConfirmVisible(!confirmvisible)}>
              {confirmvisible ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          {message && <p className="recoveryerror" role="alert">{message}</p>}
          <button className="recoveryprimary" type="submit" disabled={loading || stage === "invalid"}>{loading ? "Saving..." : "Save new password"}</button>
        </form>}
        {stage === "success" && <p role="status">Your password has been updated. Log in with your new password.</p>}
        {!loading && <Link className="recoveryback" to="/">Back to login</Link>}
      </section>
    </main>
  );
}

export default ResetPassword;
