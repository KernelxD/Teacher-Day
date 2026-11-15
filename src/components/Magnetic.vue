<script setup>
import { ref, computed, onMounted, onUnmounted, useSlots } from "vue";
import gsap from "gsap";

const props = defineProps({
  // Multiplier for outer container movement (0.1 = subtle, 0.4 = punchy)
  strength: {
    type: Number,
    default: 0.35,
  },
  // Multiplier for inner content parallax effect
  textStrength: {
    type: Number,
    default: 0.25,
  },
  // HTML tag for the outer element
  as: {
    type: String,
    default: "div",
  },
  // Default text when no slot is passed
  text: {
    type: String,
    default: "Gửi lời chúc ngay",
  },
  // Custom class for the wrapper
  customClass: {
    type: String,
    default: "",
  },
  // Disable magnetic interaction
  disabled: {
    type: Boolean,
    default: false,
  },
  // Follow animation duration in seconds
  duration: {
    type: Number,
    default: 0.3,
  },
  // Snap-back animation duration on mouse leave in seconds
  leaveDuration: {
    type: Number,
    default: 0.8,
  },
  // GSAP ease for the elastic snap back
  leaveEase: {
    type: String,
    default: "elastic.out(1, 0.4)",
  },
});

const btnRef = ref(null);
const txtRef = ref(null);
const slots = useSlots();
const hasSlotContent = computed(() => !!slots.default);

let ctx;

function handlePointerMove(e) {
  if (props.disabled) return;

  // Ignore touch devices to avoid getting stuck in transformed position
  if (e.pointerType === "touch") return;

  const btn = btnRef.value;
  const txt = txtRef.value;
  if (!btn) return;

  // Compensate for existing GSAP transform to get the true un-transformed center
  const currentX = gsap.getProperty(btn, "x") || 0;
  const currentY = gsap.getProperty(btn, "y") || 0;

  const rect = btn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 - currentX;
  const centerY = rect.top + rect.height / 2 - currentY;

  const deltaX = e.clientX - centerX;
  const deltaY = e.clientY - centerY;

  gsap.to(btn, {
    x: deltaX * props.strength,
    y: deltaY * props.strength,
    duration: props.duration,
    ease: "power2.out",
    overwrite: "auto",
  });

  if (txt) {
    gsap.to(txt, {
      x: deltaX * props.textStrength,
      y: deltaY * props.textStrength,
      duration: props.duration,
      ease: "power2.out",
      overwrite: "auto",
    });
  }
}

function handlePointerLeave() {
  if (props.disabled) return;

  const btn = btnRef.value;
  const txt = txtRef.value;
  if (!btn) return;

  gsap.to(btn, {
    x: 0,
    y: 0,
    duration: props.leaveDuration,
    ease: props.leaveEase,
    overwrite: "auto",
  });

  if (txt) {
    gsap.to(txt, {
      x: 0,
      y: 0,
      duration: props.leaveDuration,
      ease: props.leaveEase,
      overwrite: "auto",
    });
  }
}

onMounted(() => {
  ctx = gsap.context(() => {});
});

onUnmounted(() => {
  if (ctx) ctx.revert();
  if (btnRef.value) gsap.killTweensOf(btnRef.value);
  if (txtRef.value) gsap.killTweensOf(txtRef.value);
});
</script>

<template>
  <component
    :is="as"
    ref="btnRef"
    class="magnetic-wrap"
    :class="[customClass, { 'magnetic-default': !hasSlotContent }]"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <span ref="txtRef" class="magnetic-inner">
      <slot>{{ text }}</slot>
    </span>
  </component>
</template>

<style scoped>
.magnetic-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  will-change: transform;
}

.magnetic-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  will-change: transform;
}

/* Default styling when used without custom slot */
.magnetic-default {
  padding: 0.85rem 2rem;
  background-color: var(--color-yellow);
  color: var(--ink);
  font-family: var(--font-main);
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--transition),
    box-shadow var(--transition),
    transform var(--transition);
}

.magnetic-default:hover {
  background-color: #FCD34D;
  box-shadow: var(--shadow-lg);
}
</style>