import { useEffect, useRef, useState } from "react";
import "../../css/BatchStudentPopup.css";
import "../../css/BatchQuestionPopup.css";
import { ReadQuestionFile, ValidateQuestionBatch } from "../../lib/questionImport";

function BatchQuestionPopup({ questions, maximum, onClose, onSave }) {
  const dialog = useRef(null);
  const request = useRef(false);
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reviewed = ValidateQuestionBatch(rows, questions, maximum);
  const ready = reviewed.filter((row) => !row.error).length;

  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  async function ChooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || request.current) return;
    request.current = true;
    setBusy(true);
    setError("");
    setRows([]);
    setFilename(file.name);
    try {
      setRows(await ReadQuestionFile(file));
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      request.current = false;
      setBusy(false);
    }
  }

  async function Submit(event) {
    event.preventDefault();
    if (request.current || !ready) return;
    request.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave(rows);
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      request.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} className="batchpopup questionbatchpopup" aria-labelledby="questionbatch-title" onCancel={(event) => {
      event.preventDefault();
      if (!request.current) onClose();
    }}>
      <div className="batchheader">
        <h2 id="questionbatch-title">Batch Upload Questions</h2>
        <button type="button" aria-label="Close popup" disabled={busy} onClick={onClose}>&times;</button>
      </div>
      <form onSubmit={Submit} aria-busy={busy}>
        <div className="batchfileactions">
          <a href="/files/questions.xlsx" download="questions.xlsx">Download Template</a>
          <label className={busy ? "questionbatch-disabled" : ""}>
            Choose Excel
            <input type="file" accept=".xlsx" onChange={ChooseFile} disabled={busy} />
          </label>
        </div>
        {filename && <p className="batchfilename">{filename}</p>}
        {busy && <p role="status">Processing...</p>}
        {error && <p className="batcherror" role="alert">{error}</p>}
        {rows.length > 0 && <>
          <p>{ready} ready. Questions with errors or no selected correct answer will be skipped.</p>
          <div className="questionbatchpreview">
            {reviewed.map((item) => (
              <fieldset key={item.row} disabled={busy} className={item.error && item.error !== "Select the correct answer." ? "questionbatchrejected" : "questionbatchsuccess"}>
                <legend>Row {item.row}{item.saved ? " · Saved" : ""}</legend>
                <p>{item.text}</p>
                {item.choices.map((choice, position) => (
                  <label key={position}>
                    <input type="radio" name={`batchanswer-${item.row}`} checked={item.answer === position} onChange={() => {
                      setError("");
                      setRows((current) => current.map((row) => row.row === item.row ? { ...row, answer: position } : row));
                    }} />
                    <span>{String.fromCharCode(65 + position)}. {choice}</span>
                  </label>
                ))}
                {item.error && <p className="batcherror questionbatchrowerror">{item.error}</p>}
              </fieldset>
            ))}
          </div>
        </>}
        <div className="batchactions">
          <button type="submit" disabled={busy || !ready}>{busy ? "Processing..." : `Save ${ready} Questions`}</button>
        </div>
      </form>
    </dialog>
  );
}

export default BatchQuestionPopup;
