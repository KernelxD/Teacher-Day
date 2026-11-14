<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import gsap from "gsap";

const props = defineProps({
  // Heading/section list: [{ id: "hero", label: "20/11 VTEC", depth: 0 }, ...]
  items: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "Mục lục",
  },
  offset: {
    type: Number,
    default: 120, // Distance from viewport top to trigger active heading
  },
  indent: {
    type: Number,
    default: 16, // Horizontal indent (px) per depth level
  },
  position: {
    type: String,
    default: "right", // "right" or "left"
  },
  collapsible: {
    type: Boolean,
    default: true,
  },
});

const isCollapsed = ref(false);
const isMobile = ref(false);
const activeIndex = ref(0);
const bodyRef = ref(null);
const listRef = ref(null);
const planeRef = ref(null);
const pathRef = ref(null);
const itemRefs = ref([]);

const svgWidth = ref(80);
const svgHeight = ref(200);
const itemPoints = ref([]);
const totalPathLength = ref(0);
const activeDistance = ref(0);

// Base X position of the rail in the SVG
const baseRailX = 22;
// Base padding for the labels so they don't collide with the rail & plane
const baseIndent = 42;

// Fallback to auto-detected sections if no items prop passed
const detectedItems = ref([]);
const normalizedItems = computed(() => {
  if (props.items && props.items.length > 0) return props.items;
  return detectedItems.value;
});

const currentActiveLabel = computed(() => {
  return normalizedItems.value[activeIndex.value]?.label || props.title;
});

function setItemRef(el, index) {
  if (el) itemRefs.value[index] = el;
}

// Compute the smooth SVG path with bezier turns between depth levels
const railPath = computed(() => {
  const pts = itemPoints.value;
  if (!pts || pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];

    if (Math.abs(curr.x - prev.x) < 1) {
      // Straight vertical rail segment
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      // Smooth S-curve bend for depth indentation
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
  }
  return d;
});

// Update SVG points for all items
function updateMeasurements() {
  if (!bodyRef.value || normalizedItems.value.length === 0) return;

  const points = [];
  const bodyRect = bodyRef.value.getBoundingClientRect();

  normalizedItems.value.forEach((item, index) => {
    const el = itemRefs.value[index];
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const x = baseRailX + (item.depth || 0) * props.indent;
    const y = elRect.top - bodyRect.top + elRect.height / 2;
    points.push({ x, y });
  });

  if (points.length === 0) return;

  itemPoints.value = points;
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));

  svgWidth.value = Math.max(baseIndent + 20, maxX + 25);
  svgHeight.value = Math.max(100, maxY + 20);

  nextTick(() => {
    measurePathLength();
    movePlane(activeIndex.value, false);
  });
}

function measurePathLength() {
  if (!pathRef.value) return;
  try {
    const len = pathRef.value.getTotalLength();
    totalPathLength.value = len;
    updateActiveDistance();
  } catch (e) {
    // Graceful fallback for headless/SSR
    totalPathLength.value = 0;
  }
}

function updateActiveDistance() {
  if (!pathRef.value || totalPathLength.value === 0) return;
  const pts = itemPoints.value;
  const idx = activeIndex.value;
  if (!pts[idx]) return;

  // Approximate distance along path to active node
  if (pts.length === 1 || idx === 0) {
    activeDistance.value = 0;
    return;
  }

  // Find length by stepping along the path to the node's y coordinate
  const targetY = pts[idx].y;
  let low = 0;
  let high = totalPathLength.value;
  let best = 0;

  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    const p = pathRef.value.getPointAtLength(mid);
    best = mid;
    if (p.y < targetY) {
      low = mid;
    } else {
      high = mid;
    }
  }
  activeDistance.value = best;
}

// Animate paper plane flight along the rail with GSAP
let planeTween = null;
let lastIndex = 0;

function movePlane(index, animate = true, fromIndex = null) {
  const pts = itemPoints.value;
  if (!pts || !pts[index] || !planeRef.value) return;

  const target = pts[index];
  const sourceIndex = fromIndex !== null ? fromIndex : lastIndex;
  const source = pts[sourceIndex] || target;
  lastIndex = index;

  if (planeTween) planeTween.kill();

  if (!animate) {
    gsap.set(planeRef.value, {
      x: target.x,
      y: target.y,
      rotation: 0,
    });
    updateActiveDistance();
    return;
  }

  // Calculate true flight vector and angle from source to target
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;
  let flightAngle = 90; // Default down

  if (Math.abs(deltaY) > 1 || Math.abs(deltaX) > 1) {
    flightAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  } else if (index < sourceIndex) {
    flightAngle = -90;
  }

  const tl = gsap.timeline({
    onUpdate: updateActiveDistance,
  });

  // 1. Bank and turn into flight direction, fly along the rail to target
  tl.to(planeRef.value, {
    x: target.x,
    y: target.y,
    rotation: flightAngle,
    duration: 0.45,
    ease: "power2.inOut",
  });

  // 2. Smoothly rotate back to point at the section label (0 deg)
  tl.to(planeRef.value, {
    rotation: 0,
    duration: 0.35,
    ease: "back.out(2)",
  });

  planeTween = tl;
}

// Scroll-spy observer & scroll listener
function checkScroll() {
  const items = normalizedItems.value;
  if (!items || items.length === 0) return;

  let current = 0;
  const scrollY = window.scrollY;

  for (let i = 0; i < items.length; i++) {
    const el = document.getElementById(items[i].id);
    if (!el) continue;

    const top = el.getBoundingClientRect().top + scrollY - props.offset - 10;
    if (scrollY >= top) {
      current = i;
    }
  }

  if (current !== activeIndex.value) {
    const prev = activeIndex.value;
    activeIndex.value = current;
    movePlane(current, true, prev);
  }
}

function scrollTo(id, index) {
  const el = document.getElementById(id);
  if (el) {
    const prev = activeIndex.value;
    activeIndex.value = index;
    movePlane(index, true, prev);
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value) {
    isCollapsed.value = true;
  }
  updateMeasurements();
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  if (!isCollapsed.value) {
    nextTick(() => {
      updateMeasurements();
      movePlane(activeIndex.value, false);
    });
  }
}

// Auto-discover headings if no items prop provided
function autoDiscoverSections() {
  if (props.items && props.items.length > 0) return;

  const found = [];
  const candidateElements = document.querySelectorAll(
    "section[id], h1[id], h2[id], div[id].section-anchor"
  );

  candidateElements.forEach((el) => {
    const depth = el.tagName === "H2" || el.classList.contains("depth-1") ? 1 : 0;
    const label =
      el.getAttribute("data-toc-title") ||
      el.getAttribute("aria-label") ||
      el.innerText?.split("\n")[0]?.trim() ||
      el.id;

    if (label && el.id) {
      found.push({ id: el.id, label, depth });
    }
  });

  if (found.length > 0) {
    detectedItems.value = found;
  }
}

let resizeObserver = null;

onMounted(() => {
  handleResize();
  autoDiscoverSections();

  nextTick(() => {
    updateMeasurements();
    checkScroll();
  });

  window.addEventListener("scroll", checkScroll, { passive: true });
  window.addEventListener("resize", handleResize);

  if (bodyRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(updateMeasurements);
    resizeObserver.observe(bodyRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", checkScroll);
  window.removeEventListener("resize", handleResize);
  resizeObserver?.disconnect();
  planeTween?.kill();
});

watch(
  () => props.items,
  () => {
    nextTick(() => {
      updateMeasurements();
      movePlane(activeIndex.value, false);
    });
  },
  { deep: true }
);
</script>

<template>
  <aside
    class="rail-toc-container"
    :class="[
      `pos-${position}`,
      { 'is-collapsed': isCollapsed, 'is-mobile': isMobile }
    ]"
    role="navigation"
    aria-label="Table of Contents"
  >
    <!-- Collapsed Floating Pill (visible on mobile or when collapsed) -->
    <button
      v-if="collapsible && isCollapsed"
      class="rail-pill-btn glass-card"
      @click="toggleCollapse"
      aria-label="Mở danh mục nội dung"
    >
      <span class="pill-plane-icon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path
            d="M22 2L15 22L11 13L2 9L22 2Z"
            fill="var(--color-yellow)"
            stroke="var(--ink)"
            stroke-width="1.8"
          />
          <path d="M22 2L11 13" stroke="var(--ink)" stroke-width="1.8" />
        </svg>
      </span>
      <span class="pill-text">{{ currentActiveLabel }}</span>
      <span class="pill-arrow">✦</span>
    </button>

    <!-- Expanded Rail Navigation Card -->
    <div
      v-show="!isCollapsed || !collapsible"
      class="rail-card glass-card"
    >
      <div v-if="title" class="rail-header">
        <div class="rail-header-title">
          <span class="header-indicator"></span>
          <span class="title-text">{{ title }}</span>
        </div>
        <button
          v-if="collapsible"
          class="rail-close-btn"
          @click="toggleCollapse"
          aria-label="Thu gọn danh mục"
          title="Thu gọn"
        >
          ✕
        </button>
      </div>

      <div class="rail-body" ref="bodyRef">
        <!-- SVG Rail with dashed background track and solid progress track -->
        <svg
          class="rail-svg"
          :width="svgWidth"
          :height="svgHeight"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="railProgressGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--ink)" />
              <stop offset="100%" stop-color="var(--ink)" />
            </linearGradient>
          </defs>

          <!-- Dashed background rail track -->
          <path
            :d="railPath"
            class="rail-path-track"
            fill="none"
          />

          <!-- Solid progress track up to active section -->
          <path
            ref="pathRef"
            :d="railPath"
            class="rail-path-progress"
            fill="none"
            :stroke-dasharray="totalPathLength"
            :stroke-dashoffset="Math.max(0, totalPathLength - activeDistance)"
          />

          <!-- Little node dots on each section milestone -->
          <circle
            v-for="(pt, idx) in itemPoints"
            :key="'node-' + idx"
            :cx="pt.x"
            :cy="pt.y"
            r="3.5"
            :class="[
              'rail-node',
              {
                'is-active': activeIndex === idx,
                'is-passed': activeIndex >= idx
              }
            ]"
          />
        </svg>

        <!-- The Paper Plane flying along the rail -->
        <div
          ref="planeRef"
          class="paper-plane-carrier"
          aria-hidden="true"
        >
          <svg
            class="paper-plane-icon"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
          >
            <!-- Wings pointing horizontally Right (0 deg) -->
            <path
              d="M22 12L2 4L7 12L2 20Z"
              fill="var(--color-yellow)"
              stroke="var(--ink)"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <!-- Center crease -->
            <path
              d="M7 12L22 12"
              stroke="var(--ink)"
              stroke-width="1.6"
              stroke-linecap="round"
            />
            <!-- Fold shadow -->
            <path
              d="M7 12L2 20L22 12Z"
              fill="rgba(0, 0, 0, 0.16)"
            />
          </svg>
        </div>

        <!-- Section Navigation List -->
        <ul class="rail-list" ref="listRef">
          <li
            v-for="(item, index) in normalizedItems"
            :key="item.id"
            :ref="el => setItemRef(el, index)"
            class="rail-item"
            :style="{
              paddingLeft: `${baseIndent + (item.depth || 0) * indent}px`
            }"
          >
            <button
              class="rail-link-btn"
              :class="{
                'is-active': activeIndex === index,
                'is-passed': activeIndex > index
              }"
              @click="scrollTo(item.id, index)"
            >
              <span class="rail-label">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.rail-toc-container {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  pointer-events: none;
  font-family: var(--font-main);
  user-select: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.rail-toc-container.pos-right {
  right: 1.5rem;
}

.rail-toc-container.pos-left {
  left: 1.5rem;
}

/* Neo-Brutalist Card styling */
.rail-card,
.rail-pill-btn {
  pointer-events: auto;
  background: var(--bg-card);
  border: 2px solid var(--ink);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  color: var(--ink);
}

.rail-card {
  width: fit-content;
  min-width: 200px;
  max-width: 280px;
  padding: 1rem 1.25rem 1.25rem 0.75rem;
  transition: box-shadow var(--transition);
}

.rail-card:hover {
  box-shadow: var(--shadow-lg);
}

/* Header */
.rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
  padding-left: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.15);
}

.rail-header-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.header-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--ink);
}

.title-text {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.rail-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
}

.rail-close-btn:hover {
  color: var(--ink);
  background-color: var(--color-shadowblue);
}

/* Body & SVG Rail */
.rail-body {
  position: relative;
  min-height: 80px;
}

.rail-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}

/* Rail lines */
.rail-path-track {
  stroke: rgba(0, 0, 0, 0.18);
  stroke-width: 2;
  stroke-dasharray: 4 4;
}

.rail-path-progress {
  stroke: var(--ink);
  stroke-width: 2.2;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Rail milestone dots */
.rail-node {
  fill: var(--bg-light);
  stroke: rgba(0, 0, 0, 0.3);
  stroke-width: 1.5;
  transition: fill 0.3s, stroke 0.3s, transform 0.3s;
}

.rail-node.is-passed {
  fill: var(--ink);
  stroke: var(--ink);
}

.rail-node.is-active {
  fill: var(--color-yellow);
  stroke: var(--ink);
  stroke-width: 2;
}

/* Paper Plane Carrier */
.paper-plane-carrier {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  margin-top: -12px;
  margin-left: -12px;
  transform-origin: 12px 12px;
  pointer-events: none;
  z-index: 10;
  will-change: transform;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.2));
}

.paper-plane-icon {
  display: block;
}

/* Navigation List */
.rail-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
}

.rail-item {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 28px;
}

.rail-link-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 0.88rem;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color 0.2s, background-color 0.2s, transform 0.2s;
  display: inline-block;
  line-height: 1.3;
}

.rail-link-btn:hover {
  color: var(--ink);
  background-color: var(--color-shadowblue);
  transform: translateX(2px);
}

.rail-link-btn.is-active {
  color: var(--ink);
  font-weight: 700;
  background-color: var(--color-yellow);
  border: 1.5px solid var(--ink);
  box-shadow: var(--shadow-sm);
  transform: translateX(3px);
}

.rail-label {
  display: inline-block;
}

/* Collapsed Pill Button */
.rail-pill-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.rail-pill-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.pill-plane-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pill-text {
  max-width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill-arrow {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .rail-toc-container {
    top: auto;
    bottom: 1.5rem;
    transform: none;
  }

  .rail-toc-container.pos-right {
    right: 1rem;
  }

  .rail-toc-container.pos-left {
    left: 1rem;
  }

  .rail-card {
    min-width: 180px;
    max-width: 240px;
  }
}
</style>
