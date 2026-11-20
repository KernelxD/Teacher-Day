import test from "node:test";
import assert from "node:assert/strict";
import { createRenderer, reactive } from "vue";
import { wishPreviewOrder } from "./wishPreviews.js";
import { useWishPreviews } from "./useWishPreviews.js";

const wishes = [
  { id: "times-one", to: ["Thầy Lê Văn Đạt (Toán)"] },
  { id: "harmony", to: ["Cô Ngọc Ánh (CVHT)"] },
  { id: "times-two", to: ["Cô Ngọc Anh (CVHT)"] },
];

test("random preview order prioritizes the visitor's campus and includes every wish once", () => {
  const order = wishPreviewOrder(wishes, "Harmony", () => 0);
  assert.equal(order[0], "harmony");
  assert.deepEqual(new Set(order), new Set(wishes.map((wish) => wish.id)));
  assert.deepEqual(wishPreviewOrder(wishes, "Times City (T37)", () => 0), ["times-two", "times-one", "harmony"]);
  assert.notDeepEqual(wishPreviewOrder(wishes, "", () => 0), wishes.map((wish) => wish.id));
  assert.deepEqual(wishes.map((wish) => wish.id), ["times-one", "harmony", "times-two"]);
});

function mountPreviews(t, initial = {}) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const window = new EventTarget();
  const document = new EventTarget();
  document.hidden = false;
  globalThis.window = window;
  globalThis.document = document;
  const props = reactive({ wishes, preferredCampus: "Harmony", enabled: true, ...initial });
  let previews;
  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {} });
  const app = renderer.createApp({
    setup() {
      previews = useWishPreviews({
        wishes: () => props.wishes, preferredCampus: () => props.preferredCampus,
        enabled: () => props.enabled, random: () => 0.99,
      });
      return () => null;
    },
  });
  app.mount({});
  t.after(() => {
    app.unmount();
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  });
  return { app, props, previews, window, document };
}

test("previews start on entry, fade out and show another wish after 1.5 seconds", (t) => {
  const { previews } = mountPreviews(t);
  assert.equal(previews.peekId.value, "harmony");
  t.mock.timers.tick(1300);
  assert.equal(previews.peekId.value, null);
  t.mock.timers.tick(200);
  assert.equal(previews.peekId.value, "times-one");
});

test("pointer activity pauses previews until three seconds after the last movement", (t) => {
  const { previews, window } = mountPreviews(t);
  window.dispatchEvent(new Event("pointermove"));
  assert.equal(previews.peekId.value, null);
  t.mock.timers.tick(2000);
  window.dispatchEvent(new Event("pointermove"));
  t.mock.timers.tick(2999);
  assert.equal(previews.peekId.value, null);
  t.mock.timers.tick(1);
  assert.notEqual(previews.peekId.value, null);
});

test("hovered wishes stay visible without automatic replacements and leaving restarts the idle delay", (t) => {
  const { previews } = mountPreviews(t);
  previews.hover("times-two");
  t.mock.timers.tick(10000);
  assert.equal(previews.peekId.value, "times-two");
  previews.leave("times-two");
  assert.equal(previews.peekId.value, null);
  t.mock.timers.tick(2999);
  assert.equal(previews.peekId.value, null);
  t.mock.timers.tick(1);
  assert.notEqual(previews.peekId.value, null);
});

test("opening a dialog pauses previews and a closed dialog can resume without stealing hover", (t) => {
  const { props, previews } = mountPreviews(t);
  props.enabled = false;
  t.mock.timers.tick(10000);
  assert.equal(previews.peekId.value, null);
  props.enabled = true;
  assert.notEqual(previews.peekId.value, null);
});

test("hidden tabs pause and resume only after becoming visible and idle", (t) => {
  const { previews, document } = mountPreviews(t);
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  t.mock.timers.tick(10000);
  assert.equal(previews.peekId.value, null);
  document.hidden = false;
  document.dispatchEvent(new Event("visibilitychange"));
  t.mock.timers.tick(2999);
  assert.equal(previews.peekId.value, null);
  t.mock.timers.tick(1);
  assert.notEqual(previews.peekId.value, null);
});

test("newly loaded wishes start previews and a resolved IP preference affects the next selection", (t) => {
  const { props, previews } = mountPreviews(t, { wishes: [], preferredCampus: "" });
  assert.equal(previews.peekId.value, null);
  props.wishes = wishes;
  assert.notEqual(previews.peekId.value, null);
  props.preferredCampus = "Harmony";
  t.mock.timers.tick(1300);
  t.mock.timers.tick(200);
  assert.equal(previews.peekId.value, "harmony");
});

test("unmounting clears previews, activity listeners and pending timers", (t) => {
  const { app, previews, window, document } = mountPreviews(t);
  const removeWindow = t.mock.method(window, "removeEventListener");
  const removeDocument = t.mock.method(document, "removeEventListener");
  app.unmount();
  assert.equal(removeWindow.mock.callCount(), 3);
  assert.equal(removeDocument.mock.callCount(), 1);
  t.mock.timers.tick(10000);
  assert.equal(previews.peekId.value, null);
});
