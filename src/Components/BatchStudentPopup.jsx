import "../css/BatchStudentPopup.css";
import Papa from "papaparse";
import { useState } from "react";

function NormalizeName(Value) {
  return String(Value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(
      /[^abcdefghijklmnopqrstuvwxyz0123456789]/g,
      ""
    );
}

function MakeUsername(FirstName, LastName, UsedUsernames) {
  const CleanFirstName = NormalizeName(FirstName);
  const CleanLastName = NormalizeName(LastName);

  if (!CleanFirstName || !CleanLastName) {
    return "";
  }

  const BaseUsername = `${CleanFirstName}.${CleanLastName}`;
  let Username = BaseUsername;
  let NumberValue = 2;

  while (UsedUsernames.has(Username)) {
    Username = `${BaseUsername}${NumberValue}`;
    NumberValue += 1;
  }

  UsedUsernames.add(Username);
  return Username;
}

function MakeNameKey(firstname, lastname) {
  return JSON.stringify(
    [firstname, lastname].map((name) =>
      String(name ?? "")
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
    )
  );
}

function BatchStudentPopup({
  Sections,
  students = [],
  OnClose,
  OnUpload,
}) {
  const [SectionID, SetSectionID] = useState("");
  const [Rows, SetRows] = useState([]);
  const [FileName, SetFileName] = useState("");
  const [FileError, SetFileError] = useState("");
  const [IsUploading, SetIsUploading] = useState(false);
  const [hasresults, SetHasResults] = useState(false);

  function HandleDownload() {
    const Anchor = document.createElement("a");

    Anchor.href = "/files/students.csv";
    Anchor.download = "students.csv";

    document.body.append(Anchor);
    Anchor.click();
    Anchor.remove();
  }

  function HandleFile(Event) {
    const SelectedFile = Event.target.files?.[0];

    SetRows([]);
    SetFileError("");
    SetFileName("");
    SetHasResults(false);

    if (!SelectedFile) {
      return;
    }

    SetFileName(SelectedFile.name);

    Papa.parse(SelectedFile, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (Header) => Header.trim(),
      complete: (Result) => {
        const Fields = (Result.meta.fields ?? []).slice(0, 2);

        if (
          !Fields.includes("firstName") ||
          !Fields.includes("lastName")
        ) {
          SetFileError(
            "The first two CSV columns must be lastName and firstName."
          );
          return;
        }

        const StudentRows = Result.data
          .map((Student, Index) => ({
            RowNumber: Index + 2,
            FirstName: String(Student.firstName ?? "").trim(),
            LastName: String(Student.lastName ?? "").trim(),
          }))
          .filter((Student) => Student.FirstName || Student.LastName);

        if (StudentRows.length === 0) {
          SetFileError("The CSV does not contain any students.");
          return;
        }

        if (StudentRows.length > 50) {
          SetFileError(
            "Only 50 students can be uploaded at one time."
          );
          return;
        }

        const usedusernames = new Set();
        const usednames = new Set(
          students.map((student) =>
            MakeNameKey(student.firstName, student.lastName)
          )
        );

        const parsedrows = StudentRows.map((student) => {
          const firstname = student.FirstName;
          const lastname = student.LastName;
          const namekey = MakeNameKey(firstname, lastname);
          let username = "";
          let errormessage = "";

          if (!firstname || !lastname) {
            errormessage = "First name and last name are required.";
          } else if (usednames.has(namekey)) {
            errormessage = "Duplicate";
          } else {
            username = MakeUsername(firstname, lastname, usedusernames);

            if (!username) {
              errormessage = "The name cannot produce a valid username.";
            } else {
              usednames.add(namekey);
            }
          }

          return {
            ...student,
            Username: username,
            ErrorMessage: errormessage,
          };
        });

        SetRows(parsedrows);
      },
      error: () => {
        SetFileError("Unable to read the CSV file.");
      },
    });
  }

  async function HandleSubmit(Event) {
    Event.preventDefault();

    if (IsUploading || hasresults) {
      return;
    }

    if (!SectionID) {
      SetFileError("Select a section.");
      return;
    }

    if (Rows.length === 0) {
      SetFileError("Select a CSV file.");
      return;
    }

    if (Rows.every((row) => row.ErrorMessage)) {
      SetFileError(
        "No valid students to upload."
      );
      return;
    }

    SetIsUploading(true);
    SetFileError("");

    try {
      const result = await OnUpload({
        sectionID: Number(SectionID),
        students: Rows.map((Row) => ({
          firstName: Row.FirstName,
          lastName: Row.LastName,
        })),
      });

      if (result.failed?.length > 0) {
        SetRows(Rows.map((row, index) => {
          const failed = result.failed.find((student) => student.row === index + 2);
          const created = result.created?.find((student) => student.row === index + 2);

          return {
            ...row,
            Username: created?.username ?? row.Username,
            ErrorMessage: failed?.error ?? "",
            status: created ? "Created" : "Failed",
          };
        }));
        SetHasResults(true);
        SetFileError("Some students failed. Review the statuses and choose a corrected CSV to try again.");
      }
    } catch (error) {
      SetFileError(error.message);
    } finally {
      SetIsUploading(false);
    }
  }

  return (
    <div
      className="batchoverlay"
      onMouseDown={IsUploading ? undefined : OnClose}
    >
      <div
        className="batchpopup"
        role="dialog"
        aria-modal="true"
        onMouseDown={(Event) => Event.stopPropagation()}
      >
        <div className="batchheader">
          <h2>Batch Upload Students</h2>

          <button
            type="button"
            onClick={OnClose}
            disabled={IsUploading}
          >
            ×
          </button>
        </div>

        <form onSubmit={HandleSubmit}>
          <label htmlFor="batchsection">
            Section
          </label>

          <select
            id="batchsection"
            value={SectionID}
            onChange={(Event) =>
              SetSectionID(Event.target.value)
            }
            disabled={IsUploading}
            required
          >
            <option value="" disabled>
              Select Section
            </option>

            {Sections.map((Section) => (
              <option
                key={Section.sectionID}
                value={Section.sectionID}
              >
                {Section.sectionName}
              </option>
            ))}
          </select>

          <div className="batchfileactions">
            <button
              type="button"
              onClick={HandleDownload}
              disabled={IsUploading}
            >
              Download Template
            </button>

            <label htmlFor="batchfile">
              Choose CSV
            </label>

            <input
              type="file"
              id="batchfile"
              accept=".csv,text/csv"
              onChange={HandleFile}
              disabled={IsUploading}
            />
          </div>

          {FileName && (
            <p className="batchfilename">{FileName}</p>
          )}

          {FileError && (
            <p className="batcherror" role="alert">
              {FileError}
            </p>
          )}

          {Rows.length > 0 && (
            <div className="batchpreview">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>First name</th>
                    <th>Last name</th>
                    <th>Username</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {Rows.map((Row) => (
                    <tr key={Row.RowNumber}>
                      <td>{Row.RowNumber}</td>
                      <td>{Row.FirstName}</td>
                      <td>{Row.LastName}</td>
                      <td>{Row.Username}</td>
                      <td>
                        {Row.ErrorMessage || Row.status || "Ready"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="batchactions">
            <button
              type="button"
              onClick={OnClose}
              disabled={IsUploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                IsUploading ||
                hasresults ||
                Rows.length === 0 ||
                Rows.every((row) => row.ErrorMessage)
              }
            >
              {IsUploading
                ? "Uploading..."
                : hasresults
                  ? "Upload completed"
                  : `Upload ${Rows.filter((row) => !row.ErrorMessage).length} Students`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchStudentPopup;
