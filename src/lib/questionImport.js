import Papa from "papaparse";
import { limits } from "./inputLimits.js";

function QuestionKey(text) {
  return String(text ?? "").normalize("NFC").replace(/\s+/g, "").toLowerCase();
}

export function GetQuestionError(form, existing = [], currentQuestionID = null, requireAnswer = true) {
  if (form.parseError) return form.parseError;
  const text = form.text.trim();
  const choices = form.choices.map((choice) => choice.trim());
  if (!text || choices.length !== 4 || choices.some((choice) => !choice)) {
    return "Enter a question and all four choices.";
  }
  if (text.length > limits.question) return `Question must be ${limits.question} characters or fewer.`;
  if (choices.some((choice) => choice.length > limits.choice)) return `Each choice must be ${limits.choice} characters or fewer.`;
  if (new Set(choices.map(QuestionKey)).size !== 4) return "Choices must be different.";
  if (existing.some((question) => (currentQuestionID === null || String(question.questionID) !== String(currentQuestionID)) && QuestionKey(question.text) === QuestionKey(text))) {
    return "This question already exists in this assessment.";
  }
  if (requireAnswer && ![0, 1, 2, 3].includes(form.answer)) return "Select the correct answer.";
  return "";
}

export function ParseQuestionRows(data) {
  if (String(data[0]?.[0] ?? "").trim() !== "Questions") {
    throw new Error('Cell A1 must contain the header "Questions".');
  }
  const rows = data.slice(1).map((cells, index) => ({ raw: String(cells[0] ?? "").trim(), row: index + 2 }))
    .filter((item) => item.raw);
  if (!rows.length) throw new Error("The file does not contain any questions.");
  return rows.map(({ raw, row }) => {
    const block = raw.replace(/\r\n?/g, "\n");
    const markers = [...block.matchAll(/^\s*([A-Z])[.):][ \t]*/gim)];
    return {
      row,
      text: block.slice(0, markers[0]?.index ?? block.length).trim().replace(/^\d+\s*[.)]\s*/, ""),
      choices: markers.map((match, index) => block.slice(match.index + match[0].length, markers[index + 1]?.index ?? block.length).trim()),
      answer: null,
      parseError: markers.map((match) => match[1].toUpperCase()).join("") === "ABCD"
        ? ""
        : "Put A., B., C., and D. on separate lines inside the same cell, in that order.",
    };
  });
}

export async function ReadQuestionFile(file) {
  if (file.size > 2 * 1024 * 1024) throw new Error("Choose a file smaller than 2 MB.");
  const extension = file.name.split(".").pop().toLowerCase();
  let data;

  if (extension === "xlsx") {
    try {
      const { readSheet } = await import("read-excel-file/browser");
      data = await readSheet(file);
    } catch {
      throw new Error("Unable to read the Excel file. Save it as .xlsx and use the first worksheet.");
    }
  } else if (extension === "csv") {
    const result = Papa.parse(await file.text(), { delimiter: ",", skipEmptyLines: false });
    if (result.errors.length) throw new Error("Unable to read the CSV. Keep each multiline question inside one quoted cell.");
    data = result.data;
  } else {
    throw new Error("Choose an Excel (.xlsx) or CSV (.csv) file.");
  }

  return ParseQuestionRows(data);
}

export function ValidateQuestionBatch(rows, existing, maximum) {
  const seen = new Map();
  let acceptedCount = existing.length;
  return rows.map((item) => {
    let error = GetQuestionError(item, existing, null, false);
    const key = QuestionKey(item.text);
    if (!error && seen.has(key)) error = `Duplicate question from row ${seen.get(key)}.`;
    if (!error) seen.set(key, item.row);
    if (!error && ![0, 1, 2, 3].includes(item.answer)) error = "Select the correct answer.";
    if (!error && acceptedCount >= maximum) {
      error = `This assessment can only contain ${maximum} questions.`;
    }
    if (!error) acceptedCount += 1;
    return { ...item, error };
  });
}

export function QuestionPayload(form, assessmentID) {
  const others = form.choices.filter((_, index) => index !== form.answer);
  return {
    assessmentID,
    text: form.text.trim(),
    answer: form.choices[form.answer].trim(),
    choice1: others[0].trim(),
    choice2: others[1].trim(),
    choice3: others[2].trim(),
  };
}
