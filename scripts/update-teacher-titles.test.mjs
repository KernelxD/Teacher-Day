import test from "node:test";
import assert from "node:assert/strict";
import { collectWishes } from "./wishes-backup.mjs";
import { applyUpdates, planUpdates } from "./update-teacher-titles.mjs";
import { TEACHER_RENAMES } from "../src/lib/teachers.js";
import { slugify } from "../src/lib/slugify.js";

const document = (id, teacher) => ({
  name: `projects/vtec-teacher-day/databases/(default)/documents/wishes/${id}`,
  updateTime: "2026-11-17T14:00:00.123456Z",
  fields: { target: { arrayValue: { values: [{ stringValue: teacher }] } },
    message: { stringValue: "Original wish" }, createAt: { timestampValue: "2026-11-17T14:00:00.123456Z" } },
});
const snapshot = () => collectWishes({ fetchImpl: async () => ({ ok: true, json: async () => ({ documents: [
  document("first", "Lê Văn Đạt"), document("second", "Đặng Nhất Linh"),
] }) }) });

test("the migration changes only confirmed names and derives matching legacy lookup slugs", async () => {
  const source = await snapshot();
  const original = structuredClone(source);
  const updates = planUpdates(source, { "Lê Văn Đạt": "Thầy Lê Văn Đạt" });
  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].after, ["Thầy Lê Văn Đạt"]);
  assert.deepEqual(updates[0].fields.targetSlugs.arrayValue.values, [{ stringValue: "thay-le-van-dat" }]);
  assert.deepEqual(source, original);
  assert.deepEqual(Object.keys(updates[0].fields).sort(), ["target", "targetSlugs"]);
});

test("migration writes are atomic and conditional on the saved document version", async () => {
  const source = await snapshot();
  const updates = planUpdates(source, { "Lê Văn Đạt": "Thầy Lê Văn Đạt" });
  let sent;
  const result = await applyUpdates(updates, { fetchImpl: async (url, options) => {
    assert.ok(url.endsWith("/documents:commit"));
    assert.equal(options.method, "POST");
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ writeResults: [{}], commitTime: "2026-11-17T15:00:00Z" }) };
  } });
  assert.equal(result.updated, 1);
  assert.deepEqual(sent.writes[0].updateMask.fieldPaths, ["target", "targetSlugs"]);
  assert.deepEqual(sent.writes[0].currentDocument, { updateTime: source.documents[0].updateTime });
  let calls = 0;
  await assert.rejects(applyUpdates(updates, { fetchImpl: async () => {
    calls++;
    return { ok: false, status: 400, json: async () => ({ error: { status: "FAILED_PRECONDITION" } }) };
  } }), /FAILED_PRECONDITION/);
  assert.equal(calls, 1);
});

test("merging recipients deduplicates each wish while keeping Ngọc Anh and Ngọc Ánh separate", async () => {
  const shared = document("shared", "Thầy Đạt");
  shared.fields.target.arrayValue.values.push(...[
    "Thầy Đạt toán", "Thầy Lê Văn Đạt", "Tất cả thầy cô", "Toàn thể giáo viên Vinschool",
    "Cô Việt Anh sử", "Cô Cao Thị Việt Anh", "Cô Ngọc Anh CVHT", "Cô Ngọc Ánh CVHT",
  ].map((stringValue) => ({ stringValue })));
  shared.fields.studentClass = { stringValue: "10A1" };
  const source = await collectWishes({ fetchImpl: async () => ({ ok: true, json: async () => ({ documents: [shared] }) }) });
  const updates = planUpdates(source, TEACHER_RENAMES);
  assert.deepEqual(updates[0].after, [
    "Thầy Lê Văn Đạt (Toán)", "Toàn thể giáo viên Vinschool", "Cô Cao Thị Việt Anh (Lịch sử)",
    "Cô Ngọc Anh (CVHT)", "Cô Ngọc Ánh (CVHT)",
  ]);
  assert.deepEqual(updates[0].fields.targetSlugs.arrayValue.values.map((entry) => entry.stringValue), updates[0].after.map(slugify));
  assert.deepEqual(Object.keys(updates[0].fields).sort(), ["target", "targetSlugs"]);
});
