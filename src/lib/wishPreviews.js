import { filterWishes } from "./wishes.js";

export const PREVIEW_PERIOD_MS = 1500;
export const PREVIEW_FADE_MS = 200;
export const PREVIEW_IDLE_MS = 3000;

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function wishPreviewOrder(wishes, preferredCampus = "", random = Math.random) {
  const matching = new Set(filterWishes(wishes, { campus: preferredCampus }).map((wish) => wish.id));
  const preferred = [];
  const remaining = [];
  for (const wish of wishes) (matching.has(wish.id) ? preferred : remaining).push(wish.id);
  return [...shuffled(preferred, random), ...shuffled(remaining, random)];
}
