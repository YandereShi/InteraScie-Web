import Papa from "papaparse";
import { limits } from "./inputLimits.js";

function QuestionKey(text) {
  return text.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

export function ParseQuestionRows(data) {
  if (String(data[0]?.[0] ?? "").trim() !== "Questions") {
    throw new Error('Cell A1 must contain the header "Questions".');
  }
  const rows = data.slice(1).map((cells, index) => ({ raw: String(cells[0] ?? "").trim(), row: index + 2 }))
    .filter((item) => item.raw);
  if (!rows.length) throw new Error("The file does not contain any questions.");
  if (rows.length > 15) throw new Error("Only 15 questions can be uploaded at a time.");

  return rows.map(({ raw, row }) => {
    const block = raw.replace(/\r\n?/g, "\n");
    const markers = [...block.matchAll(/^\s*([A-Z])[.):][ \t]*/gim)];
    if (markers.map((match) => match[1].toUpperCase()).join("") !== "ABCD") {
      throw new Error(`Row ${row}: put A., B., C., and D. on separate lines inside the same cell, in that order.`);
    }
    return {
      row,
      text: block.slice(0, markers[0].index).trim().replace(/^\d+\s*[.)]\s*/, ""),
      choices: markers.map((match, index) => block.slice(match.index + match[0].length, markers[index + 1]?.index ?? block.length).trim()),
      answer: null,
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

export function ValidateQuestionBatch(rows, existing, maximum, requireAnswers = true) {
  if (!rows.length) return "Choose a file containing questions.";
  if (existing.length + rows.length > maximum) {
    return `This assessment has ${existing.length}/${maximum} questions. Only ${Math.max(0, maximum - existing.length)} more can be added.`;
  }

  const used = new Set(existing.map((question) => QuestionKey(question.text)));
  for (const item of rows) {
    let error = "";
    if (!item.text.trim() || item.choices.length !== 4 || item.choices.some((choice) => !choice.trim())) {
      error = "Enter a question and all four choices.";
    } else if (item.text.length > limits.question) {
      error = `Question must be ${limits.question} characters or fewer.`;
    } else if (item.choices.some((choice) => choice.length > limits.choice)) {
      error = `Each choice must be ${limits.choice} characters or fewer.`;
    } else if (new Set(item.choices.map((choice) => choice.normalize("NFC").trim().replace(/\s+/g, " "))).size !== 4) {
      error = "Choices must be different from each other.";
    } else if (used.has(QuestionKey(item.text))) {
      error = "This question is duplicated or already exists in this assessment.";
    } else if (requireAnswers && (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3)) {
      error = "Select the correct answer.";
    }
    if (error) return `Row ${item.row}: ${error}`;
    used.add(QuestionKey(item.text));
  }
  return "";
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
