import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { collectWishes, requestJson, validateSnapshot, writeNewFile } from "./wishes-backup.mjs";
import { planUpdates } from "./update-teacher-titles.mjs";
import { normalizeTeacherName } from "../src/lib/teachers.js";
import { clean, teacherKey } from "../src/lib/wishes.js";
import { SCHOOL_RECIPIENT } from "../src/lib/recipientGroups.js";
import { slugify } from "../src/lib/slugify.js";

const PROJECT = "vtec-teacher-day";
const ROOT = `projects/${PROJECT}/databases/(default)/documents`;
const SHEET_ID = "1DoW3-CYbY_W9lkWdNDOTcmcp4vFN7N0TQPhNAFHPH-g";
const T37 = "Times City (T37)";
const HARMONY = "Harmony";
const harmonyMemberNumbers = new Set([1, 2, 5, 12, 13, 14, 19]);

// Reviewed against the original cells. Every other populated wish is school-wide.
const recipients = {
  MEMBER: {
    E3: "Tổ Khoa học", F3: "Tổ Tin học",
    D5: "Thầy Lê Văn Đạt (Toán)", F5: "Tổ Tin học",
    E8: "Cô Nguyễn Phương Linh",
    D9: "Tổ Tin học", F9: "Tổ Khoa học",
    E10: "Tổ Tin học", F10: "Tổ Khoa học",
    D11: "Tổ Tin học", F11: "Tổ Khoa học", G11: "Cô Nguyễn Phương Linh", H11: "Cô Trịnh Thúy Ngân",
    D12: "Tổ Tin học", E12: "Tổ Mỹ thuật", F12: "Tổ Khoa học", H12: "Tổ Ngoại ngữ",
    E13: "Tổ Tin học", F13: "Tổ Ngữ văn", G13: "Tổ Khoa học",
    E15: "Tổ Ngữ văn", F15: "Tổ Khoa học",
    E16: "Mr. Austin (Physics)", F16: "Mr. Wayan (Math)",
    D21: "Cô Lê Thị Gấm", E21: "Cô Hoàng Thị Thanh", F21: "Tổ Khoa học",
    D31: "Tổ Tin học", E31: "Cô Nguyễn Thị Loan", F31: "Tổ Ngữ văn", H31: "Tổ Mỹ thuật",
    D32: "Cô Nguyễn Thị Loan", E32: "Tổ Ngữ văn", F32: "Tổ Tin học", G32: "Tổ Toán",
    E34: "Tổ Tin học",
    E35: "Tổ Toán", F35: "Tổ Khoa học", G35: "Tổ Ngoại ngữ", H35: "Tổ Thể chất",
    E40: "Tổ Tin học", F40: "Tổ Khoa học",
    G41: "Cô Nguyễn Hiền Mai",
  },
  CORE: {
    D2: "Tổ Toán", E2: "Tổ Tin học",
    D3: "Tổ Tin học", E3: "Mr. Robert Padilla (CS)",
    D7: "Cô Nguyễn Thị Thu Giang", E7: "Cô Hoàng Trí Nhi (Tiếng Trung)", G7: "Cô Phí Thị Thảo",
    D8: "Cô Liên",
  },
};

const renames = {
  "Cô Nhi (Tiếng Trung)": "Cô Hoàng Trí Nhi (Tiếng Trung)",
  "Cô Hiền Mai": "Cô Nguyễn Hiền Mai",
  "Thầy Arfan Anwar": "Mr. Arfan Anwar",
  "Cô Phương Anh (Academic writing)": "Ms. Phương Anh (Academic writing)",
};
const string = (stringValue) => ({ stringValue });
const strings = (values) => ({ arrayValue: { values: values.map(string) } });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const fingerprint = ({ author, message, target }) => JSON.stringify([
  clean(author).normalize("NFC"), message.trim().normalize("NFC"), target.map(normalizeTeacherName).map(teacherKey).sort(),
]);
const unpack = (document) => ({
  author: document.fields.author?.stringValue || "",
  message: document.fields.message?.stringValue || "",
  target: (document.fields.target?.arrayValue?.values || []).map((value) => value.stringValue),
});

export function buildImportPlan(source, snapshot) {
  validateSnapshot(snapshot);
  if (source.spreadsheetId !== SHEET_ID || JSON.stringify(source.sheets.map((sheet) => sheet.name)) !== '["MEMBER","CORE"]') {
    throw new Error("Unexpected source spreadsheet or tabs");
  }
  const existingByName = new Map(snapshot.documents.map((document) => [document.name, document]));
  const existingFingerprints = new Set(snapshot.documents.map((document) => fingerprint(unpack(document))));
  const entries = [];
  const skipped = [];
  const routed = new Set();
  for (const sheet of source.sheets) {
    let department = "";
    for (const [rowIndex, row] of sheet.values.entries()) {
      if (!/^\d+$/.test(row[1] || "")) continue;
      if (row[0]) department = clean(row[0]);
      const author = clean(row[2]);
      if (!author) throw new Error("Missing author");
      const campus = (sheet.name === "CORE" && row[1] === "2")
        || (sheet.name === "MEMBER" && department === "CHUYÊN MÔN" && harmonyMemberNumbers.has(Number(row[1]))) ? HARMONY : T37;
      let hasGeneralWish = false;
      for (let column = 3; column < row.length; column++) {
        const original = row[column] || "";
        const message = original.trim();
        if (!message) continue;
        const cell = `${String.fromCharCode(65 + column)}${rowIndex + 1}`;
        const sourceCell = `${sheet.name}!${cell}`;
        if (/^\(chưa nghĩ tiếp\)$/iu.test(message)) {
          skipped.push({ sourceCell, reason: "Unfinished draft" });
          continue;
        }
        const addressedTo = recipients[sheet.name][cell];
        if (addressedTo) routed.add(sourceCell);
        if (!addressedTo && /^(?:Gửi\s+(?:(?:đến|tới)\s+)?(?:(?:các|toàn bộ)\s+)?(?:thầy cô\s+)?tổ\b|Gửi\s+(?:(?:đến|tới)\s+)?(?:cô|thầy)\s+[A-ZĐ]|To Mr\.)/u.test(message)) {
          throw new Error(`Unreviewed named recipient at ${sourceCell}`);
        }
        if (!addressedTo && hasGeneralWish) {
          skipped.push({ sourceCell, reason: "Only one school-wide wish per author row" });
          continue;
        }
        if (!addressedTo) hasGeneralWish = true;
        const target = [normalizeTeacherName(addressedTo || SCHOOL_RECIPIENT)];
        const id = `sheet-${hash(`${SHEET_ID}:${sourceCell}`).slice(0, 28)}`;
        const name = `${ROOT}/wishes/${id}`;
        const value = { author, message, target };
        const fields = {
          author: string(author), authorSlug: string(slugify(author)), campus: string(campus),
          invitedBySlug: string("VTEC"), message: string(message), target: strings(target), targetSlugs: strings(target.map(slugify)),
          sourceSpreadsheetId: string(SHEET_ID), sourceSheet: string(sheet.name), sourceCell: string(cell),
        };
        // Sơn is at Harmony, but explicitly addresses the T37 department in this cell.
        if (sourceCell === "CORE!D3") fields.recipientCampus = string(T37);
        if (existingByName.has(name)) {
          const existing = existingByName.get(name);
          if (Object.entries(fields).some(([key, field]) => JSON.stringify(existing.fields[key]) !== JSON.stringify(field))) {
            throw new Error(`Existing import differs at ${sourceCell}; inspect instead of overwriting`);
          }
          skipped.push({ sourceCell, reason: "Already imported", existing: name });
          continue;
        }
        if (sourceCell === "MEMBER!D5") {
          const previous = snapshot.documents.find((document) => document.name.endsWith("/dsqYHy5uUEqOmBWek9wB"));
          if (previous && unpack(previous).author === author && /Porsche/i.test(unpack(previous).message)
            && unpack(previous).target.includes(target[0])) {
            skipped.push({ sourceCell, reason: "Same Porsche wish already submitted by this author", existing: previous.name });
            continue;
          }
        }
        const key = fingerprint(value);
        if (existingFingerprints.has(key)) {
          skipped.push({ sourceCell, reason: "Identical author, message and recipient already present" });
          continue;
        }
        existingFingerprints.add(key);
        entries.push({ sourceCell, name, fields });
      }
    }
  }
  for (const [sheet, mapping] of Object.entries(recipients)) {
    for (const cell of Object.keys(mapping)) {
      if (!routed.has(`${sheet}!${cell}`)) throw new Error(`Reviewed recipient cell missing: ${sheet}!${cell}`);
    }
  }
  return { project: PROJECT, source, snapshot, renames, updates: planUpdates(snapshot, renames), entries, skipped };
}

export async function applyImportPlan(plan, { fetchImpl = fetch, accessToken } = {}) {
  const rebuilt = buildImportPlan(plan.source, plan.snapshot);
  if (JSON.stringify(rebuilt) !== JSON.stringify(plan)) throw new Error("Import plan no longer matches its source and backup");
  const writes = [
    ...plan.updates.map((update) => ({
      update: { name: update.name, fields: update.fields }, updateMask: { fieldPaths: ["target", "targetSlugs"] },
      currentDocument: { updateTime: update.updateTime },
    })),
    ...plan.entries.map(({ name, fields }) => ({
      update: { name, fields }, currentDocument: { exists: false },
      updateTransforms: [{ fieldPath: "createAt", setToServerValue: "REQUEST_TIME" }],
    })),
  ];
  if (!writes.length) return { created: 0, updated: 0, verified: true };
  if (writes.length > 500) throw new Error("Import exceeds one atomic transaction");
  const result = await requestJson(`https://firestore.googleapis.com/v1/${ROOT}:commit`, {
    fetchImpl, retries: 0, method: "POST",
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify({ writes }),
  });
  const expected = new Map(plan.snapshot.documents.map((document) => [document.name, document.fields]));
  for (const update of plan.updates) expected.set(update.name, { ...expected.get(update.name), ...update.fields });
  for (const [index, entry] of plan.entries.entries()) {
    const timestamp = result.writeResults[plan.updates.length + index]?.transformResults?.[0];
    if (!timestamp?.timestampValue) throw new Error("Missing server timestamp in import result");
    expected.set(entry.name, { ...entry.fields, createAt: timestamp });
  }
  for (const [name, fields] of expected) {
    const live = await requestJson(`https://firestore.googleapis.com/v1/${name}`, { fetchImpl });
    if (JSON.stringify(Object.keys(live.fields).sort()) !== JSON.stringify(Object.keys(fields).sort())
      || Object.entries(fields).some(([key, field]) => JSON.stringify(live.fields[key]) !== JSON.stringify(field))) {
      throw new Error(`Post-import verification mismatch: ${name}`);
    }
  }
  return { created: plan.entries.length, updated: plan.updates.length, verified: true, commitTime: result.commitTime };
}

async function main() {
  const { values } = parseArgs({ options: {
    source: { type: "string" }, snapshot: { type: "string" }, plan: { type: "string" },
    apply: { type: "boolean", default: false }, "confirm-project": { type: "string" },
    "firebase-session": { type: "boolean", default: false },
  } });
  if (!values.plan) throw new Error("Specify --plan");
  if (values.apply) {
    if (values["confirm-project"] !== PROJECT) throw new Error(`Specify --confirm-project ${PROJECT}`);
    const plan = JSON.parse(await readFile(values.plan, "utf8"));
    let accessToken;
    if (values["firebase-session"]) {
      const configPath = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "configstore", "firebase-tools.json");
      const session = JSON.parse(await readFile(configPath, "utf8"));
      if (!session.tokens?.access_token || Number(session.tokens.expires_at) <= Date.now()) {
        throw new Error("Refresh the existing Firebase CLI session before importing");
      }
      accessToken = session.tokens.access_token;
    }
    const result = await applyImportPlan(plan, { accessToken });
    if (result.commitTime) {
      const after = await collectWishes({ readTime: result.commitTime });
      await writeNewFile(`${values.plan}.after.json`, `${JSON.stringify(after, null, 2)}\n`);
      result.total = after.documentCount;
    }
    console.log(JSON.stringify(result));
    return;
  }
  if (!values.source || !values.snapshot) throw new Error("Specify --source and --snapshot");
  const source = JSON.parse(await readFile(values.source, "utf8"));
  const snapshot = JSON.parse(await readFile(values.snapshot, "utf8"));
  const plan = buildImportPlan(source, snapshot);
  await writeNewFile(values.plan, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(JSON.stringify({ mode: "preview", created: plan.entries.length, updated: plan.updates.length,
    byTab: Object.fromEntries(source.sheets.map((sheet) => [sheet.name, plan.entries.filter((entry) => entry.sourceCell.startsWith(`${sheet.name}!`)).length])),
    skipped: plan.skipped, recipients: [...new Set(plan.entries.map((entry) => entry.fields.target.arrayValue.values[0].stringValue))],
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
