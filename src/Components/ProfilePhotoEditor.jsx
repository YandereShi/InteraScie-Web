import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import "../css/ProfilePhotoEditor.css";
import { GetProfilePhotoQueryKey, SaveProfilePhoto } from "../lib/profilePhotos";
import ProfilePhoto from "./ProfilePhoto";

function ProfilePhotoEditor({ path, fallback, alt, imageClassName, onBusyChange }) {
  const input = useRef(null);
  const queryClient = useQueryClient();
  const [saving, SetSaving] = useState(false);
  const [message, SetMessage] = useState("");
  const [error, SetError] = useState("");

  async function ChangePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !path || saving) return;

    SetSaving(true);
    SetMessage("");
    SetError("");
    onBusyChange?.(true);

    try {
      await SaveProfilePhoto(path, file);
      await queryClient.invalidateQueries({ queryKey: GetProfilePhotoQueryKey(path), exact: true });
      SetMessage("Photo updated.");
    } catch (saveError) {
      SetError(saveError.message || "Unable to save the photo.");
    } finally {
      SetSaving(false);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="profilephotoeditor">
      <ProfilePhoto path={path} fallback={fallback} className={imageClassName} alt={alt} />
      <input ref={input} className="profilephotoinput" type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Choose ${alt.toLowerCase()}`} onChange={ChangePhoto} />
      <button type="button" className="profilephotochange" disabled={!path || saving} title={!path ? "Save the account first" : undefined} onClick={() => input.current?.click()}>
        {saving ? "Uploading..." : "Change Photo"}
      </button>
      {message && <span className="profilephotostatus" role="status">{message}</span>}
      {error && <span className="profilephotoerror" role="alert">{error}</span>}
    </div>
  );
}

export default ProfilePhotoEditor;
