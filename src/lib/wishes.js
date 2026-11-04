// Small helpers shared by the wishing tree components.

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
