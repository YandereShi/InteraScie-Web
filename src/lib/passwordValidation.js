export function GetPasswordError(password) {
  if (/\s/u.test(password)) return "Passwords cannot contain spaces.";
  if (password.length < 8 || password.length > 16) return "Use 8–16 characters for your password.";
  return "";
}
