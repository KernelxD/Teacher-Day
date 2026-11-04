<script setup>
// One wish shown as a letter pinned to the screen, with buttons for the previous and next wish.
import { computed, onMounted, ref } from "vue";
import { joinNames, mix } from "../../lib/wishes.js";

const props = defineProps({
  wish: { type: Object, required: true },
  hue: { type: String, required: true },
  mine: { type: Boolean, default: false },
  position: { type: String, default: "" },
});
defineEmits(["prev", "next", "close"]);

// The letter paper, its ruled lines and the stamp are all tinted from the tag's color.
const colors = computed(() => ({
  "--paper": mix(props.hue, "#FFFDF8", 0.62),
  "--rule": mix(mix(props.hue, "#FFFDF8", 0.3), "#231B42", 0.1),
  "--stamp": mix(props.hue, "#231B42", 0.5),
}));

const closeButton = ref(null);
onMounted(() => closeButton.value?.focus());
</script>

<template>
  <div class="overlay">
    <button type="button" class="backdrop" aria-label="Đóng" @click="$emit('close')"></button>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="read-title">
      <p v-if="mine" class="mine-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        Lời chúc của bạn đã được treo lên cây
      </p>

      <article class="letter" :style="colors">
        <svg class="grain" aria-hidden="true" width="100%" height="100%">
          <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.14 0 0 0 0 0.11 0 0 0 0 0.26 0.45 0 0 0 -0.17" />
          </filter>
          <rect width="100%" height="100%" filter="url(#paper-grain)" />
        </svg>
        <span class="hole" aria-hidden="true"></span>
        <span class="hole-inner" aria-hidden="true"></span>
        <svg class="string" aria-hidden="true" width="40" height="78" viewBox="0 0 40 78">
          <path d="M20 78 C 8 56, 6 18, 20 2 C 34 18, 32 56, 20 78" fill="none" stroke="#D9534A" stroke-width="2.4" stroke-linecap="round" />
        </svg>
        <div class="stamp" aria-hidden="true">
          <span class="stamp-top">VTEC</span>
          <span class="stamp-date">20/11</span>
        </div>
        <div class="lines">
          <h2 id="read-title" class="greeting">Gửi {{ joinNames(wish.to) }},</h2>
          <p class="content">{{ wish.content }}</p>
          <p class="signature">{{ wish.name }}</p>
        </div>
      </article>

      <div class="controls">
        <button type="button" class="round" aria-label="Lời chúc trước" @click="$emit('prev')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span class="position">{{ position }}</span>
        <button type="button" class="round" aria-label="Lời chúc tiếp theo" @click="$emit('next')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </button>
        <span class="divider" aria-hidden="true"></span>
        <button ref="closeButton" type="button" class="close" @click="$emit('close')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
div {
  font-family: inherit;
}

button {
  font: inherit;
  color: inherit;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  padding: 24px;
  overflow-y: auto;
  animation: fade 0.2s ease both;
}

.backdrop {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: rgba(35, 27, 66, 0.28);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  cursor: default;
}

.dialog {
  position: relative;
  width: min(520px, 100%);
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.mine-banner {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #FFF1C9;
  border-radius: 9999px;
  box-shadow: 0 6px 16px rgba(35, 27, 66, 0.16);
  font-size: 14px;
  font-weight: 800;
}

.letter {
  position: relative;
  width: 100%;
  margin-top: 44px;
  padding: 64px 40px 30px;
  background-color: var(--paper);
  border-radius: 3px;
  box-shadow: inset 0 0 44px rgba(35, 27, 66, 0.07), 0 1px 2px rgba(35, 27, 66, 0.14), 0 26px 50px rgba(35, 27, 66, 0.3);
  transform: rotate(-1.2deg);
  transition: background-color 0.3s ease;
  animation: paper-in 0.45s cubic-bezier(0.2, 1.2, 0.4, 1) both;
}

.grain {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
}

.hole {
  position: absolute;
  z-index: 2;
  top: 20px;
  left: 50%;
  width: 22px;
  height: 22px;
  margin-left: -11px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: inset 0 0 0 1px rgba(35, 27, 66, 0.08);
}

.hole-inner {
  position: absolute;
  z-index: 2;
  top: 26px;
  left: 50%;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  border-radius: 9999px;
  background: #8F88A9;
  box-shadow: inset 0 2px 3px rgba(35, 27, 66, 0.45);
}

.string {
  position: absolute;
  z-index: 3;
  top: -47px;
  left: 50%;
  margin-left: -20px;
  overflow: visible;
  pointer-events: none;
}

.stamp {
  position: absolute;
  z-index: 1;
  top: 14px;
  right: 18px;
  width: 68px;
  height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 2px solid var(--stamp);
  border-radius: 9999px;
  box-shadow: inset 0 0 0 3px var(--paper), inset 0 0 0 4.5px var(--stamp);
  color: var(--stamp);
  opacity: 0.7;
  transform: rotate(12deg);
}

.stamp-top {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
  line-height: 1;
}

.stamp-date {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1;
}

/* Handwriting on ruled lines: every line of text sits on a 40px rule. */
.lines {
  position: relative;
  z-index: 1;
  max-height: max(160px, calc(100vh - 320px));
  overflow-y: auto;
  scrollbar-width: thin;
  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 39px, var(--rule) 39px, var(--rule) 40px);
  background-position: 0 -6px;
  background-attachment: local;
  font-family: "Mali", "Be Vietnam Pro", cursive;
  line-height: 40px;
}

.greeting {
  margin: 0;
  padding-right: 64px;
  font-size: 22px;
  font-weight: 600;
  line-height: 40px;
}

.content {
  margin: 0;
  font-size: 24px;
  line-height: 40px;
  text-indent: 28px;
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.signature {
  margin: 0;
  text-align: right;
  font-size: 22px;
  font-weight: 600;
  line-height: 40px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: #FFFFFF;
  border-radius: 9999px;
  box-shadow: 0 10px 24px rgba(35, 27, 66, 0.18);
}

.round {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #F3F1F8;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
}

.position {
  min-width: 76px;
  padding: 0 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #3F3858;
  font-variant-numeric: tabular-nums;
}

.divider {
  width: 1px;
  height: 24px;
  margin: 0 6px;
  background: #E2DEEC;
}

.close {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px 0 14px;
  background: #F3F1F8;
  border: none;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes paper-in {
  from { opacity: 0; transform: translateY(32px) rotate(-6deg); }
  to { opacity: 1; transform: translateY(0) rotate(-1.2deg); }
}

@media (max-width: 600px) {
  .overlay {
    padding: 16px;
  }

  .letter {
    padding: 56px 22px 24px;
  }

  .content {
    font-size: 20px;
  }

  .greeting,
  .signature {
    font-size: 19px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay,
  .letter {
    animation: none;
    transition: none;
  }
}
</style>
