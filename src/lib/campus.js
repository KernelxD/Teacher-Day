import { clean, fold } from "./wishes.js";

export const CAMPUSES = ["Times City (T37)", "Harmony"];

// Approximate campus-area anchors for choosing a nearby campus from coarse IP coordinates.
// https://www.openstreetmap.org/way/589521938 (Times City)
// https://www.openstreetmap.org/way/1368995956 (Harmony)
const CAMPUS_AREAS = [
  { campus: CAMPUSES[0], latitude: 20.99422, longitude: 105.86668 },
  { campus: CAMPUSES[1], latitude: 21.04804, longitude: 105.90395 },
];

function coordinate(value, limit) {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function distanceKm(latitude, longitude, area) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(area.latitude - latitude);
  const dLon = radians(area.longitude - longitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(latitude)) * Math.cos(radians(area.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

function campusFromCoordinates(location) {
  const latitude = coordinate(location.latitude, 90);
  const longitude = coordinate(location.longitude, 180);
  if (latitude === null || longitude === null) return "";
  const nearest = CAMPUS_AREAS.map((area) => ({ campus: area.campus, distance: distanceKm(latitude, longitude, area) }))
    .sort((a, b) => a.distance - b.distance);
  // IP coordinates are approximate: leave distant or nearly tied results for manual selection.
  if (nearest[0].distance > 15 || nearest[1].distance - nearest[0].distance < 1) return "";
  return nearest[0].campus;
}

export function campusFromLocation(location) {
  if (!location || location.error || location.success === false || location.country_code !== "VN"
    || location.is_vpn || location.is_tor) return "";
  const areas = [location.district, location.city, location.region]
    .filter((value) => typeof value === "string")
    .map((value) => fold(clean(value)).replace(/[^a-z0-9]+/g, " "));
  const timesCity = areas.some((area) => /\bhai ba trung\b/.test(area));
  const harmony = areas.some((area) => /\blong bien\b/.test(area));
  if (timesCity && harmony) return "";
  if (timesCity || harmony) return timesCity ? CAMPUSES[0] : CAMPUSES[1];
  // Providers often return just "Hanoi" with usable coordinates and no district.
  // A hosting flag alone (for example Cloudflare) does not invalidate that estimate.
  return campusFromCoordinates(location);
}

// Client-side lookup of the visitor's IP. No device-location API is used.
// Provider fields and browser CORS support: https://ipconfig.is/api
export async function lookupCampus(fetchImpl = globalThis.fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetchImpl("https://ipconfig.is/json", {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return "";
    return campusFromLocation(await response.json());
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

let suggestion;
export function suggestCampus() {
  // One request per page, shared by both forms. Keep only the suggested campus.
  return suggestion ??= lookupCampus().then((campus) => {
    if (campus) console.info("[Cơ sở] Kết quả đoán theo IP:", campus);
    else console.info("[Cơ sở] Không xác định được cơ sở từ IP. Giữ lựa chọn thủ công.");
    return campus;
  });
}
