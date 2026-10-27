import { limits } from "./inputLimits.js";

export const emailPattern = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
const emailFormat = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

export function NormalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function GetEmailError(value) {
  const email = NormalizeEmail(value);
  if (email.length > limits.email) return `Email must be ${limits.email} characters or fewer.`;
  if (!emailFormat.test(email)) return "Enter a valid email address.";
  return "";
}
