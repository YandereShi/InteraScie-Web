import { GetNameError, GetNameKey } from "./nameValidation.js";
import { limits } from "./inputLimits.js";

const surnamePrefixes = new Set(["de", "del", "dela", "la", "las", "los", "san", "santa", "santo"]);
const middleInitial = /^(?:\p{L}\.)*\p{L}\.?$/u;

function SplitName(value) {
  const parts = value.normalize("NFC").split(/\s+/);
  const initialIndex = parts.findIndex((part, index) =>
    index > 0 && index < parts.length - 1 && middleInitial.test(part)
  );
  let surnameIndex = parts.length - 1;

  if (initialIndex !== -1) {
    surnameIndex = initialIndex + 1;
    while (surnameIndex < parts.length - 1 && middleInitial.test(parts[surnameIndex])) {
      surnameIndex += 1;
    }
  } else {
    while (surnameIndex > 1 && surnamePrefixes.has(parts[surnameIndex - 1].toLowerCase())) {
      surnameIndex -= 1;
    }
  }

  return {
    FirstName: parts.slice(0, initialIndex === -1 ? surnameIndex : initialIndex).join(" "),
    LastName: parts.slice(surnameIndex).join(" "),
  };
}

function MakeUsername(firstname, lastname, usedusernames) {
  const normalize = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = normalize(firstname);
  const last = normalize(lastname);
  if (!first || !last) return "";
  const base = `${first}.${last}`.slice(0, limits.username);
  let username = base;
  let number = 2;

  while (usedusernames.has(username)) {
    const suffix = String(number++);
    username = `${base.slice(0, limits.username - suffix.length)}${suffix}`;
  }

  usedusernames.add(username);
  return username;
}

export function ParseStudentRows(data) {
  if (String(data[0]?.[0] ?? "").trim() !== "Student Names") {
    throw new Error('Cell A1 must contain the header "Student Names".');
  }

  const names = data.slice(1)
    .map((cells, index) => ({ name: String(cells[0] ?? "").trim(), RowNumber: index + 2 }))
    .filter((row) => row.name);

  if (!names.length) throw new Error("The Excel file does not contain any students.");
  if (names.length > 50) throw new Error("Only 50 students can be uploaded at one time.");

  return names.map(({ name, RowNumber }) => ({ RowNumber, ...SplitName(name) }));
}

export async function ReadStudentFile(file) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Choose an Excel (.xlsx) file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Choose a file smaller than 2 MB.");

  let data;
  try {
    const { readSheet } = await import("read-excel-file/browser");
    data = await readSheet(file);
  } catch {
    throw new Error("Unable to read the Excel file. Save it as .xlsx and use the first worksheet.");
  }

  return ParseStudentRows(data);
}

export function ValidateStudentBatch(rows, students) {
  const usedusernames = new Set(students.map((student) => String(student.username ?? "").trim().toLowerCase()));
  const usednames = new Set(students.map((student) => GetNameKey(student.firstName, student.lastName)));

  return rows.map((row) => {
    const firstname = row.FirstName.trim();
    const lastname = row.LastName.trim();
    const key = GetNameKey(firstname, lastname);
    let error = !firstname || !lastname
      ? "First name and last name are required."
      : GetNameError(firstname, lastname);
    let username = "";

    if (!error && usednames.has(key)) error = "Duplicate full name.";
    if (!error) {
      username = MakeUsername(firstname, lastname, usedusernames);
      if (!username) error = "The name cannot produce a valid username.";
      else usednames.add(key);
    }

    return { ...row, FirstName: firstname, LastName: lastname, Username: username, ErrorMessage: error };
  });
}
