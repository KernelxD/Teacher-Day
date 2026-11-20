// Small helpers shared by the wishing tree components.
import { TEACHER_CAMPUSES } from "./teacherDirectory.js";
import { PINNED_RECIPIENTS } from "./recipientGroups.js";

export const ACCENT = "#F5A43A";

// Tag colors on the tree, and softer versions of the same colors for avatars.
export const PALETTE = ["#4FC8D8", "#6FA3EA", "#F2766A", "#F59A4A", "#F5C84C", "#F3E27A", "#A8DC7A", "#6CC49A"];
export const SOFT = ["#CDEFF3", "#D9E5FB", "#FCD9D5", "#FDE3C9", "#FCEFC4", "#FAF4CC", "#E2F4D2", "#D3F0E2"];
// Count badges on the board columns.
export const TINTS = ["#FDEBCB", "#E2F1DC", "#E3EEF9", "#F6E3DC", "#ECE7FA"];

export const MINE_COLOR = "#F5C84C";

// Blend two hex colors: t = 0 gives a, t = 1 gives b.
export function mix(a, b, t) {
  const hex = (h) => {
    const v = String(h).replace("#", "");
    const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
  };
  const A = hex(a);
  const B = hex(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// ["Cô Lan", "Thầy Minh", "Cô Mai"] -> "Cô Lan, Thầy Minh và Cô Mai"
export function joinNames(list) {
  if (!list || list.length === 0) return "";
  if (list.length === 1) return list[0];
  return list.slice(0, -1).join(", ") + " và " + list[list.length - 1];
}

export function summarizeRecipients(names, currentTeacher) {
  const unique = [...new Map(names.map((name) => [teacherKey(name), clean(name)])).values()];
  const current = unique.findIndex((name) => teacherKey(name) === teacherKey(currentTeacher));
  if (current > 0) unique.unshift(...unique.splice(current, 1));
  if (unique.length <= 3) return joinNames(unique);
  return `${unique.slice(0, 3).join(", ")} … + ${unique.length - 3} thầy cô khác`;
}

// "Nguyễn Minh An" -> "MA"
export function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0) : parts[0].charAt(0);
  return letters.toUpperCase();
}

// Names can't contain punctuation, symbols or digits (same rule as WishForm).
export function isValidName(str) {
  return /^[^\p{P}\p{S}\d]+$/u.test(String(str || "").trim());
}

// Trim and collapse repeated spaces.
export function clean(str) {
  return String(str || "").trim().replace(/\s+/g, " ");
}

export function formatWishAuthor(wish) {
  const name = clean(wish.name);
  const studentClass = clean(wish.studentClass);
  return studentClass ? `${name} (${studentClass})` : name;
}

// Teacher identity preserves Vietnamese accents; casing and extra spaces are ignored.
export function teacherKey(name) {
  return clean(name).normalize("NFC").toLocaleLowerCase("vi");
}

export function wishTargetsTeacher(wish, teacher) {
  const key = teacherKey(teacher);
  return !!key && wish.to.some((name) => teacherKey(name) === key);
}

// Count each wish once per teacher, even if a recipient appears with different casing.
export function groupWishesByTeacher(wishes) {
  const groups = new Map();
  for (const wish of wishes) {
    const seen = new Set();
    for (const name of wish.to) {
      const key = teacherKey(name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (!groups.has(key)) groups.set(key, { key, name: clean(name).normalize("NFC"), wishes: [] });
      groups.get(key).wishes.push(wish);
    }
  }
  return groups;
}

// The school-wide and department groups stay first; teachers follow campus and wish count.
export function boardTeachers(wishes, preferredCampus = "") {
  const pinnedOrder = new Map(PINNED_RECIPIENTS.map((name, index) => [teacherKey(name), index]));
  const confirmedCampuses = new Map(Object.entries(TEACHER_CAMPUSES).map(([name, campus]) => [teacherKey(name), campus]));
  return [...groupWishesByTeacher(wishes).values()]
    .map(({ key, name, wishes }) => ({
      key, name, count: wishes.length, pinned: pinnedOrder.has(key),
      campuses: pinnedOrder.has(key) ? [] : confirmedCampuses.has(key) ? [confirmedCampuses.get(key)]
        : [...new Set(wishes.map((wish) => clean(wish.campus)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")),
    }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned)
      || (a.pinned && b.pinned ? pinnedOrder.get(a.key) - pinnedOrder.get(b.key) : 0)
      || Number(b.campuses.includes(preferredCampus)) - Number(a.campuses.includes(preferredCampus))
      || b.count - a.count || a.name.localeCompare(b.name, "vi"));
}

export function filterWishes(wishes, { query = "", teacher = "", campus = "" } = {}) {
  const q = fold(query);
  const allowed = teacher || campus ? new Set(boardTeachers(wishes)
    .filter((entry) => (!teacher || entry.key === teacher)
      && (!campus || entry.pinned || entry.campuses.includes(campus)))
    .map((entry) => entry.key)) : null;
  return wishes.filter((wish) => {
    const matchesQuery = !q || fold(formatWishAuthor(wish)).includes(q)
      || fold(wish.content).includes(q) || wish.to.some((name) => fold(name).includes(q));
    return matchesQuery && (!allowed || wish.to.some((name) => allowed.has(teacherKey(name))));
  });
}

// Lowercase without Vietnamese accents, for search. Not the same as slugify().
export function fold(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}
