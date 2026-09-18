import { supabase } from "./supabase";

const bucket = "Profile";
const maxPhotoSize = 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function GetStaffPhotoPath(authUserID) {
  return authUserID ? `staff/${authUserID}/avatar.jpg` : null;
}

export function GetStudentPhotoPath(studentID) {
  return studentID ? `students/${studentID}/avatar.jpg` : null;
}

export function GetProfilePhotoQueryKey(path) {
  return ["ProfilePhoto", path];
}

export async function GetProfilePhotoUrl(path) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

  if (error) {
    if (Number(error.statusCode) === 404 || /not found/i.test(error.message)) {
      return null;
    }
    throw error;
  }

  return data.signedUrl;
}

async function PrepareProfilePhoto(file) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > 20 * maxPhotoSize) {
    throw new Error("Choose an image smaller than 20 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  let image;

  try {
    image = await new Promise((resolve, reject) => {
      const loadedImage = new Image();
      loadedImage.onload = () => resolve(loadedImage);
      loadedImage.onerror = () => reject(new Error("Unable to read this image."));
      loadedImage.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const largestDimension = Math.max(image.naturalWidth, image.naturalHeight);
  if (!largestDimension) {
    throw new Error("Unable to read this image.");
  }

  const scale = Math.min(1, 512 / largestDimension);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare this image.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let photo;

  do {
    photo = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    quality -= 0.15;
  } while (photo?.size > maxPhotoSize && quality >= 0.4);

  if (!photo || photo.size > maxPhotoSize) {
    throw new Error("Unable to reduce the image below 1 MB. Choose a smaller image.");
  }

  return photo;
}

export async function SaveProfilePhoto(path, file) {
  if (!path) {
    throw new Error("Save the account before adding a photo.");
  }

  const photo = await PrepareProfilePhoto(file);
  const { error } = await supabase.storage.from(bucket).upload(path, photo, {
    cacheControl: "0",
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message || "Unable to save the photo.");
  }
}
