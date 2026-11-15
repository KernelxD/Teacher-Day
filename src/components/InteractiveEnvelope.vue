<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  wish: {
    type: Object,
    required: true,
  },
  initiallyOpen: {
    type: Boolean,
    default: false,
  },
});

const isOpen = ref(props.initiallyOpen);

const fontClass = computed(() => {
  const style = props.wish.fontStyle || "handwriting";
  return `font-${style}`;
});

const targetDisplay = computed(() => {
  if (Array.isArray(props.wish.target) && props.wish.target.length > 0) {
    return props.wish.target.join(", ");
  }
  return "Tất cả thầy cô";
});

function toggleOpen() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div
    class="envelope-wrapper"
    :class="{ 'is-open': isOpen }"
    @click="toggleOpen"
  >
    <div class="envelope">
      <!-- Back Interior of Envelope -->
      <div class="envelope-back"></div>

      <!-- The Letter Paper Inside -->
      <div class="envelope-letter" :class="{ 'letter-lifted': isOpen }">
        <div class="letter-inner">
          <div class="letter-header">
            <span class="letter-badge">Lời tri ân 20/11</span>
            <span class="letter-recipient">
              Kính gửi: <strong>{{ targetDisplay }}</strong>
            </span>
          </div>

          <div class="letter-content" :class="fontClass">
            "{{ wish.message }}"
          </div>

          <div class="letter-footer">
            <div class="letter-sender">
              <span class="sender-label">Người gửi:</span>
              <strong class="sender-name">{{ wish.author }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Envelope Front Pocket (Seamless SVG polygon) -->
      <div class="envelope-front">
        <svg
          class="pocket-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <!-- Pocket path: starts at (0,0), dips to (50, 48), returns to (100,0), then covers the bottom -->
          <polygon
            points="0,0 50,48 100,0 100,100 0,100"
            fill="#f7f3ea"
            stroke="#18283B"
            stroke-width="1.2"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <!-- Postage Stamp on Front Pocket -->
        <div class="postage-stamp" aria-hidden="true">
          <div class="stamp-inner">
            <span class="stamp-title">20/11</span>
            <span class="stamp-sub">VTEC</span>
          </div>
        </div>

        <!-- Envelope Address Label on Front -->
        <div class="address-label">
          <div class="to-line">
            <span class="label-tag">Kính gửi:</span>
            <span class="recipient-name">{{ targetDisplay }}</span>
          </div>
          <div class="from-line">
            <span class="label-tag">Từ bạn:</span>
            <span class="sender-name">{{ wish.author }}</span>
          </div>
        </div>

        <!-- Open / Close Hint -->
        <div v-if="!isOpen" class="hint-badge">
          <span>Mở thư</span>
        </div>
        <div v-else class="hint-badge active" @click.stop="toggleOpen">
          <span>Đóng thư</span>
        </div>
      </div>

      <!-- Top Flap (Triangular Lid with 3D Flip) -->
      <div class="envelope-flap" :class="{ 'flap-open': isOpen }">
        <svg
          class="flap-svg"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <!-- Flap path: starts at (0,0), reaches (50, 58), returns to (100,0) -->
          <polygon
            points="0,0 50,58 100,0"
            fill="#efe8dc"
            stroke="#18283B"
            stroke-width="1.2"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <!-- Minimalist Wax Seal on flap tip -->
        <div class="wax-seal" aria-hidden="true">
          <div class="wax-seal-inner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.envelope-wrapper {
  position: relative;
  width: 100%;
  max-width: 370px;
  min-height: 250px;
  perspective: 1200px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
  margin-top: 1.5rem;
}

.envelope-wrapper:hover {
  transform: translateY(-4px);
}

.envelope-wrapper.is-open {
  min-height: 480px;
  cursor: default;
}

.envelope {
  position: relative;
  width: 100%;
  height: 230px;
  background: #f7f3ea;
  border: 2px solid var(--ink);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.25s ease;
}

.envelope-wrapper:hover .envelope {
  box-shadow: var(--shadow-lg);
}

/* Back Interior */
.envelope-back {
  position: absolute;
  inset: 0;
  background: #eae2d3;
  border-radius: 6px;
  z-index: 1;
}

/* ============================================================
   THE LETTER PAPER INSIDE
   ============================================================ */

.envelope-letter {
  position: absolute;
  top: 15px;
  left: 14px;
  right: 14px;
  bottom: 15px;
  background: #ffffff;
  background-image:
    linear-gradient(to right, transparent 2.2rem, rgba(239, 68, 68, 0.25) 2.2rem, rgba(239, 68, 68, 0.25) 2.3rem, transparent 2.3rem),
    repeating-linear-gradient(transparent, transparent calc(1.75rem - 1px), rgba(56, 189, 248, 0.25) calc(1.75rem - 1px), rgba(56, 189, 248, 0.25) 1.75rem);
  background-size: 100% 1.75rem;
  border: 1.5px solid var(--ink);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(24, 40, 59, 0.12);
  z-index: 2;
  padding: 1.25rem 1.25rem 1rem 2.8rem;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, opacity 0.25s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
}

/* Letter slides out when opened */
.envelope-letter.letter-lifted {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-200px);
  min-height: 380px;
  box-shadow: var(--shadow-lg);
  z-index: 10;
  overflow-y: auto;
}

.letter-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.letter-header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px dashed rgba(24, 40, 59, 0.18);
  padding-bottom: 0.4rem;
}

.letter-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}

.letter-recipient {
  font-size: 0.88rem;
  color: var(--ink);
}

.letter-content {
  flex: 1;
  font-size: 1.25rem;
  line-height: 1.75rem;
  color: var(--ink);
  white-space: pre-line;
  margin-bottom: 0.75rem;
  word-break: break-all;
}

.font-cursive.letter-content {
  font-size: 1.45rem;
  line-height: 1.85rem;
}

.font-typewriter.letter-content {
  font-size: 1.05rem;
  line-height: 1.75rem;
}

.font-modern.letter-content {
  font-size: 1.05rem;
  line-height: 1.65rem;
}

.letter-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 0.5rem;
}

.letter-sender {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.sender-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.sender-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--ink);
}

/* ============================================================
   FRONT POCKET (SEAMLESS SVG)
   ============================================================ */

.envelope-front {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  border-radius: 6px;
  overflow: hidden;
}

.pocket-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 -2px 3px rgba(24, 40, 59, 0.08));
}

/* Postage Stamp */
.postage-stamp {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 5;
}

.stamp-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 52px;
  background: var(--color-yellow);
  border: 1.5px dashed var(--ink);
  box-shadow: 1.5px 1.5px 0 0 var(--ink);
  transform: rotate(3deg);
}

.stamp-title {
  font-size: 0.8rem;
  font-weight: 900;
  color: var(--ink);
  line-height: 1;
}

.stamp-sub {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-muted);
}

/* Address Label */
.address-label {
  position: absolute;
  bottom: 18px;
  left: 18px;
  right: 18px;
  z-index: 5;
  background: #ffffff;
  border: 2px solid var(--ink);
  border-radius: 6px;
  padding: 0.5rem 0.8rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.to-line,
.from-line {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.label-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 55px;
}

.recipient-name {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--ink);
}

/* Hint Badges */
.hint-badge {
  position: absolute;
  top: 14px;
  left: 16px;
  z-index: 6;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--ink);
  background: #ffffff;
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.6rem;
  box-shadow: 1px 1px 0 0 var(--ink);
  pointer-events: auto;
}

.hint-badge.active {
  cursor: pointer;
  background: var(--color-yellow);
}

/* ============================================================
   TOP FLAP (SEAMLESS SVG WITH 3D ROTATION)
   ============================================================ */

.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 135px;
  z-index: 5;
  transform-origin: top center;
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), z-index 0.45s step-end;
}

.flap-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 3px 4px rgba(24, 40, 59, 0.15));
}

/* Minimalist Wax Seal */
.wax-seal {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #dc2626;
  border: 2px solid var(--ink);
  box-shadow: 0 2px 4px rgba(24, 40, 59, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.wax-seal-inner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px dashed rgba(255, 255, 255, 0.65);
}

.envelope-wrapper:hover .wax-seal {
  transform: translate(-50%, 50%) scale(1.1);
}

/* Open State for Flap */
.envelope-flap.flap-open {
  transform: rotateX(180deg);
  z-index: 1; /* Drop behind the letter when opened */
  transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), z-index 0.2s step-start;
}
</style>
