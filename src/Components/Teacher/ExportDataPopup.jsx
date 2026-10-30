import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetAssessmentOptions, assessmentOptionsQueryKey } from "../../lib/assessmentQueries";
import { GetBranches } from "../../lib/branches";
import { GetSectionReportData } from "../../lib/sectionReportQueries";
import { DownloadSectionReport } from "../../lib/sectionReport";
import { useActionPending } from "../../lib/useActionPending";
import "../../css/ExportDataPopup.css";

function ExportChoices({ title, options, selected, disabled, onChange }) {
  const allSelected = options.length > 0 && selected.length === options.length;
  function Toggle(value, checked) {
    onChange(checked ? [...new Set([...selected, value])] : selected.filter((item) => item !== value));
  }
  return (
    <fieldset className="exportdatachoices" disabled={disabled}>
      <legend>{title}</legend>
      <label className="exportdataselectall">
        <span>Select All</span>
        <input type="checkbox" aria-label={`Select all ${title.toLowerCase()}`} checked={allSelected}
          ref={(element) => { if (element) element.indeterminate = selected.length > 0 && !allSelected; }}
          onChange={(event) => onChange(event.target.checked ? options.map((item) => item.value) : [])} />
      </label>
      <div className="exportdatalist" tabIndex={0} role="group" aria-label={title}>
        {options.map((item) => (
          <label key={item.value}>
            <span>{item.label}</span>
            <input type="checkbox" checked={selected.includes(item.value)} onChange={(event) => Toggle(item.value, event.target.checked)} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ExportDataPopup({ teacherName, onClose }) {
  const dialog = useRef(null);
  const pending = useRef(false);
  const [sectionIDs, setSectionIDs] = useState(null);
  const [branchNames, setBranchNames] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useActionPending(busy);
  const optionsQuery = useQuery({
    queryKey: assessmentOptionsQueryKey, queryFn: GetAssessmentOptions,
    staleTime: 0, refetchOnMount: "always",
  });
  const sections = optionsQuery.data?.sections ?? [];
  const branches = GetBranches(optionsQuery.data?.levels ?? []);
  const sectionOptions = sections.map((item) => ({ value: String(item.sectionID), label: item.sectionName }));
  const branchOptions = branches.map((name) => ({ value: name, label: name }));
  const selectedSections = sectionOptions.map((item) => item.value).filter((value) => sectionIDs === null || sectionIDs.includes(value));
  const selectedBranches = branches.filter((name) => branchNames === null || branchNames.includes(name));

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  async function Download(event) {
    event.preventDefault();
    if (pending.current || optionsQuery.isFetching || !selectedSections.length || !selectedBranches.length) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await GetSectionReportData(optionsQuery.data.staffID, selectedSections, selectedBranches);
      await DownloadSectionReport(data, teacherName);
      onClose();
    } catch (downloadError) {
      setError(downloadError.message || "Unable to download the report. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} className="exportdatapopup" aria-labelledby="exportdatatitle" onCancel={(event) => {
      event.preventDefault();
      if (!pending.current) onClose();
    }}>
      <div className="exportdataheader">
        <h2 id="exportdatatitle">Export Data</h2>
        <button type="button" aria-label="Close export data" disabled={busy} onClick={onClose}>&times;</button>
      </div>
      <form onSubmit={Download}>
        <div className="exportdatafilters">
          <ExportChoices title="Sections" options={sectionOptions} selected={selectedSections} disabled={busy || optionsQuery.isFetching} onChange={setSectionIDs} />
          <ExportChoices title="Branches" options={branchOptions} selected={selectedBranches} disabled={busy || optionsQuery.isFetching} onChange={setBranchNames} />
        </div>
        <p className="exportdatainfo">Each section gets its own sheet. Selected branches are listed below each other with assessment and progress records.</p>
        {optionsQuery.isFetching && <p role="status">Loading export options...</p>}
        {!optionsQuery.isFetching && !optionsQuery.isError && sections.length === 0 && <p>No active sections to export.</p>}
        {!optionsQuery.isFetching && !optionsQuery.isError && sections.length > 0 && branches.length === 0 && <p>No branches available to export.</p>}
        {(error || optionsQuery.isError) && <p className="exportdataerror" role="alert">{error || "Unable to load export options."}</p>}
        {optionsQuery.isError && <button className="exportdataretry" type="button" disabled={optionsQuery.isFetching} onClick={() => optionsQuery.refetch()}>Try again</button>}
        <div className="exportdataactions">
          <button type="button" className="exportdatacancel" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className="exportdatadownload" disabled={busy || optionsQuery.isFetching || optionsQuery.isError || !selectedSections.length || !selectedBranches.length}>
            {busy ? "Preparing Excel..." : "Download Excel"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default ExportDataPopup;
