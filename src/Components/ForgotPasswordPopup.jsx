import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import "../css/PasswordRecovery.css";

function ForgotPasswordPopup({ onclose }) {
  const dialog = useRef(null);
  const [loading, SetLoading] = useState(false);
  const [sent, SetSent] = useState(false);
  const [message, SetMessage] = useState("");

  useEffect(() => {
    const popup = dialog.current;
    popup.showModal();
    return () => popup.close();
  }, []);

  async function SendResetLink(event) {
    event.preventDefault();
    if (loading || sent) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email")).trim();
    SetLoading(true);
    SetMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://interascie.vercel.app/resetpassword",
      });
      if (error) {
        SetMessage(error.status === 429
          ? "Too many requests. Please wait before trying again."
          : "Unable to send the reset email. Please try again later.");
        return;
      }
      SetSent(true);
    } catch {
      SetMessage("Unable to connect. Please check your connection and try again.");
    } finally {
      SetLoading(false);
    }
  }

  return (
    <dialog ref={dialog} className="recoverycard recoverydialog" aria-labelledby="forgotpasswordtitle"
      onCancel={(event) => { event.preventDefault(); if (!loading) onclose(); }}>
      <h2 id="forgotpasswordtitle">Reset Password Email sent.</h2>
      {sent ? (
        <>
          <p role="status">A reset link has been sent to your email. Please check your inbox and spam folder.</p>
          <button type="button" className="recoveryprimary" onClick={onclose}>Back to login</button>
        </>
      ) : (
        <form onSubmit={SendResetLink}>
          <p>Enter the email registered to your staff account.</p>
          <label htmlFor="recoveryemail">Account email</label>
          <input id="recoveryemail" name="email" type="email" autoComplete="email" required disabled={loading} />
          {message && <p className="recoveryerror" role="alert">{message}</p>}
          <button className="recoveryprimary" type="submit" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</button>
          <button className="recoverysecondary" type="button" onClick={onclose} disabled={loading}>Cancel</button>
        </form>
      )}
    </dialog>
  );
}

export default ForgotPasswordPopup;
