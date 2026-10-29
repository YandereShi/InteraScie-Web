import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import "../css/StaffProfilePopup.css";
import { supabase } from "../lib/supabase";
import { GetProfilePhotoQueryKey, GetStaffPhotoPath, SaveProfilePhoto } from "../lib/profilePhotos";
import profileImage from "../assets/pfp.png";
import ProfilePhotoEditor from "./ProfilePhotoEditor";

function StaffProfilePopup({ staff, onclose }) {
  const dialog = useRef(null);
  const queryClient = useQueryClient();
  const [view, SetView] = useState("profile");
  const [loading, SetLoading] = useState(false);
  const [message, SetMessage] = useState("");
  const [status, SetStatus] = useState("");
  const [photoSaving, SetPhotoSaving] = useState(false);
  const [photoPreparing, SetPhotoPreparing] = useState(false);
  const [photo, SetPhoto] = useState(null);
  const photoBusy = photoSaving || photoPreparing;

  useEffect(() => {
    const popup = dialog.current;
    popup.showModal();
    return () => popup.close();
  }, []);

  function OpenPassword() {
    if (photoBusy || loading) return;
    SetMessage("");
    SetStatus("");
    SetView("password");
  }

  function ChangePhoto(nextPhoto) {
    SetPhoto(nextPhoto);
    SetMessage("");
    SetStatus("");
  }

  async function SavePhoto() {
    if (!photo || photoBusy || loading) return;

    SetPhotoSaving(true);
    SetMessage("");

    try {
      const path = GetStaffPhotoPath(staff.authUserID);
      await SaveProfilePhoto(path, photo.file);
      await queryClient.invalidateQueries({ queryKey: GetProfilePhotoQueryKey(path), exact: true });
      onclose();
    } catch (error) {
      SetMessage(error.message || "Unable to save the photo.");
    } finally {
      SetPhotoSaving(false);
    }
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

    if (!newPassword.trim()) {
      SetMessage("Password cannot contain only spaces.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      SetMessage("Use 8–16 characters for your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      SetMessage("New passwords do not match.");
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
      if (currentPassword === newPassword) {
        throw new Error("Choose a new password that is different from your current password.");
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
    <dialog ref={dialog} className="staffprofiledialog" aria-labelledby="staffprofiletitle" onCancel={(event) => { event.preventDefault(); if (!loading && !photoBusy) onclose(); }}>
      {view === "profile" ? (
        <>
          <div className="staffprofileheader">
            <h2 id="staffprofiletitle">My Profile</h2>
            <button type="button" className="staffprofileclose" onClick={onclose} disabled={photoBusy || loading} aria-label="Close profile">&times;</button>
          </div>
          <ProfilePhotoEditor path={GetStaffPhotoPath(staff.authUserID)} fallback={profileImage} alt="Profile photo" imageClassName="staffprofileimage" photo={photo} onPhotoChange={ChangePhoto} disabled={photoBusy || loading} onBusyChange={SetPhotoPreparing} />
          <div className="staffprofiledetails">
            <div><span>First name</span><strong>{staff.firstName}</strong></div>
            <div><span>Last name</span><strong>{staff.lastName}</strong></div>
          </div>
          {status && <p className="staffprofilestatus" role="status">{status}</p>}
          {message && <p className="staffprofileerror" role="alert">{message}</p>}
          <div className="staffprofileactions staffprofilephotoactions">
            <button type="button" className="staffprofileprimary" onClick={OpenPassword} disabled={photoBusy}>Change Password</button>
            <button type="button" className="staffprofileprimary" onClick={SavePhoto} disabled={!photo || photoBusy}>{photoSaving ? "Saving..." : "Save"}</button>
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
