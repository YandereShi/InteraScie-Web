import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { createClient } from "@supabase/supabase-js";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import TeacherPolicyPopup from "./TeacherPolicyPopup";
import "../../css/PasswordRecovery.css";
import "../../css/TeacherPasswordAgreement.css";
import { GetPasswordError } from "../../lib/passwordValidation";

const client = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "teacherpasswordcreation" } }
);

function CreateTeacherPassword() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("type") === "invite" ? params.get("token_hash") : null;
  });
  const [stage, SetStage] = useState(token ? "password" : "invalid");
  const [loading, SetLoading] = useState(false);
  const [message, SetMessage] = useState(token ? "" : "This invitation link is invalid or expired.");
  const [visible, SetVisible] = useState(false);
  const [confirmvisible, SetConfirmVisible] = useState(false);
  const [accepted, SetAccepted] = useState(false);
  const [policy, SetPolicy] = useState(null);
  const verified = useRef(false);

  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  async function CheckTeacher() {
    const { data, error } = await client.auth.getUser();

    if (error || !data.user) {
      throw new Error("Your invitation session has expired. Please request a new invitation.");
    }

    const { data: staff, error: stafferror } = await client.rpc("StaffSessionStatus");

    if (stafferror || staff?.role !== "teacher") {
      throw new Error("Unable to verify a teacher account. Please contact your administrator.");
    }
  }

  async function VerifyInvitation() {
    try {
      if (!verified.current) {
        const { error } = await client.auth.verifyOtp({ token_hash: token, type: "invite" });

        if (error) {
          throw new Error("This invitation link is invalid or expired. Please request a new invitation.");
        }

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

    if (loading || stage !== "password") {
      return;
    }

    if (!accepted) {
      SetMessage("Please agree to the Terms and Conditions and acknowledge the Privacy Policy.");
      return;
    }

    const values = new FormData(event.currentTarget);
    const password = String(values.get("password"));
    const confirmation = String(values.get("confirmation"));

    const passwordError = GetPasswordError(password);
    if (passwordError) {
      SetMessage(passwordError);
      return;
    }

    if (password !== confirmation) {
      SetMessage("Passwords do not match.");
      return;
    }

    SetLoading(true);
    SetMessage("");

    try {
      await VerifyInvitation();
      const { error } = await client.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      SetStage("success");
      await client.auth.signOut({ scope: "local" });
    } catch (error) {
      SetMessage(error.message || "Unable to create your password. Please try again.");
    } finally {
      SetLoading(false);
    }
  }

  return (
    <main className="recoverypage">
      <section className="recoverycard" aria-labelledby="createpasswordtitle">
        <h1 id="createpasswordtitle">Create teacher password</h1>
        {stage === "password" && (
          <form onSubmit={SavePassword}>
            <p>Create and confirm the password for your teacher account.</p>
            <label htmlFor="teachernewpassword">New Password</label>
            <div className="recoverypasswordfield">
              <input id="teachernewpassword" name="password" type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} aria-describedby="teacherpasswordrequirements" />
              <button className="recoverypasswordeye" type="button" disabled={loading} aria-label={visible ? "Hide new password" : "Show new password"} title={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => SetVisible(!visible)}>
                {visible ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <p id="teacherpasswordrequirements">Use 8–16 characters with no spaces.</p>
            <label htmlFor="teacherconfirmpassword">Confirm New Password</label>
            <div className="recoverypasswordfield">
              <input id="teacherconfirmpassword" name="confirmation" type={confirmvisible ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} />
              <button className="recoverypasswordeye" type="button" disabled={loading} aria-label={confirmvisible ? "Hide confirm password" : "Show confirm password"} title={confirmvisible ? "Hide password" : "Show password"} aria-pressed={confirmvisible} onClick={() => SetConfirmVisible(!confirmvisible)}>
                {confirmvisible ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <div className="teacherpasswordagreement">
              <input
                id="teacherpolicyagreement"
                className="teacherpolicycheckbox"
                type="checkbox"
                name="agreement"
                required
                checked={accepted}
                disabled={loading}
                aria-labelledby="teacherpolicyagreementtext"
                onChange={(event) => SetAccepted(event.target.checked)}
              />
              <span id="teacherpolicyagreementtext">
                <label htmlFor="teacherpolicyagreement">I agree to the </label>
                <button type="button" className="teacherpolicylink" disabled={loading} aria-haspopup="dialog" onClick={() => SetPolicy("terms")}>Terms and Conditions</button>
                {" and have read the "}
                <button type="button" className="teacherpolicylink" disabled={loading} aria-haspopup="dialog" onClick={() => SetPolicy("privacy")}>Privacy Policy</button>.
              </span>
            </div>
            {message && <p className="recoveryerror" role="alert">{message}</p>}
            <button className="recoveryprimary" type="submit" disabled={loading || !accepted}>{loading ? "Saving..." : "Create password"}</button>
          </form>
        )}
        {stage === "invalid" && <p className="recoveryerror" role="alert">{message}</p>}
        {stage === "success" && <p role="status">Your teacher password has been created. You can now log in.</p>}
        {!loading && <Link className="recoveryback" to="/">Back to login</Link>}
      </section>
      {policy && <TeacherPolicyPopup policy={policy} onClose={() => SetPolicy(null)} />}
    </main>
  );
}

export default CreateTeacherPassword;
