<script setup>
// The link-preview image (og:image) that chat apps show when someone shares the site.
// scripts/og-image.mjs opens /og?n=<wish count> in a headless browser at 1200 x 630 and
// saves a screenshot. Without ?n it draws the generic image committed as public/og-image.png.
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import TreeScene from "../components/tree/TreeScene.vue";
import { TAG_SPOTS } from "../lib/tree.js";
import { ACCENT, PALETTE } from "../lib/wishes.js";

const route = useRoute();
const parsed = Number(route.query.n);
const count = route.query.n !== undefined && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;

// The tree only draws tags, so stand-in wishes are enough. The generic image shows a full tree.
const GENERIC_TAGS = 180;
const wishes = Array.from({ length: count ?? GENERIC_TAGS }, (_, i) => ({ id: i, name: "", to: [], content: "" }));
const toneById = Object.fromEntries(wishes.map((wish, i) => [
  wish.id,
  Math.min(PALETTE.length - 1, Math.floor(TAG_SPOTS[i % TAG_SPOTS.length].tone * PALETTE.length)),
]));

const number = count === null ? "" : count.toLocaleString("vi-VN");
// Horizon is a wide face, so long numbers get a smaller size to stay clear of the tree.
const numberSize = number.length <= 3 ? 176 : number.length <= 5 ? 132 : 104;

// The screenshot script waits for this flag, so the image never shows fallback fonts.
onMounted(async () => {
  const text = "Ngày Nhà giáo Việt Nam lời chúc đã gửi tới thầy cô VTEC xin chúc mừng Viết";
  await Promise.all([
    document.fonts.load('900 80px "Horizon"', "0123456789/."),
    document.fonts.load('800 28px "Be Vietnam Pro"', text),
    document.fonts.load('700 20px "Be Vietnam Pro"', text),
  ]);
  await document.fonts.ready;
  requestAnimationFrame(() => { document.documentElement.dataset.ogReady = "true"; });
});
</script>

<template>
  <div class="og" :style="{ '--accent': ACCENT }">
    <div class="ground" aria-hidden="true"></div>
    <div class="tree">
      <TreeScene :wishes="wishes" :tone-by-id="toneById" :peek-enabled="false" />
    </div>

    <div class="copy">
      <div class="pills">
        <span class="pill pill-accent">VTEC</span>
        <span class="pill pill-light">xin chúc mừng</span>
      </div>
      <h1>
        <span class="date">20/11</span>
        <span class="day">Ngày Nhà giáo Việt Nam</span>
      </h1>

      <p v-if="count !== null" class="total">
        <span class="total-number" :style="{ fontSize: numberSize + 'px' }">{{ number }}</span>
        <span class="total-label">lời chúc đã gửi tới thầy cô</span>
      </p>
      <p v-else class="headline">Gửi lời chúc<br />tới thầy cô</p>

      <span class="compose">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
        Viết lời chúc
      </span>
    </div>
  </div>
</template>

<style scoped>
div {
  font-family: inherit;
}

.og {
  position: relative;
  width: 1200px;
  height: 630px;
  overflow: hidden;
  background: linear-gradient(to bottom, #A7AEDB 0%, #C9C4E3 30%, #EBD6DC 60%, #FCE5CC 100%);
  color: #231B42;
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  line-height: 1.5;
}

/* A low hill under the text. The tree's own hills fade into it (see the mask below). */
.ground {
  position: absolute;
  left: -200px;
  bottom: -190px;
  width: 900px;
  height: 330px;
  border-radius: 50%;
  background: linear-gradient(to bottom, #FFFFFF, #EFE6EE);
}

/* The mask fades the left edge, where the tree's hills and mist would otherwise end in a hard line. */
.tree {
  position: absolute;
  top: 0;
  right: -70px;
  bottom: 0;
  width: 860px;
  mask-image: linear-gradient(to right, transparent, #000 140px);
}

.copy {
  position: absolute;
  z-index: 3;
  top: 52px;
  left: 64px;
  bottom: 52px;
  width: 520px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.pills {
  display: flex;
  gap: 10px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 20px;
  border-radius: 9999px;
  font-size: 20px;
}

.pill-accent {
  background: var(--accent);
  font-weight: 800;
}

.pill-light {
  background: rgba(255, 255, 255, 0.72);
  font-weight: 700;
}

h1 {
  margin: 14px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date {
  font-family: "Horizon", "Be Vietnam Pro", sans-serif;
  font-size: 80px;
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: 0.01em;
}

.day {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.total,
.headline {
  margin: auto 0 0;
}

.total {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.total-number {
  font-family: "Horizon", "Be Vietnam Pro", sans-serif;
  font-weight: 900;
  line-height: 0.9;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.total-label {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
  color: #3F3858;
}

.headline {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.compose {
  margin-top: 26px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 60px;
  padding: 0 34px;
  background: var(--accent);
  border-radius: 9999px;
  box-shadow: 0 10px 24px rgba(35, 27, 66, 0.18);
  font-size: 22px;
  font-weight: 800;
  white-space: nowrap;
}
</style>
