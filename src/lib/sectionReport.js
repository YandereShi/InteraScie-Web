const missing = "—";
const daySeconds = 86400;
const colors = { green: "FF70AD47", blue: "FFBDD7EE", metadata: "FF9DC3E6", yellow: "FFFFFF00", branch: "FFFFC000", pale: "FFFFF2CC" };

function Name(student) {
  return [student.lastName, student.firstName].filter(Boolean).join(", ") || "Unnamed student";
}

function Mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function TimeValue(seconds) {
  return seconds === null ? missing : Math.round(seconds) / daySeconds;
}

function Cell(sheet, row, first, last, value, fill, options = {}) {
  if (first !== last) sheet.mergeCells(row, first, row, last);
  const cell = sheet.getCell(row, first);
  cell.value = value;
  cell.font = { name: "Calibri", size: options.size ?? 11, bold: options.bold ?? false, color: { argb: "FF000000" } };
  cell.alignment = { vertical: "middle", horizontal: options.left ? "left" : "center", wrapText: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  const edge = { style: options.bold ? "medium" : "thin", color: { argb: "FF000000" } };
  cell.border = { top: edge, bottom: edge, left: edge, right: edge };
  if (options.format) cell.numFmt = options.format;
  return cell;
}

function SheetName(section, names) {
  const base = String(section.sectionName).replace(/[\\/*?:[\]]/g, " ").replace(/^'+|'+$/g, "").trim().replace(/^history$/i, "History Section") || "Section";
  let name = base.slice(0, 31);
  for (let index = 2; names.has(name.toLowerCase()); index += 1) {
    const suffix = ` (${index})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
  }
  names.add(name.toLowerCase());
  return name;
}

export async function CreateSectionWorkbook(data, teacherName, exportedAt = new Date()) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "InteraScie";
  workbook.created = exportedAt;
  const sections = [...data.sections].sort((a, b) => a.sectionName.localeCompare(b.sectionName));
  const branches = [...new Set(data.levels.map((level) => level.branchName))];
  const tests = new Map();
  for (const test of data.tests) if (!tests.has(String(test.levelID))) tests.set(String(test.levelID), test.assessmentID);
  const scores = new Map(data.scores.filter((item) => item.score !== null && item.score !== undefined && item.score !== "" &&
    Number(item.totalQuestions) === 15 && Number.isInteger(Number(item.score)) && Number(item.score) >= 0 && Number(item.score) <= 15)
    .map((item) => [`${item.studentID}:${item.assessmentID}`, Number(item.score)]));
  const progress = new Map(data.records.map((item) => [`${item.studentID}:${item.levelID}`, item]));
  const getScore = (student, level) => scores.get(`${student.studentID}:${tests.get(String(level.levelID))}`) ?? null;
  const getProgress = (student, level) => {
    const record = progress.get(`${student.studentID}:${level.levelID}`);
    const status = String(record?.status ?? "").trim().toLowerCase();
    const seconds = Number(record?.timeTakenSeconds);
    return {
      finished: status === "finished",
      status: status === "finished" ? "Finished" : record && status !== "not started" && status !== "notstarted" ? "Ongoing" : "Not started",
      seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : null,
    };
  };
  const names = new Set();
  for (const section of sections) {
    const students = data.students.filter((student) => String(student.sectionID) === String(section.sectionID))
      .sort((a, b) => Name(a).localeCompare(Name(b)));
    const sheet = workbook.addWorksheet(SheetName(section, names), {
      views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" },
      properties: { defaultRowHeight: 22 },
    });
    sheet.columns = Array.from({ length: 21 }, (_, index) => ({ width: index === 11 ? 3 : 9 }));
    sheet.mergeCells("A1:D2");
    const title = sheet.getCell("A1");
    title.value = "DATA REPORT";
    title.font = { name: "Calibri", size: 22, bold: true, color: { argb: "FF000000" } };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.green } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(4).height = Math.max(26, Math.ceil(teacherName.length / 26) * 14 + 8);
    sheet.getRow(6).height = 36;
    Cell(sheet, 4, 1, 2, "Teacher Name:", colors.metadata);
    Cell(sheet, 4, 3, 5, teacherName, colors.metadata);
    Cell(sheet, 4, 7, 8, "Date:", colors.metadata);
    const date = new Date(Date.UTC(exportedAt.getFullYear(), exportedAt.getMonth(), exportedAt.getDate()));
    Cell(sheet, 4, 9, 10, date, colors.metadata, { format: "yyyy-mm-dd" });
    Cell(sheet, 4, 11, 12, (exportedAt.getHours() * 3600 + exportedAt.getMinutes() * 60 + exportedAt.getSeconds()) / daySeconds, colors.metadata, { format: "hh:mm:ss" });
    Cell(sheet, 6, 1, 2, "Section:", colors.metadata);
    Cell(sheet, 6, 3, 5, section.sectionName, colors.metadata);
    Cell(sheet, 6, 7, 8, "Branch/es:", colors.metadata);
    Cell(sheet, 6, 9, 12, branches.join(", "), colors.metadata);
    const allScores = [];
    const allTimes = [];
    let finished = 0;
    let start = 9;
    for (const branch of branches) {
      const levels = data.levels.filter((level) => level.branchName === branch);
      const assessmentEnd = 3 + levels.length * 2;
      const progressEnd = 15 + levels.length * 2;
      sheet.getRow(start).height = levels.length < 3 ? 38 : 30;
      Cell(sheet, start, 4, assessmentEnd, "ASSESSMENT RECORD", colors.green, { bold: true, size: 18 });
      Cell(sheet, start, 16, progressEnd, "PROGRESS RECORD", colors.green, { bold: true, size: 18 });
      Cell(sheet, start + 2, 1, 1, "Branch:", colors.branch);
      Cell(sheet, start + 2, 2, 3, branch, colors.branch);
      Cell(sheet, start + 2, 13, 13, "Branch:", colors.branch);
      Cell(sheet, start + 2, 14, 15, branch, colors.branch);
      Cell(sheet, start + 5, 1, 3, "Name", colors.green, { bold: true });
      Cell(sheet, start + 5, assessmentEnd + 1, assessmentEnd + 2, "Total", colors.green, { bold: true });
      Cell(sheet, start + 5, 13, 15, "Name", colors.green, { bold: true });
      for (const [index, level] of levels.entries()) {
        const scoreColumn = 4 + index * 2;
        const progressColumn = 16 + index * 2;
        const levelScores = students.map((student) => getScore(student, level)).filter((value) => value !== null);
        const records = students.map((student) => getProgress(student, level));
        const levelTimes = records.filter((record) => record.finished && record.seconds !== null).map((record) => record.seconds);
        allScores.push(...levelScores);
        allTimes.push(...levelTimes);
        finished += records.filter((record) => record.finished).length;
        Cell(sheet, start + 4, scoreColumn, scoreColumn, "Avg:", colors.yellow);
        Cell(sheet, start + 4, scoreColumn + 1, scoreColumn + 1, Mean(levelScores) ?? missing, colors.yellow, { format: "0.00" });
        Cell(sheet, start + 5, scoreColumn, scoreColumn + 1, `Level ${level.lesson}`, colors.green, { bold: true });
        Cell(sheet, start + 3, progressColumn, progressColumn, "Avg time:", colors.yellow);
        Cell(sheet, start + 3, progressColumn + 1, progressColumn + 1, TimeValue(Mean(levelTimes)), colors.yellow, { format: "[mm]:ss" });
        Cell(sheet, start + 4, progressColumn, progressColumn + 1, `Level ${level.lesson}`, colors.green, { bold: true });
        Cell(sheet, start + 5, progressColumn, progressColumn, "Status", colors.pale);
        Cell(sheet, start + 5, progressColumn + 1, progressColumn + 1, "Time", colors.pale);
      }
      for (const [index, student] of students.entries()) {
        const row = start + 6 + index;
        sheet.getRow(row).height = Math.max(30, Math.ceil(Name(student).length / 25) * 14 + 8);
        Cell(sheet, row, 1, 3, Name(student), colors.blue, { left: true });
        Cell(sheet, row, 13, 15, Name(student), colors.blue, { left: true });
        const recorded = [];
        for (const [levelIndex, level] of levels.entries()) {
          const score = getScore(student, level);
          if (score !== null) recorded.push(score);
          const record = getProgress(student, level);
          const scoreColumn = 4 + levelIndex * 2;
          const progressColumn = 16 + levelIndex * 2;
          Cell(sheet, row, scoreColumn, scoreColumn + 1, score ?? missing, colors.blue, { format: "0" });
          Cell(sheet, row, progressColumn, progressColumn, record.status, colors.blue);
          Cell(sheet, row, progressColumn + 1, progressColumn + 1, TimeValue(record.seconds), colors.blue, { format: "[mm]:ss" });
        }
        Cell(sheet, row, assessmentEnd + 1, assessmentEnd + 2, recorded.length ? recorded.reduce((sum, value) => sum + value, 0) : missing, colors.blue, { format: "0" });
      }
      if (!students.length) {
        Cell(sheet, start + 6, 1, 3, "No active students", colors.blue);
        Cell(sheet, start + 6, 13, 15, "No active students", colors.blue);
      }
      start += 6 + Math.max(1, students.length) + 3;
    }
    Cell(sheet, start, 1, 21, "SECTION STATISTICS", colors.green, { bold: true });
    sheet.getRow(start + 1).height = 32;
    Cell(sheet, start + 1, 1, 3, "Average score (/15)", colors.yellow);
    Cell(sheet, start + 1, 4, 6, Mean(allScores) ?? missing, colors.blue, { format: "0.00" });
    Cell(sheet, start + 1, 8, 10, "Average time", colors.yellow);
    Cell(sheet, start + 1, 11, 13, TimeValue(Mean(allTimes)), colors.blue, { format: "[mm]:ss" });
    Cell(sheet, start + 1, 15, 17, "Progress", colors.yellow);
    const possible = students.length * data.levels.length;
    Cell(sheet, start + 1, 18, 21, possible ? finished / possible : missing, colors.blue, { format: "0.00%" });
    sheet.mergeCells(start + 3, 1, start + 3, 21);
    const note = sheet.getCell(start + 3, 1);
    note.value = "— = no saved result or time. Totals use recorded scores. Average time uses finished levels with recorded time. Progress follows current section members.";
    note.font = { name: "Calibri", size: 10 };
    note.alignment = { wrapText: true };
    sheet.getRow(start + 3).height = 30;
    sheet.pageSetup.printArea = `A1:U${start + 3}`;
  }
  return workbook;
}

export async function DownloadSectionReport(data, teacherName) {
  const date = new Date();
  const workbook = await CreateSectionWorkbook(data, teacherName, date);
  const buffer = await workbook.xlsx.writeBuffer();
  const branches = [...new Set(data.levels.map((level) => level.branchName))];
  const dateLabel = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  const name = [data.sections.length === 1 ? data.sections[0].sectionName : `${data.sections.length} Sections`,
    branches.length === 1 ? branches[0] : `${branches.length} Branches`, "Report", dateLabel].join("_")
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, "_");
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
