import { limits } from "./inputLimits.js";

export function IsValidName(value) {
  return typeof value === "string" &&
    /^\p{L}[\p{L}\p{M}]*(?: +\p{L}[\p{L}\p{M}]*)*$/u.test(
      value.normalize("NFC").trim()
    );
}

export function NormalizeName(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/g, "").toLowerCase();
}

export function GetNameKey(firstname, lastname) {
  return JSON.stringify([NormalizeName(firstname), NormalizeName(lastname)]);
}

export function GetNameError(firstname, lastname, existing = [], currentID = null) {
  if (!IsValidName(firstname) || !IsValidName(lastname)) {
    return "First name and last name must contain letters and spaces only.";
  }

  if (firstname.length > limits.firstname) {
    return `First name must be ${limits.firstname} characters or fewer.`;
  }

  if (lastname.length > limits.lastname) {
    return `Last name must be ${limits.lastname} characters or fewer.`;
  }

  if (existing.some((person) =>
    (currentID === null || String(person.studentID ?? person.staffID) !== String(currentID)) &&
    GetNameKey(person.firstName, person.lastName) === GetNameKey(firstname, lastname)
  )) {
    return "This full name already exists.";
  }

  return "";
}

export function GetUsernameError(username, existing = [], currentID = null) {
  const value = username.trim().toLowerCase();
  if (value.length < 3 || value.length > limits.username || !/^[a-z0-9._]+$/.test(value)) {
    return `Username must contain 3–${limits.username} characters: letters, numbers, dots, or underscores.`;
  }
  if (existing.some((student) =>
    (currentID === null || String(student.studentID) !== String(currentID)) &&
    String(student.username ?? "").trim().toLowerCase() === value
  )) {
    return "This username is already being used.";
  }
  return "";
}
