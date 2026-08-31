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

function BatchStudentPopup({
  Sections,
  OnClose,
  OnUpload,
}) {
  const [SectionID, SetSectionID] = useState("");
  const [Rows, SetRows] = useState([]);
  const [FileName, SetFileName] = useState("");
  const [FileError, SetFileError] = useState("");
  const [IsUploading, SetIsUploading] = useState(false);

  function HandleDownload() {
    const Template = "\ufefffirstName,lastName\r\n";
    const FileBlob = new Blob([Template], {
      type: "text/csv;charset=utf8",
    });

    const FileURL = URL.createObjectURL(FileBlob);
    const Anchor = document.createElement("a");

    Anchor.href = FileURL;
    Anchor.download = "students.csv";
    document.body.append(Anchor);
    Anchor.click();
    Anchor.remove();
    URL.revokeObjectURL(FileURL);
  }

  function HandleFile(Event) {
    const SelectedFile = Event.target.files?.[0];

    SetRows([]);
    SetFileError("");
    SetFileName("");

    if (!SelectedFile) {
      return;
    }

    SetFileName(SelectedFile.name);

    Papa.parse(SelectedFile, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (Header) => Header.trim(),
      complete: (Result) => {
        const Fields = Result.meta.fields ?? [];

        if (
          !Fields.includes("firstName") ||
          !Fields.includes("lastName")
        ) {
          SetFileError(
            "The CSV must contain firstName and lastName columns."
          );
          return;
        }

        if (Result.data.length === 0) {
          SetFileError("The CSV does not contain any students.");
          return;
        }

        if (Result.data.length > 50) {
          SetFileError(
            "Only 50 students can be uploaded at one time."
          );
          return;
        }

        const UsedUsernames = new Set();

        const ParsedRows = Result.data.map(
          (Student, Index) => {
            const FirstName = String(
              Student.firstName ?? ""
            ).trim();

            const LastName = String(
              Student.lastName ?? ""
            ).trim();

            const Username = MakeUsername(
              FirstName,
              LastName,
              UsedUsernames
            );

            let ErrorMessage = "";

            if (!FirstName || !LastName) {
              ErrorMessage =
                "First name and last name are required.";
            } else if (!Username) {
              ErrorMessage =
                "The name cannot produce a valid username.";
            }

            return {
              RowNumber: Index + 2,
              FirstName,
              LastName,
              Username,
              ErrorMessage,
            };
          }
        );

        SetRows(ParsedRows);
      },
      error: () => {
        SetFileError("Unable to read the CSV file.");
      },
    });
  }

  async function HandleSubmit(Event) {
    Event.preventDefault();

    if (!SectionID) {
      SetFileError("Select a section.");
      return;
    }

    if (Rows.length === 0) {
      SetFileError("Select a CSV file.");
      return;
    }

    if (Rows.some((Row) => Row.ErrorMessage)) {
      SetFileError(
        "Correct the invalid rows before uploading."
      );
      return;
    }

    SetIsUploading(true);
    SetFileError("");

    try {
      await OnUpload({
        sectionID: Number(SectionID),
        students: Rows.map((Row) => ({
          firstName: Row.FirstName,
          lastName: Row.LastName,
        })),
      });
    } catch (Error) {
      SetFileError(Error.message);
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
                        {Row.ErrorMessage || "Ready"}
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
                Rows.length === 0 ||
                Rows.some((Row) => Row.ErrorMessage)
              }
            >
              {IsUploading
                ? "Uploading..."
                : `Upload ${Rows.length} Students`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchStudentPopup;
