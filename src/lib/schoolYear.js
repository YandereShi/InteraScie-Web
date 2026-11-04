export function IsValidSchoolYear(value) {
  if (typeof value !== "string" || !/^(19|[2-9]\d)\d{2}-\d{4}$/.test(value)) return false;
  const [start, end] = value.split("-").map(Number);
  return end === start + 1;
}

export function GetSchoolYears(sections, includeNew = false) {
  const years = sections.map((section) => section.schoolYear).filter(IsValidSchoolYear);
  if (includeNew) {
    const current = new Date().getFullYear();
    for (let year = current - 5; year <= current + 5; year += 1) years.push(`${year}-${year + 1}`);
  }
  return [...new Set(years)].sort((first, second) => first.localeCompare(second));
}

export function SortSectionsBySchoolYear(sections) {
  return [...sections].sort((first, second) => {
    if (!first.schoolYear && second.schoolYear) return 1;
    if (first.schoolYear && !second.schoolYear) return -1;
    return String(first.schoolYear ?? "").localeCompare(String(second.schoolYear ?? "")) ||
      Number(first.isShared === true) - Number(second.isShared === true) ||
      String(first.sectionName ?? "").localeCompare(String(second.sectionName ?? ""));
  });
}

export function MatchesSchoolYear(section, year) {
  if (year === "all") return true;
  if (section.isShared) return false;
  return year === "unassigned" ? !section.schoolYear : section.schoolYear === year;
}

export function GetSectionLabel(section) {
  if (section.isShared) return "No Section";
  const name = section.displayName || section.sectionName || "Unnamed Section";
  return `${name} (${section.schoolYear || "SY not assigned"})`;
}
