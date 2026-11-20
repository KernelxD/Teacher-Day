import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { collectWishes, requestJson, validateSnapshot, writeNewFile } from "./wishes-backup.mjs";
import { slugify } from "../src/lib/slugify.js";

const PROJECT = "vtec-teacher-day";
const ROOT = `projects/${PROJECT}/databases/(default)/documents`;
const strings = (values) => ({ arrayValue: { values: values.map((stringValue) => ({ stringValue })) } });

export function planUpdates(snapshot, mapping) {
  validateSnapshot(snapshot);
  const updates = [];
  for (const document of snapshot.documents) {
    const names = (document.fields.target?.arrayValue?.values || []).map((value) => value.stringValue);
    if (names.some((name) => typeof name !== "string")) throw new Error("Non-string teacher name; inspect manually");
    const next = [...new Set(names.map((name) => Object.hasOwn(mapping, name) ? mapping[name] : name))];
    if (next.some((name) => typeof name !== "string" || !name.trim())) throw new Error("Invalid teacher replacement");
    if (JSON.stringify(next) === JSON.stringify(names)) continue;
    if (!document.updateTime) throw new Error("Missing concurrency precondition");
    updates.push({
      name: document.name, updateTime: document.updateTime,
      before: names, after: next,
      fields: { target: strings(next), targetSlugs: strings(next.map(slugify)) },
    });
  }
  return updates;
}

export async function applyUpdates(updates, { fetchImpl = fetch, accessToken } = {}) {
  if (!updates.length) return { updated: 0 };
  const result = await requestJson(`https://firestore.googleapis.com/v1/${ROOT}:commit`, {
    fetchImpl, retries: 0, method: "POST",
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify({ writes: updates.map((update) => ({
      update: { name: update.name, fields: update.fields },
      updateMask: { fieldPaths: ["target", "targetSlugs"] },
      currentDocument: { updateTime: update.updateTime },
    })) }),
  });
  return { updated: result.writeResults.length, commitTime: result.commitTime };
}

async function main() {
  const { values } = parseArgs({ options: {
    mapping: { type: "string" }, plan: { type: "string" }, apply: { type: "boolean", default: false },
    "confirm-project": { type: "string" },
  } });
  if (!values.plan) throw new Error("Specify --plan backups/teacher-title-plan.json");
  if (!values.apply) {
    if (!values.mapping) throw new Error("Specify --mapping with explicitly confirmed name replacements");
    const mapping = JSON.parse(await readFile(values.mapping, "utf8"));
    const snapshot = await collectWishes();
    const backup = `${values.plan}.before.json`;
    const updates = planUpdates(snapshot, mapping);
    await writeNewFile(backup, `${JSON.stringify(snapshot, null, 2)}\n`);
    await writeNewFile(values.plan, `${JSON.stringify({ project: PROJECT, backup, mapping, updates }, null, 2)}\n`);
    console.log(JSON.stringify({ mode: "preview", wishes: snapshot.documentCount, affectedWishes: updates.length,
      replacements: mapping, backup, plan: values.plan }, null, 2));
    return;
  }
  if (values["confirm-project"] !== PROJECT) throw new Error(`Specify --confirm-project ${PROJECT}`);
  const plan = JSON.parse(await readFile(values.plan, "utf8"));
  if (plan.project !== PROJECT) throw new Error("Unexpected project");
  const snapshot = validateSnapshot(JSON.parse(await readFile(plan.backup, "utf8")));
  const updates = planUpdates(snapshot, plan.mapping);
  if (JSON.stringify(updates) !== JSON.stringify(plan.updates)) throw new Error("Plan does not match the saved backup");
  const result = await applyUpdates(updates, { accessToken: process.env.FIRESTORE_ACCESS_TOKEN });
  // Read each changed document with strong consistency and check all stored fields.
  for (const update of updates) {
    const live = await requestJson(`https://firestore.googleapis.com/v1/${update.name}`);
    const before = snapshot.documents.find((document) => document.name === update.name);
    for (const field of new Set([...Object.keys(before.fields), ...Object.keys(live.fields)])) {
      const expected = Object.hasOwn(update.fields, field) ? update.fields[field] : before.fields[field];
      if (JSON.stringify(live.fields[field]) !== JSON.stringify(expected)) {
        throw new Error(`Verification mismatch in ${field}; saved pre-update backup is ${plan.backup}`);
      }
    }
  }
  console.log(JSON.stringify({ ...result, verified: true, backup: plan.backup }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
