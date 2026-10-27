import "../../css/BatchStudentPopup.css";
import { useState } from "react";
import { GetNameError } from "../../lib/nameValidation";
import { limits } from "../../lib/inputLimits";
import { ReadStudentFile, ValidateStudentBatch } from "../../lib/studentImport";

function BatchStudentPopup({
  Sections,
  students = [],
  initialSectionID = "",
  lockSection = false,
  OnClose,
  OnUpload,
}) {
  const [SectionID, SetSectionID] = useState(String(initialSectionID));
  const [Rows, SetRows] = useState([]);
  const [FileName, SetFileName] = useState("");
  const [FileError, SetFileError] = useState("");
  const [IsUploading, SetIsUploading] = useState(false);
  const [IsReading, SetIsReading] = useState(false);
  const [hasresults, SetHasResults] = useState(false);
  const reviewed = hasresults ? Rows : ValidateStudentBatch(Rows, students);

  function HandleDownload() {
    const Anchor = document.createElement("a");

    Anchor.href = "/files/students.xlsx";
    Anchor.download = "students.xlsx";

    document.body.append(Anchor);
    Anchor.click();
    Anchor.remove();
  }

  async function HandleFile(Event) {
    const SelectedFile = Event.target.files?.[0];
    Event.target.value = "";
    if (IsUploading || IsReading) return;

    SetRows([]);
    SetFileError("");
    SetFileName("");
    SetHasResults(false);

    if (!SelectedFile) {
      return;
    }

    SetFileName(SelectedFile.name);
    SetIsReading(true);
    try {
      SetRows(await ReadStudentFile(SelectedFile));
    } catch (error) {
      SetFileError(error.message);
    } finally {
      SetIsReading(false);
    }
  }

  function EditName(rowNumber, field, value) {
    SetRows((current) => current.map((row) => row.RowNumber === rowNumber ? { ...row, [field]: value } : row));
    SetFileError("");
  }

  async function HandleSubmit(Event) {
    Event.preventDefault();

    if (IsUploading || IsReading || hasresults) {
      return;
    }

    if (!SectionID) {
      SetFileError("Select a section.");
      return;
    }

    if (Rows.length === 0) {
      SetFileError("Select an Excel (.xlsx) file.");
      return;
    }

    const validrows = reviewed.filter((row) =>
      !row.ErrorMessage &&
      !GetNameError(row.FirstName, row.LastName)
    );

    if (validrows.length === 0) {
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
        students: validrows.map((row) => ({
          firstName: row.FirstName,
          lastName: row.LastName,
        })),
      });

      if (result.failed?.length > 0) {
        SetRows(reviewed.map((row) => {
          const index = validrows.findIndex((student) => student.RowNumber === row.RowNumber);

          if (index === -1) {
            return row;
          }

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
        SetFileError("Some students failed. Review the statuses and choose a corrected Excel file to try again.");
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
            disabled={IsUploading || lockSection}
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
                {Section.displayName ?? Section.sectionName}
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
              Choose Excel
            </label>

            <input
              type="file"
              id="batchfile"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={HandleFile}
              disabled={IsUploading || IsReading}
            />
          </div>

          {FileName && (
            <p className="batchfilename">{IsReading ? "Reading..." : FileName}</p>
          )}

          {FileError && (
            <p className="batcherror" role="alert">
              {FileError}
            </p>
          )}

          {Rows.length > 0 && (
            <p className="batchfilename">Middle initials are ignored. Check the first and last names and correct them before uploading.</p>
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
                  {reviewed.map((Row, index) => (
                    <tr key={Row.RowNumber} className={!Row.ErrorMessage && Row.status !== "Failed" ? "batchstudentsuccess" : undefined}>
                      <td>{Row.RowNumber}</td>
                      <td>
                        <input
                          type="text"
                          value={Rows[index].FirstName}
                          maxLength={limits.firstname}
                          aria-label={`First name, row ${Row.RowNumber}`}
                          disabled={IsUploading || hasresults}
                          onChange={(event) => EditName(Row.RowNumber, "FirstName", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={Rows[index].LastName}
                          maxLength={limits.lastname}
                          aria-label={`Last name, row ${Row.RowNumber}`}
                          disabled={IsUploading || hasresults}
                          onChange={(event) => EditName(Row.RowNumber, "LastName", event.target.value)}
                        />
                      </td>
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
                IsReading ||
                hasresults ||
                Rows.length === 0 ||
                reviewed.every((row) => row.ErrorMessage)
              }
            >
              {IsUploading
                ? "Uploading..."
                : hasresults
                  ? "Upload completed"
                  : `Upload ${reviewed.filter((row) => !row.ErrorMessage).length} Students`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchStudentPopup;
