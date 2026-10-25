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
  const validation = ValidateQuestionBatch(rows, questions, maximum);

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
      const parsed = await ReadQuestionFile(file);
      const message = ValidateQuestionBatch(parsed, questions, maximum, false);
      if (message) throw new Error(message);
      setRows(parsed);
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      request.current = false;
      setBusy(false);
    }
  }

  async function Submit(event) {
    event.preventDefault();
    if (request.current || validation) return;
    request.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave(rows);
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
          <p>Select the correct answer for every question.</p>
          <div className="questionbatchpreview">
            {rows.map((item, index) => (
              <fieldset key={item.row} disabled={busy}>
                <legend>Question {questions.length + index + 1}</legend>
                <p>{item.text}</p>
                {item.choices.map((choice, position) => (
                  <label key={position}>
                    <input type="radio" name={`batchanswer-${item.row}`} checked={item.answer === position} onChange={() => {
                      setError("");
                      setRows((current) => current.map((row) => row.row === item.row ? { ...row, answer: position } : row));
                    }} required />
                    <span>{String.fromCharCode(65 + position)}. {choice}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          {validation && <p className="batcherror" role="status">{validation}</p>}
        </>}
        <div className="batchactions">
          <button type="button" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy || Boolean(validation)}>{busy ? "Processing..." : `Save ${rows.length} Questions`}</button>
        </div>
      </form>
    </dialog>
  );
}

export default BatchQuestionPopup;
