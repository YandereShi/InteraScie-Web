import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/StaffProfilePopup.css";
import { supabase } from "../lib/supabase";
import { GetProfilePhotoQueryKey, GetStaffPhotoPath, SaveProfilePhoto } from "../lib/profilePhotos";
import profileImage from "../assets/pfp.png";
import ProfilePhotoEditor from "./ProfilePhotoEditor";
import { GetPasswordError } from "../lib/passwordValidation";

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
  const [currentVisible, SetCurrentVisible] = useState(false);
  const [newVisible, SetNewVisible] = useState(false);
  const [confirmVisible, SetConfirmVisible] = useState(false);
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
    SetCurrentVisible(false);
    SetNewVisible(false);
    SetConfirmVisible(false);
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

    const passwordError = GetPasswordError(newPassword);
    if (passwordError) {
      SetMessage(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      SetMessage("New passwords do not match.");
      return;
    }
    SetLoading(true);
    SetMessage("");
    try {
      const { data: sessionStatus, error: sessionError } = await supabase.rpc("StaffSessionStatus");
      if (sessionError) throw new Error("Unable to verify your session. Please try again.");
      if (sessionStatus?.status !== "active") throw new Error("Your session has expired. Please log in again.");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });
      if (updateError) {
        if (updateError.code === "current_password_mismatch") throw new Error("Current password is incorrect.");
        if (updateError.code === "same_password") throw new Error("Choose a new password that is different from your current password.");
        throw new Error(updateError.message || "Unable to change your password. Please try again.");
      }

      SetStatus("Your password was changed successfully.");
      SetView("profile");
    } catch (error) {
      SetMessage(error.message || "Unable to change your password. Please try again.");
    } finally {
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
            <div className="staffpasswordfield">
              <input id="staffcurrentpassword" name="currentPassword" type={currentVisible ? "text" : "password"} autoComplete="current-password" required disabled={loading} />
              <button className="staffpasswordeye" type="button" disabled={loading} aria-label={currentVisible ? "Hide current password" : "Show current password"} aria-pressed={currentVisible} onClick={() => SetCurrentVisible(!currentVisible)}>
                {currentVisible ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <label htmlFor="staffnewpassword">New Password</label>
            <div className="staffpasswordfield">
              <input id="staffnewpassword" name="newPassword" type={newVisible ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} aria-describedby="staffpasswordrequirements" />
              <button className="staffpasswordeye" type="button" disabled={loading} aria-label={newVisible ? "Hide new password" : "Show new password"} aria-pressed={newVisible} onClick={() => SetNewVisible(!newVisible)}>
                {newVisible ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <p id="staffpasswordrequirements">Use 8–16 characters with no spaces.</p>
            <label htmlFor="staffconfirmpassword">Confirm Password</label>
            <div className="staffpasswordfield">
              <input id="staffconfirmpassword" name="confirmPassword" type={confirmVisible ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={16} required disabled={loading} />
              <button className="staffpasswordeye" type="button" disabled={loading} aria-label={confirmVisible ? "Hide confirm password" : "Show confirm password"} aria-pressed={confirmVisible} onClick={() => SetConfirmVisible(!confirmVisible)}>
                {confirmVisible ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
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
