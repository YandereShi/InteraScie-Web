import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "../css/StaffProfilePopup.css";
import { supabase } from "../lib/supabase";
import { GetStaffPhotoPath } from "../lib/profilePhotos";
import profileImage from "../assets/pfp.png";
import ProfilePhotoEditor from "./ProfilePhotoEditor";

function StaffProfilePopup({ staff, onclose }) {
  const dialog = useRef(null);
  const [view, SetView] = useState("profile");
  const [loading, SetLoading] = useState(false);
  const [message, SetMessage] = useState("");
  const [status, SetStatus] = useState("");
  const [photoSaving, SetPhotoSaving] = useState(false);

  useEffect(() => {
    const popup = dialog.current;
    popup.showModal();
    return () => popup.close();
  }, []);

  function OpenPassword() {
    SetMessage("");
    SetStatus("");
    SetView("password");
  }

  function CancelPassword() {
    if (loading) return;
    SetMessage("");
    SetView("profile");
  }

  async function SavePassword(event) {
    event.preventDefault();
    if (loading) return;

    const values = new FormData(event.currentTarget);
    const currentPassword = String(values.get("currentPassword"));
    const newPassword = String(values.get("newPassword"));
    const confirmPassword = String(values.get("confirmPassword"));

    if (newPassword.length < 8 || newPassword.length > 16) {
      SetMessage("Use 8–16 characters for your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      SetMessage("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      SetMessage("Choose a new password that is different from your current password.");
      return;
    }

    SetLoading(true);
    SetMessage("");
    let passwordClient;

    try {
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser.user?.email) {
        throw new Error("Your session has expired. Please log in again.");
      }

      passwordClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "staffpasswordchange" } }
      );

      const { data: verification, error: verificationError } = await passwordClient.auth.signInWithPassword({
        email: currentUser.user.email,
        password: currentPassword,
      });

      if (verificationError) {
        throw new Error(verificationError.code === "invalid_credentials" ? "Current password is incorrect." : "Unable to verify your current password. Please try again.");
      }
      if (verification.user?.id !== currentUser.user.id) {
        throw new Error("Unable to verify your account. Please log in again.");
      }

      const { error: updateError } = await passwordClient.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw new Error(updateError.message || "Unable to change your password. Please try again.");
      }

      SetStatus("Your password was changed successfully.");
      SetView("profile");
    } catch (error) {
      SetMessage(error.message || "Unable to change your password. Please try again.");
    } finally {
      if (passwordClient) {
        await passwordClient.auth.signOut({ scope: "local" });
      }
      SetLoading(false);
    }
  }

  return (
    <dialog ref={dialog} className="staffprofiledialog" aria-labelledby="staffprofiletitle" onCancel={(event) => { event.preventDefault(); if (!loading && !photoSaving) onclose(); }}>
      {view === "profile" ? (
        <>
          <h2 id="staffprofiletitle">My Profile</h2>
          <ProfilePhotoEditor path={GetStaffPhotoPath(staff.authUserID)} fallback={profileImage} alt="Profile photo" imageClassName="staffprofileimage" onBusyChange={SetPhotoSaving} />
          <div className="staffprofiledetails">
            <div><span>First name</span><strong>{staff.firstName}</strong></div>
            <div><span>Last name</span><strong>{staff.lastName}</strong></div>
          </div>
          {status && <p className="staffprofilestatus" role="status">{status}</p>}
          <div className="staffprofileactions">
            <button type="button" className="staffprofilesecondary" onClick={onclose} disabled={photoSaving}>Close</button>
            <button type="button" className="staffprofileprimary" onClick={OpenPassword} disabled={photoSaving}>Change Password</button>
          </div>
        </>
      ) : (
        <>
          <h2 id="staffprofiletitle">Change Password</h2>
          <form onSubmit={SavePassword}>
            <label htmlFor="staffcurrentpassword">Current Password</label>
            <input id="staffcurrentpassword" name="currentPassword" type="password" autoComplete="current-password" required disabled={loading} />
            <label htmlFor="staffnewpassword">New Password</label>
            <input id="staffnewpassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} aria-describedby="staffpasswordrequirements" />
            <p id="staffpasswordrequirements">Use 8–16 characters.</p>
            <label htmlFor="staffconfirmpassword">Confirm Password</label>
            <input id="staffconfirmpassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} />
            {message && <p className="staffprofileerror" role="alert">{message}</p>}
            <div className="staffprofileactions">
              <button type="button" className="staffprofilesecondary" onClick={CancelPassword} disabled={loading}>Cancel</button>
              <button type="submit" className="staffprofileprimary" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </>
      )}
    </dialog>
  );
}

export default StaffProfilePopup;
