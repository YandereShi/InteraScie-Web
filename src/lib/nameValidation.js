import { limits } from "./inputLimits.js";

export function IsValidName(value) {
  return typeof value === "string" &&
    /^\p{L}[\p{L}\p{M}]*(?: +\p{L}[\p{L}\p{M}]*)*$/u.test(
      value.normalize("NFC").trim()
    );
}

export function GetNameError(firstname, lastname) {
  if (!IsValidName(firstname) || !IsValidName(lastname)) {
    return "First name and last name must contain letters and spaces only.";
  }

  if (firstname.length > limits.firstname) {
    return `First name must be ${limits.firstname} characters or fewer.`;
  }

  if (lastname.length > limits.lastname) {
    return `Last name must be ${limits.lastname} characters or fewer.`;
  }

  return "";
}
