import { clean, fold, isValidName, teacherKey } from "./wishes.js";
import { TEACHER_CAMPUSES } from "./teacherDirectory.js";
import { SCHOOL_RECIPIENT } from "./recipientGroups.js";

export const TEACHER_RENAMES = Object.freeze({
  "Thầy Lê Văn Đạt": "Thầy Lê Văn Đạt (Toán)",
  "Thầy Đạt": "Thầy Lê Văn Đạt (Toán)",
  "Thầy Đạt toán": "Thầy Lê Văn Đạt (Toán)",
  "Cô Cao Thị Việt Anh": "Cô Cao Thị Việt Anh (Lịch sử)",
  "Cô Việt Anh sử": "Cô Cao Thị Việt Anh (Lịch sử)",
  "Cô Hoa SPO": "Cô Hoa (SPO)",
  "Cô Ngọc Anh CVHT": "Cô Ngọc Anh (CVHT)",
  "Cô Ngọc Ánh CVHT": "Cô Ngọc Ánh (CVHT)",
  "Cô Nhi tiếng Trung": "Cô Hoàng Trí Nhi (Tiếng Trung)",
  "Cô Nhi (Tiếng Trung)": "Cô Hoàng Trí Nhi (Tiếng Trung)",
  "Cô Hoàng Trí Nhi": "Cô Hoàng Trí Nhi (Tiếng Trung)",
  "Cô Hiền Mai": "Cô Nguyễn Hiền Mai",
  "Cô Loan": "Cô Nguyễn Thị Loan",
  "Thầy Robert Padilla": "Mr. Robert Padilla (CS)",
  "Thầy Robert Padilla (CS)": "Mr. Robert Padilla (CS)",
  "Mr. Robert Padilla": "Mr. Robert Padilla (CS)",
  "Thầy Austin": "Mr. Austin (Physics)",
  "Thầy Austin (Physics)": "Mr. Austin (Physics)",
  "Mr. Austin": "Mr. Austin (Physics)",
  "Thầy Wayan": "Mr. Wayan (Math)",
  "Thầy Wayan (Math)": "Mr. Wayan (Math)",
  "Mr. Wayan": "Mr. Wayan (Math)",
  "Thầy Arfan Anwar": "Mr. Arfan Anwar",
  "Tổ Tin": "Tổ Tin học",
  "Tổ Tin học T37": "Tổ Tin học",
  "Tổ Văn": "Tổ Ngữ văn",
  "Cô Phương Anh aca writing": "Ms. Phương Anh (Academic writing)",
  "Cô Phương Anh (Academic writing)": "Ms. Phương Anh (Academic writing)",
  "Tất cả thầy cô": "Toàn thể giáo viên Vinschool",
});
const canonicalTeachers = new Map(Object.entries(TEACHER_RENAMES).map(([name, canonical]) => [teacherKey(name), canonical]));

export function normalizeTeacherName(name) {
  const value = clean(name).normalize("NFC")
    .replace(/^gửi\s+(?=(?:thầy|cô)\s)/iu, "")
    .replace(/^(thầy|cô|mr\.?|ms\.?)(?=\s|$)/iu, (title) => ({
      "thầy": "Thầy", "cô": "Cô", "mr": "Mr.", "ms": "Ms.",
    })[title.toLocaleLowerCase("vi").replace(/\.$/, "")]);
  return canonicalTeachers.get(teacherKey(value)) || value;
}

// A subject or role may follow the teacher's name in parentheses.
export function isValidTeacherName(name) {
  const match = normalizeTeacherName(name).replace(/^(?:Mr|Ms)\.\s+/u, "")
    .match(/^([^()]+?)(?:\s+\(([\p{L}\p{M}\s]+)\))?$/u);
  return !!match && isValidName(match[1]) && (!match[2] || !!match[2].trim());
}

const withoutTitle = (name) => normalizeTeacherName(name)
  .replace(/^(?:Thầy|Cô|Mr\.|Ms\.)\s+/u, "").replace(/\s+\([^()]+\)$/u, "");

export function resolveTeacherName(name, existing = []) {
  const value = normalizeTeacherName(name);
  const exact = existing.find((option) => teacherKey(option) === teacherKey(value));
  if (exact) return normalizeTeacherName(exact);
  // Only fill a known title when the accented name identifies exactly one entry.
  if (!/^(?:Thầy|Cô|Mr\.|Ms\.)\s/u.test(value)) {
    const candidates = new Set([value, `Thầy ${value}`, `Cô ${value}`].map((name) => teacherKey(withoutTitle(name))));
    const matches = existing.filter((option) => candidates.has(teacherKey(withoutTitle(option))));
    if (matches.length === 1) return normalizeTeacherName(matches[0]);
  }
  return value;
}

export function teacherOptionsForCampus(existing, campus = "", campusesByTeacher = {}) {
  const names = uniqueTeacherNames(existing);
  if (!campus) return names;
  const confirmed = new Map(Object.entries(TEACHER_CAMPUSES).map(([name, school]) => [teacherKey(name), [school]]));
  return names.filter((name) => {
    const key = teacherKey(name);
    if (key === teacherKey(SCHOOL_RECIPIENT)) return true;
    const recorded = campusesByTeacher[key];
    const campuses = confirmed.get(key) || (Array.isArray(recorded) ? recorded : []);
    // Keep recipients with no campus assignment available for either school.
    return !campuses.length || campuses.includes(campus);
  });
}

export function teacherSuggestions(existing, query, selected = []) {
  const terms = fold(normalizeTeacherName(query)).split(/\s+/).filter(Boolean);
  const precise = teacherKey(withoutTitle(query));
  const selectedKeys = new Set(selected.map(teacherKey));
  return uniqueTeacherNames(existing)
    .filter((name) => !selectedKeys.has(teacherKey(name)) && terms.every((term) => fold(name).includes(term)))
    .sort((a, b) => {
      const rank = (name) => teacherKey(withoutTitle(name)).includes(precise) ? 0 : 1;
      return rank(a) - rank(b) || a.localeCompare(b, "vi");
    })
    .slice(0, 8);
}

export function uniqueTeacherNames(names, existing = []) {
  const result = new Map();
  for (const name of names) {
    const value = resolveTeacherName(name, existing);
    if (value) result.set(teacherKey(value), value);
  }
  return [...result.values()];
}
