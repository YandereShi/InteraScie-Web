import { GetSchoolYears } from "../lib/schoolYear";

function SchoolYearSelect({ sections, value, onChange, label = "School year", disabled = false }) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      <option value="all">All School Years</option>
      {GetSchoolYears([...sections, { schoolYear: value }]).map((year) => <option key={year} value={year}>{year}</option>)}
      <option value="unassigned">SY not assigned</option>
    </select>
  );
}

export default SchoolYearSelect;
