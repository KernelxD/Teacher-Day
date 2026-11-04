<script setup>
// The tree itself: sky, hills, the drawn tree, and one small swaying tag per wish.
// Hovering a tag shows a quick preview; clicking it asks the parent to open that wish.
import { computed, ref } from "vue";
import { TREE, TAG_SPOTS } from "../../lib/tree.js";
import { PALETTE, joinNames } from "../../lib/wishes.js";

const props = defineProps({
  wishes: { type: Array, required: true },
  mineId: { type: [String, Number], default: null },
  toneById: { type: Object, required: true },
  peekEnabled: { type: Boolean, default: true },
});
const emit = defineEmits(["open"]);

const peekId = ref(null);

const tags = computed(() =>
  props.wishes.map((wish, i) => {
    const spot = TAG_SPOTS[i % TAG_SPOTS.length];
    const mine = wish.id === props.mineId;
    return {
      id: wish.id,
      mine,
      label: `Lời chúc của ${wish.name} gửi ${joinNames(wish.to)}`,
      style: {
        left: spot.left,
        top: spot.top,
        width: spot.w,
        height: spot.h,
        marginLeft: spot.ml,
        transform: `rotate(${spot.rot}deg)`,
        zIndex: mine ? 4 : 1,
      },
      swingStyle: { animationDuration: spot.swayDuration, animationDelay: spot.swayDelay },
      color: mine ? "#FFFFFF" : PALETTE[props.toneById[wish.id] ?? 0],
    };
  }),
);

const peek = computed(() => {
  if (!props.peekEnabled || peekId.value === null) return null;
  const i = props.wishes.findIndex((w) => w.id === peekId.value);
  if (i < 0) return null;
  const wish = props.wishes[i];
  const spot = TAG_SPOTS[i % TAG_SPOTS.length];
  // Tags near the top of the tree show the preview below them, the rest above.
  const shift = spot.y < 210 ? "translate(-50%, calc(2.2cqw + 12px))" : "translate(-50%, calc(-100% - 14px))";
  return {
    name: wish.name,
    to: joinNames(wish.to),
    content: wish.content,
    style: { left: spot.left, top: spot.top, transform: shift },
  };
});

function leave(id) {
  if (peekId.value === id) peekId.value = null;
}

function open(id) {
  peekId.value = null;
  emit("open", id);
}
</script>

<template>
  <div class="scene">
    <div class="tree-box">
      <svg class="tree-svg" viewBox="0 0 1200 800" aria-hidden="true">
        <defs>
          <linearGradient id="bark" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="716">
            <stop offset="0" stop-color="#6F82D6" />
            <stop offset="0.5" stop-color="#3B4AA0" />
            <stop offset="1" stop-color="#1C2257" />
          </linearGradient>
          <radialGradient id="halo" cx="600" cy="300" r="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.6" />
            <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="hillL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFFFFF" />
            <stop offset="1" stop-color="#E8E1EE" />
          </linearGradient>
          <linearGradient id="hillR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFFBF5" />
            <stop offset="1" stop-color="#EFE3D8" />
          </linearGradient>
          <linearGradient id="mound" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFFFFF" />
            <stop offset="1" stop-color="#F3EBE4" />
          </linearGradient>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFFFFF" stop-opacity="0" />
            <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.45" />
            <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
          </linearGradient>
        </defs>

        <circle cx="600" cy="300" r="420" fill="url(#halo) none" />
        <g class="cloud cloud-a" fill="#FFFFFF" opacity="0.55">
          <ellipse cx="170" cy="190" rx="70" ry="20" />
          <ellipse cx="205" cy="176" rx="42" ry="22" />
        </g>
        <g class="cloud cloud-b" fill="#FFFFFF" opacity="0.45">
          <ellipse cx="1050" cy="130" rx="60" ry="16" />
          <ellipse cx="1080" cy="119" rx="34" ry="18" />
        </g>
        <path d="M -280 648 C 70 572 360 598 650 704 L 650 830 L -280 830 Z" fill="url(#hillL) #F3EDF2" />
        <path d="M 1480 604 C 1130 538 840 598 550 708 L 550 830 L 1480 830 Z" fill="url(#hillR) #F8EFE6" />
        <rect x="-300" y="580" width="1800" height="150" fill="url(#mist) none" />
        <g class="tree-body">
          <path :d="TREE.limbs" fill="url(#bark) #34428F" />
          <path :d="TREE.joints" fill="url(#bark) #34428F" />
          <path d="M 566 720 Q 588 704 586 676 L 614 676 Q 612 704 636 720 Z" fill="#1C2257" />
        </g>
        <path d="M 320 830 C 404 738 516 706 600 706 C 692 706 796 738 880 830 Z" fill="url(#mound) #FFFAF5" />
        <ellipse cx="600" cy="714" rx="74" ry="9" fill="#231B42" opacity="0.12" />
      </svg>

      <div class="tags" role="group" :aria-label="`${wishes.length} lời chúc trên cây`">
        <button
          v-for="tag in tags"
          :key="tag.id"
          type="button"
          class="tag"
          tabindex="-1"
          :aria-label="tag.label"
          :style="tag.style"
          @click="open(tag.id)"
          @mouseenter="peekId = tag.id"
          @mouseleave="leave(tag.id)"
        >
          <span class="swing" aria-hidden="true" :style="tag.swingStyle">
            <span class="slip" :class="{ mine: tag.mine }" :style="{ background: tag.color }"></span>
          </span>
        </button>
      </div>

      <div v-if="peek" class="peek" aria-hidden="true" :style="peek.style">
        <dl>
          <dt>Người gửi</dt>
          <dd class="peek-name">{{ peek.name }}</dd>
          <dt>Gửi tới</dt>
          <dd class="peek-to">{{ peek.to }}</dd>
          <dt>Lời chúc</dt>
          <dd class="peek-content">{{ peek.content }}</dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<style scoped>
div {
  font-family: inherit;
}

.scene {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* The tree keeps a 3:2 shape, sits on the bottom edge, and never gets taller than the screen. */
.tree-box {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(100%, 150vh);
  aspect-ratio: 3 / 2;
  transform: translateX(-50%);
  container-type: inline-size;
}

.tree-svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.cloud-a {
  animation: drift 16s ease-in-out infinite;
}

.cloud-b {
  animation: drift 20s ease-in-out -7s infinite;
}

.tree-body {
  transform-origin: 600px 716px;
  animation: breathe 9s ease-in-out infinite;
}

.tags {
  position: absolute;
  inset: 0;
  transform-origin: 50% 89.5%;
  animation: breathe 9s ease-in-out infinite;
}

.tag {
  position: absolute;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  transform-origin: 50% 0;
}

.tag:hover {
  z-index: 6 !important;
}

.swing {
  position: absolute;
  inset: 0;
  transform-origin: 50% 0;
  animation-name: sway;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.tag:hover .swing {
  animation-play-state: paused;
}

.slip {
  position: absolute;
  inset: 0;
  border-radius: 1.5px;
  opacity: 0.92;
  transform-origin: 50% 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.slip.mine {
  opacity: 1;
  box-shadow: 0 0 0 2px #FFD25E, 0 0 14px 4px rgba(255, 210, 94, 0.9);
  animation: beat 1.4s ease-in-out infinite;
}

.tag:hover .slip {
  transform: scale(1.8);
  box-shadow: 0 3px 10px rgba(26, 31, 78, 0.35);
}

.peek {
  position: absolute;
  z-index: 6;
  width: 300px;
  padding: 16px 18px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 14px 34px rgba(35, 27, 66, 0.22);
  pointer-events: none;
  animation: peek 0.15s ease both;
}

.peek dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 12px;
  row-gap: 6px;
  align-items: baseline;
}

.peek dt {
  font-size: 12px;
  font-weight: 600;
  color: #5E5874;
}

.peek dd {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
}

.peek .peek-to {
  color: #3446A8;
}

.peek .peek-content {
  max-height: 84px;
  overflow: hidden;
  font-family: "Mali", "Be Vietnam Pro", cursive;
  font-size: 15px;
  font-weight: 400;
  line-height: 21px;
}

@keyframes sway {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg); }
}

@keyframes beat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.35); }
}

@keyframes drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(22px); }
}

@keyframes breathe {
  0%, 100% { transform: rotate(-0.25deg); }
  50% { transform: rotate(0.25deg); }
}

@keyframes peek {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* On phones the tree is drawn wider than the screen so the crown fills it. */
@media (max-width: 600px) {
  .tree-box {
    width: min(160%, 150vh);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cloud,
  .tree-body,
  .tags,
  .swing,
  .slip,
  .peek {
    animation: none !important;
    transition: none !important;
  }
}
</style>
