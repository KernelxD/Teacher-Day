import test from "node:test";
import assert from "node:assert/strict";
import { boardTeachers, filterWishes, fold, formatWishAuthor, groupWishesByTeacher, summarizeRecipients, teacherKey, wishTargetsTeacher } from "./wishes.js";

const anh = "Cô Ngọc Anh CVHT";
const anhWithAccent = "Cô Ngọc Ánh CVHT";

test("optional class appears with the author without changing older wishes", () => {
  assert.equal(formatWishAuthor({ name: "Nguyễn Minh An", studentClass: "  10A1  " }), "Nguyễn Minh An (10A1)");
  for (const studentClass of [undefined, null, "", "   "]) {
    assert.equal(formatWishAuthor({ name: "Nguyễn Minh An", studentClass }), "Nguyễn Minh An");
  }
});

test("teacher headers show only the campuses recorded on their wishes without duplicate tags", () => {
  const teachers = boardTeachers([
    { id: "old", to: [anh] },
    { id: "times", to: [anh], campus: "Times City (T37)" },
    { id: "times-again", to: [anh], campus: " Times City (T37) " },
    { id: "harmony", to: [anh], campus: "Harmony" },
    { id: "blank", to: [anhWithAccent], campus: "  " },
  ]);
  assert.deepEqual(teachers.find((teacher) => teacher.name === anh).campuses, ["Harmony", "Times City (T37)"]);
  assert.deepEqual(teachers.find((teacher) => teacher.name === anhWithAccent).campuses, []);
});

test("confirmed teacher campuses override sender campuses and the pinned group never has a campus tag", () => {
  const teachers = boardTeachers([
    { id: "old-anh", to: ["Cô Ngọc Anh (CVHT)"] },
    { id: "old-anh-accent", to: ["Cô Ngọc Ánh (CVHT)"], campus: "Times City (T37)" },
    { id: "school", to: ["Toàn thể giáo viên Vinschool"], campus: "Harmony" },
    { id: "dat", to: ["Thầy Lê Văn Đạt (Toán)"], campus: "Harmony" },
  ]);
  assert.deepEqual(teachers.find((teacher) => teacher.name === "Cô Ngọc Anh (CVHT)").campuses, ["Times City (T37)"]);
  assert.deepEqual(teachers.find((teacher) => teacher.name === "Cô Ngọc Ánh (CVHT)").campuses, ["Harmony"]);
  assert.deepEqual(teachers.find((teacher) => teacher.name === "Thầy Lê Văn Đạt (Toán)").campuses, ["Times City (T37)"]);
  assert.equal(teachers[0].pinned, true);
  assert.deepEqual(teachers[0].campuses, []);
});

test("the viewer's campus takes priority after the pinned group, ahead of wish counts", () => {
  const school = "Toàn thể giáo viên Vinschool";
  const timesCity = "Thầy Lê Văn Đạt (Toán)";
  const harmony = "Cô Ngọc Ánh (CVHT)";
  const wishes = [
    { id: "times-one", to: [timesCity] }, { id: "times-two", to: [timesCity] },
    { id: "harmony", to: [harmony] }, { id: "school", to: [school] },
  ];
  assert.deepEqual(boardTeachers(wishes, "Harmony").map((teacher) => teacher.name), [school, harmony, timesCity]);
  assert.deepEqual(boardTeachers(wishes, "Times City (T37)").map((teacher) => teacher.name), [school, timesCity, harmony]);
  assert.deepEqual(boardTeachers(wishes).map((teacher) => teacher.name), [school, timesCity, harmony]);
});

test("campus filters include shared wishes once and combine correctly with the teacher and text filters", () => {
  const timesCity = "Thầy Lê Văn Đạt (Toán)";
  const harmony = "Cô Ngọc Ánh (CVHT)";
  const wishes = [
    { id: "school", name: "An", to: ["Toàn thể giáo viên Vinschool"] },
    { id: "times", name: "Bình", to: [timesCity] },
    { id: "harmony", name: "Chi", to: [harmony] },
    { id: "shared", name: "Dũng", to: [timesCity, harmony] },
  ];
  const ids = (options) => filterWishes(wishes, options).map((wish) => wish.id);
  assert.deepEqual(ids({ campus: "Harmony" }), ["school", "harmony", "shared"]);
  assert.deepEqual(ids({ campus: "Times City (T37)" }), ["school", "times", "shared"]);
  assert.deepEqual(ids({ campus: "Harmony", teacher: teacherKey(timesCity) }), []);
  assert.deepEqual(ids({ campus: "Harmony", teacher: teacherKey(harmony) }), ["harmony", "shared"]);
  assert.deepEqual(ids({ campus: "Harmony", query: "dung" }), ["shared"]);
});

test("recipient previews put the current teacher first and show three names before the remainder count", () => {
  const names = ["Thầy Lê Văn Đạt (Toán)", "Cô Cao Thị Việt Anh (Lịch sử)", "Cô Phương Anh (Academic writing)", "Cô Nhi (Tiếng Trung)", "Cô Ngọc Anh (CVHT)"];
  assert.equal(summarizeRecipients(names, names[4]), `${names[4]}, ${names[0]}, ${names[1]} … + 2 thầy cô khác`);
  assert.equal(summarizeRecipients(names.slice(0, 3), names[2]), `${names[2]}, ${names[0]} và ${names[1]}`);
  assert.equal(summarizeRecipients([names[0]], names[0]), names[0]);
  assert.deepEqual(names[0], "Thầy Lê Văn Đạt (Toán)");
});

test("Ngọc Anh and Ngọc Ánh have separate groups and counts, including shared wishes", () => {
  const wishes = [
    { id: "anh-only", to: [anh] },
    { id: "anh-with-accent-only", to: [anhWithAccent] },
    { id: "both", to: [anh, anhWithAccent] },
  ];
  const groups = groupWishesByTeacher(wishes);
  assert.equal(groups.size, 2);
  assert.deepEqual(groups.get(teacherKey(anh)).wishes.map((wish) => wish.id), ["anh-only", "both"]);
  assert.deepEqual(groups.get(teacherKey(anhWithAccent)).wishes.map((wish) => wish.id), ["anh-with-accent-only", "both"]);
  assert.equal(groups.get(teacherKey(anh)).name, anh);
  assert.equal(groups.get(teacherKey(anhWithAccent)).name, anhWithAccent);
});

test("selecting either teacher excludes wishes addressed only to the other", () => {
  const wishes = [
    { id: "anh-only", to: [anh] },
    { id: "anh-with-accent-only", to: [anhWithAccent] },
    { id: "both", to: [anh, anhWithAccent] },
  ];
  assert.deepEqual(wishes.filter((wish) => wishTargetsTeacher(wish, teacherKey(anh))).map((wish) => wish.id), ["anh-only", "both"]);
  assert.deepEqual(wishes.filter((wish) => wishTargetsTeacher(wish, teacherKey(anhWithAccent))).map((wish) => wish.id), ["anh-with-accent-only", "both"]);
});

test("casing, spacing and equivalent Unicode accents still identify the same teacher", () => {
  const sameName = "  CÔ   NGỌC ÁNH   CVHT  ".normalize("NFD");
  const wish = { id: "one", to: [anhWithAccent, sameName, " "] };
  const groups = groupWishesByTeacher([wish]);
  assert.equal(groups.size, 1);
  assert.equal(groups.get(teacherKey(anhWithAccent)).wishes.length, 1);
  assert.ok(wishTargetsTeacher(wish, sameName));
  assert.ok(!wishTargetsTeacher(wish, ""));
});

test("Vietnamese letters and tones remain distinct, while text search stays accent-insensitive", () => {
  assert.notEqual(teacherKey("Cô Hà"), teacherKey("Cô Hạ"));
  assert.notEqual(teacherKey("Thầy Đạt"), teacherKey("Thầy Dạt"));
  assert.equal(fold(anh), fold(anhWithAccent));
});

test("the Vinschool group stays pinned first as other teachers receive more wishes", () => {
  const school = "Toàn thể giáo viên Vinschool";
  const wishes = [
    { id: "anh-one", to: [anh] },
    { id: "school", to: [school] },
    { id: "anh-two", to: [anh] },
    { id: "lan", to: ["Cô Lan"] },
  ];
  for (const entries of [wishes, [...wishes, { id: "lan-two", to: ["Cô Lan"] }, { id: "lan-three", to: ["Cô Lan"] }]]) {
    const teachers = boardTeachers(entries);
    assert.equal(teachers[0].name, school);
    assert.equal(teachers[0].pinned, true);
    assert.equal(teachers[0].count, 1);
    assert.ok(teachers.slice(1).every((teacher) => !teacher.pinned));
    assert.deepEqual(teachers.slice(1).map((teacher) => teacher.name), entries === wishes ? [anh, "Cô Lan"] : ["Cô Lan", anh]);
  }
});

test("the permanent pin recognizes casing, spacing and equivalent Unicode accents", () => {
  const teachers = boardTeachers([
    { id: "teacher", to: [anh] },
    { id: "school", to: ["  TOÀN THỂ   GIÁO VIÊN VINSCHOOL ".normalize("NFD")] },
  ]);
  assert.equal(teachers[0].key, teacherKey("Toàn thể giáo viên Vinschool"));
  assert.equal(teachers[0].pinned, true);
});

test("department columns stay pinned after the school-wide column regardless of teacher counts", () => {
  const wishes = [
    ...Array.from({ length: 12 }, (_, id) => ({ id, to: ["Cô Lan"], campus: "Harmony" })),
    { id: "math", to: ["Tổ Toán"], campus: "Times City (T37)" },
    { id: "school", to: ["Toàn thể giáo viên Vinschool"] },
    { id: "cs", to: ["Tổ Tin học"], campus: "Harmony" },
  ];
  const teachers = boardTeachers(wishes, "Harmony");
  assert.deepEqual(teachers.map((teacher) => teacher.name), ["Toàn thể giáo viên Vinschool", "Tổ Tin học", "Tổ Toán", "Cô Lan"]);
  assert.ok(teachers.slice(0, 3).every((teacher) => teacher.pinned));
  assert.ok(teachers.slice(0, 3).every((teacher) => teacher.campuses.length === 0));
  assert.equal(teachers[3].pinned, false);
  assert.deepEqual(filterWishes(wishes, { campus: "Harmony" }).map((wish) => wish.id), [
    ...Array.from({ length: 12 }, (_, id) => id), "math", "school", "cs",
  ]);
});

test("departments have no campus tags and stay available under either campus filter", () => {
  const wishes = [{ id: "cross-campus", to: ["Tổ Tin học"], campus: "Harmony", recipientCampus: "Times City (T37)" }];
  assert.deepEqual(boardTeachers(wishes)[0].campuses, []);
  assert.equal(filterWishes(wishes, { campus: "Harmony" }).length, 1);
  assert.equal(filterWishes(wishes, { campus: "Times City (T37)" }).length, 1);
});
