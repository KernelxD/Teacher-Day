import test from "node:test";
import assert from "node:assert/strict";
import { createRenderer, nextTick } from "vue";
import { campusFromLocation, lookupCampus } from "./campus.js";
import { useCampusSelection } from "./useCampusSelection.js";

test("IP district names select the matching campus with or without Vietnamese accents", () => {
  for (const district of ["Hai Bà Trưng", "Hai Ba Trung District", "Quận Hai Bà Trưng".normalize("NFD")]) {
    assert.equal(campusFromLocation({ country_code: "VN", district }), "Times City (T37)");
  }
  for (const city of ["Long Biên", "Long Bien", "Quận Long Biên"]) {
    assert.equal(campusFromLocation({ country_code: "VN", city }), "Harmony");
  }
});

test("unknown, ambiguous and proxy locations leave campus selection empty", () => {
  for (const location of [
    null, {}, { country_code: "VN", city: "Hà Nội" },
    { country_code: "VN", district: "Hai Bà Trưng", city: "Long Biên" },
    { country_code: "US", city: "Long Bien" },
    { country_code: "VN", city: "Long Bien", is_vpn: true },
    { country_code: "VN", city: "Long Bien", is_tor: true },
    { country_code: "VN", city: "Long Bien", success: false },
  ]) assert.equal(campusFromLocation(location), "");
});

test("a Hanoi IP estimate with no district still suggests T37, including Cloudflare hosting classifications", () => {
  const location = {
    country_code: "VN", city: "Hanoi", region: "Hanoi", district: null,
    latitude: 21.0184, longitude: 105.8461, accuracy_radius: 50,
    is_vpn: false, is_tor: false, is_hosting: true,
  };
  assert.equal(campusFromLocation(location), "Times City (T37)");
  assert.equal(campusFromLocation({ ...location, latitude: "21.0184", longitude: "105.8461" }), "Times City (T37)");
  assert.equal(campusFromLocation({ country_code: "VN", city: "Long Bien", is_hosting: true }), "Harmony");
});

test("IP coordinates near Harmony suggest Harmony even when the city is only Hanoi", () => {
  assert.equal(campusFromLocation({ country_code: "VN", city: "Hà Nội", latitude: 21.04804, longitude: 105.90395 }), "Harmony");
  assert.equal(campusFromLocation({ country_code: "VN", city: "Hà Nội", latitude: 20.99422, longitude: 105.86668 }), "Times City (T37)");
});

test("missing, invalid, distant or nearly equidistant coordinates keep the manual fallback", () => {
  const base = { country_code: "VN", city: "Hanoi" };
  for (const coordinates of [
    {}, { latitude: null, longitude: null }, { latitude: "", longitude: " " },
    { latitude: true, longitude: false }, { latitude: NaN, longitude: Infinity },
    { latitude: 91, longitude: 181 }, { latitude: 10.8231, longitude: 106.6297 },
    { latitude: 21.02113, longitude: 105.885315 },
  ]) assert.equal(campusFromLocation({ ...base, ...coordinates }), "");
});

test("lookup uses the caller's IP endpoint without credentials or a location permission API", async () => {
  let requests = 0;
  assert.equal(await lookupCampus(async (url, options) => {
    requests++;
    assert.equal(url, "https://ipconfig.is/json");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => ({ country_code: "VN", district: "Long Biên" }) };
  }), "Harmony");
  assert.equal(requests, 1);
});

test("network, rate-limit and malformed responses leave the form usable for manual selection", async () => {
  for (const fetchImpl of [
    async () => { throw new Error("offline"); },
    async () => ({ ok: false, status: 429 }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError("invalid JSON"); } }),
    async () => ({ ok: true, json: async () => ({ error: "unavailable" }) }),
  ]) assert.equal(await lookupCampus(fetchImpl), "");
});

test("the live lookup pipeline accepts city-level coordinates without requiring a district", async () => {
  assert.equal(await lookupCampus(async () => ({
    ok: true,
    json: async () => ({ country_code: "VN", city: "Hanoi", district: null, latitude: 21.0184, longitude: 105.8461, is_hosting: true }),
  })), "Times City (T37)");
});

test("a stalled IP lookup times out and leaves campus empty", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = lookupCampus((_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
  t.mock.timers.tick(4000);
  assert.equal(await pending, "");
});

test("each visit logs either the detected campus or the manual-selection fallback and shares one lookup", async (t) => {
  const logs = [];
  const log = t.mock.method(console, "info", (...args) => logs.push(args.join(" ")));
  for (const [scenario, city, expected] of [["known", "Long Biên", "Harmony"], ["unknown", "Hà Nội", ""]]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ country_code: "VN", city }) }));
    const { suggestCampus } = await import(`./campus.js?scenario=${scenario}`);
    assert.deepEqual(await Promise.all([suggestCampus(), suggestCampus()]), [expected, expected]);
    assert.equal(fetchMock.mock.callCount(), 1);
    fetchMock.mock.restore();
  }
  assert.ok(logs[0].includes("Harmony"));
  assert.ok(logs[1].includes("Không xác định"));
  assert.equal(log.mock.callCount(), 2);
});

function mountSelection() {
  let complete;
  let selection;
  const pending = new Promise((resolve) => { complete = resolve; });
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {},
  });
  const app = renderer.createApp({
    setup() {
      selection = useCampusSelection({ lookup: () => pending });
      return () => null;
    },
  });
  app.mount({});
  return { app, selection, complete };
}

test("an IP suggestion fills an untouched dropdown", async () => {
  const { app, selection, complete } = mountSelection();
  complete("Harmony");
  await nextTick();
  assert.equal(selection.campus.value, "Harmony");
  app.unmount();
});

test("a late IP response never overwrites a manual selection, including choosing empty", async () => {
  for (const chosen of ["", "Times City (T37)"]) {
    const { app, selection, complete } = mountSelection();
    selection.campus.value = chosen;
    selection.markCampusChosen();
    complete("Harmony");
    await nextTick();
    assert.equal(selection.campus.value, chosen);
    app.unmount();
  }
});

test("a response arriving after the form unmounts is ignored", async () => {
  const { app, selection, complete } = mountSelection();
  app.unmount();
  complete("Harmony");
  await nextTick();
  assert.equal(selection.campus.value, "");
});
