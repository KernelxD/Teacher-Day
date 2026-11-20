import test from "node:test";
import assert from "node:assert/strict";
import { TEACHER_RENAMES, isValidTeacherName, normalizeTeacherName, resolveTeacherName, teacherOptionsForCampus, teacherSuggestions, uniqueTeacherNames } from "./teachers.js";
import { slugify } from "./slugify.js";

const names = ["Cô Ngọc Anh (CVHT)", "Cô Ngọc Ánh (CVHT)", "Thầy Lê Văn Đạt (Toán)", "Đặng Nhất Linh"];

test("suggestions find existing names without accents or a title, and exclude selected entries", () => {
  assert.deepEqual(teacherSuggestions(names, "ngoc anh", [names[0]]), [names[1]]);
  assert.deepEqual(teacherSuggestions(names, "lê văn"), [names[2]]);
  assert.deepEqual(teacherSuggestions(names, "Ngọc Anh"), [names[0], names[1]]);
});

test("recipient suggestions follow the selected campus while keeping the school-wide recipient", () => {
  const school = "Toàn thể giáo viên Vinschool";
  const options = [...names, school];
  const t37 = teacherOptionsForCampus(options, "Times City (T37)");
  const harmony = teacherOptionsForCampus(options, "Harmony");
  assert.ok(t37.includes(names[0]));
  assert.ok(!t37.includes(names[1]));
  assert.ok(harmony.includes(names[1]));
  assert.ok(!harmony.includes(names[0]));
  assert.ok(!harmony.includes(names[2]));
  assert.ok(t37.includes(school) && harmony.includes(school));
  assert.deepEqual(teacherSuggestions(t37, "ngoc anh"), [names[0]]);
  assert.deepEqual(teacherSuggestions(harmony, "ngoc anh"), [names[1]]);
  assert.deepEqual(teacherOptionsForCampus(options), options);
});

test("database campus assignments also filter new teachers and departments without changing confirmed campuses", () => {
  const options = ["Cô Giáo Mới", "Tổ Tin học", "Toàn thể giáo viên Vinschool", names[0]];
  const campuses = {
    "cô giáo mới": ["Harmony"], "tổ tin học": ["Times City (T37)"],
    "cô ngọc anh (cvht)": ["Harmony"],
  };
  assert.deepEqual(teacherOptionsForCampus(options, "Harmony", campuses), [options[0], options[2]]);
  assert.deepEqual(teacherOptionsForCampus(options, "Times City (T37)", campuses), [options[1], options[2], names[0]]);
  assert.deepEqual(options, ["Cô Giáo Mới", "Tổ Tin học", "Toàn thể giáo viên Vinschool", names[0]]);
});

test("known spelling is reused only for unambiguous accent-preserving matches", () => {
  assert.equal(resolveTeacherName(" cô  ngọc ánh cvht ".normalize("NFD"), names), names[1]);
  assert.equal(resolveTeacherName("Lê Văn Đạt", names), names[2]);
  assert.equal(resolveTeacherName("Ngọc Anh CVHT", names), names[0]);
  assert.equal(resolveTeacherName("Ngoc Anh CVHT", names), "Ngoc Anh CVHT");
  assert.equal(resolveTeacherName("An", ["Cô An", "Thầy An"]), "An");
});

test("untitled and collective recipients remain allowed", () => {
  assert.deepEqual(uniqueTeacherNames(["Đặng Nhất Linh"], names), ["Đặng Nhất Linh"]);
  assert.deepEqual(uniqueTeacherNames(["Tất cả thầy cô", "Toàn thể giáo viên Vinschool"]), ["Toàn thể giáo viên Vinschool"]);
});

test("recipient normalization and deduplication preserve distinct accented teachers", () => {
  assert.equal(normalizeTeacherName("gửi cô Hà Anh"), "Cô Hà Anh");
  assert.deepEqual(uniqueTeacherNames(["cô ngọc anh cvht", names[0], names[1]], names), [names[0], names[1]]);
  assert.equal(slugify("Thầy Lê Văn Đạt"), "thay-le-van-dat");
});

test("approved aliases reuse the renamed teacher, including case and spacing variations", () => {
  for (const [alias, canonical] of Object.entries(TEACHER_RENAMES)) {
    assert.equal(normalizeTeacherName(alias), canonical);
    assert.equal(resolveTeacherName(`  ${alias.toLocaleUpperCase('vi')}  `.normalize('NFD')), canonical);
  }
  assert.deepEqual(uniqueTeacherNames(["Thầy Đạt", "Thầy Đạt toán", "Thầy Lê Văn Đạt"]), [names[2]]);
  assert.deepEqual(uniqueTeacherNames(["Cô Việt Anh sử", "Cô Cao Thị Việt Anh"]), ["Cô Cao Thị Việt Anh (Lịch sử)"]);
  assert.deepEqual(uniqueTeacherNames(["Cô Ngọc Anh CVHT", "Cô Ngọc Ánh CVHT"]), names.slice(0, 2));
});

test("teacher subjects and roles in parentheses are accepted while invalid names remain rejected", () => {
  for (const canonical of Object.values(TEACHER_RENAMES)) assert.ok(isValidTeacherName(canonical), canonical);
  for (const invalid of ["", "Cô 123", "Cô Hoa @", "Cô Hoa (SPO", "Cô Hoa ( )", "Cô Hoa ((SPO))"]) {
    assert.ok(!isValidTeacherName(invalid), invalid);
  }
});

test("Mr. and Ms. titles normalize, validate and resolve through the teacher suggestions", () => {
  const teachers = ["Mr. Robert Padilla (CS)", "Ms. Phương Anh (Academic writing)", "Mr. Arfan Anwar"];
  assert.equal(normalizeTeacherName("mr robert padilla"), teachers[0]);
  assert.equal(normalizeTeacherName("MS. Phương Anh (Academic writing)"), teachers[1]);
  assert.equal(resolveTeacherName("Arfan Anwar", teachers), teachers[2]);
  assert.deepEqual(teacherSuggestions(teachers, "robert"), [teachers[0]]);
  for (const name of [...teachers, "Mr Austin", "Ms. Lan"]) assert.ok(isValidTeacherName(name), name);
  for (const name of ["Mr. 123", "Ms. Lan!", "Mr.. Robert", "Dr. Test"]) assert.ok(!isValidTeacherName(name), name);
});
