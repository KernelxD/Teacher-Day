import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { PREVIEW_FADE_MS, PREVIEW_IDLE_MS, PREVIEW_PERIOD_MS, wishPreviewOrder } from "./wishPreviews.js";

export function useWishPreviews({ wishes, preferredCampus, enabled, random = Math.random }) {
  const hoveredId = ref(null);
  const automaticId = ref(null);
  const idle = ref(true);
  const mounted = ref(false);
  const pageVisible = ref(true);
  const peekId = computed(() => enabled() ? hoveredId.value ?? automaticId.value : null);
  const canPlay = computed(() => mounted.value && pageVisible.value && idle.value && enabled()
    && hoveredId.value === null && wishes().length > 0);
  let cycleTimer;
  let idleTimer;
  let queue = [];
  let lastId;

  function stopCycle() {
    clearTimeout(cycleTimer);
    automaticId.value = null;
  }

  function showNext() {
    if (!canPlay.value) return;
    if (!queue.length) {
      queue = wishPreviewOrder(wishes(), preferredCampus(), random);
      // Avoid displaying the same wish on both sides of a reshuffle.
      if (queue.length > 1 && queue[0] === lastId) [queue[0], queue[1]] = [queue[1], queue[0]];
    }
    automaticId.value = queue.shift();
    lastId = automaticId.value;
    cycleTimer = setTimeout(() => {
      automaticId.value = null;
      cycleTimer = setTimeout(showNext, PREVIEW_FADE_MS);
    }, PREVIEW_PERIOD_MS - PREVIEW_FADE_MS);
  }

  function activity() {
    clearTimeout(idleTimer);
    idle.value = false;
    if (pageVisible.value) idleTimer = setTimeout(() => { idle.value = true; }, PREVIEW_IDLE_MS);
  }

  function hover(id) {
    hoveredId.value = id;
    activity();
  }

  function leave(id) {
    if (hoveredId.value === id) {
      hoveredId.value = null;
      activity();
    }
  }

  function clear() {
    hoveredId.value = null;
    activity();
  }

  function visibilityChanged() {
    pageVisible.value = !document.hidden;
    activity();
  }

  watch(canPlay, (play) => {
    stopCycle();
    if (play) showNext();
  }, { flush: "sync" });
  watch([wishes, preferredCampus], () => { queue = []; }, { flush: "sync" });
  watch(enabled, (value) => { if (!value) hoveredId.value = null; }, { flush: "sync" });

  onMounted(() => {
    window.addEventListener("pointermove", activity, { passive: true });
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    document.addEventListener("visibilitychange", visibilityChanged);
    pageVisible.value = !document.hidden;
    mounted.value = true;
  });
  onBeforeUnmount(() => {
    mounted.value = false;
    stopCycle();
    clearTimeout(idleTimer);
    window.removeEventListener("pointermove", activity);
    window.removeEventListener("pointerdown", activity);
    window.removeEventListener("keydown", activity);
    document.removeEventListener("visibilitychange", visibilityChanged);
  });

  return { peekId, hover, leave, clear };
}
