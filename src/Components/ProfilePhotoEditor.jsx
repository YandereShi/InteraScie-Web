import { useRef, useState } from "react";
import "../css/ProfilePhotoEditor.css";
import { PrepareProfilePhoto } from "../lib/profilePhotos";
import ProfilePhoto from "./ProfilePhoto";

function ProfilePhotoEditor({ path, fallback, alt, imageClassName, photo, onPhotoChange, disabled = false, onBusyChange }) {
  const input = useRef(null);
  const [preparing, SetPreparing] = useState(false);
  const [error, SetError] = useState("");

  async function ChangePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !path || preparing || disabled) return;

    SetPreparing(true);
    SetError("");
    onBusyChange?.(true);

    try {
      const preparedPhoto = await PrepareProfilePhoto(file);
      const preview = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to preview this image."));
        reader.readAsDataURL(preparedPhoto);
      });
      onPhotoChange({ file: preparedPhoto, preview });
    } catch (prepareError) {
      SetError(prepareError.message || "Unable to prepare the photo.");
    } finally {
      SetPreparing(false);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="profilephotoeditor">
      {photo
        ? <img src={photo.preview} className={imageClassName} alt={alt} />
        : <ProfilePhoto path={path} fallback={fallback} className={imageClassName} alt={alt} />}
      <input ref={input} className="profilephotoinput" type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Choose ${alt.toLowerCase()}`} disabled={disabled || preparing} onChange={ChangePhoto} />
      <button type="button" className="profilephotochange" disabled={!path || preparing || disabled} title={!path ? "Save the account first" : undefined} onClick={() => input.current?.click()}>
        {preparing ? "Preparing..." : "Change Photo"}
      </button>
      {photo && <span className="profilephotostatus" role="status">Photo selected. Click Save to apply.</span>}
      {error && <span className="profilephotoerror" role="alert">{error}</span>}
    </div>
  );
}

export default ProfilePhotoEditor;
