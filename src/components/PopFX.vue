<script setup>

import { ref } from 'vue';

const root = ref(null)

function play() {
  const el = root.value;
  if (!el) return;
  el.classList.remove('is-active');
  void el.offsetWidth;
  el.classList.add('is-active');
}

defineExpose({ play })

const pastelColors = [
  '#ffadad', // Pastel Red
  '#ffd6a5', // Pastel Orange
  '#fdffb6', // Pastel Yellow
  '#caffbf', // Pastel Green
  '#9bf6ff', // Pastel Cyan
]


</script>
<template>
    <div ref="root" class="pop-container">
    <div class="pop-line" style="--angle: 0deg;" :style="{ backgroundColor: pastelColors[3] }"></div>
    <div class="pop-line" style="--angle: 45deg;" :style="{ backgroundColor: pastelColors[0] }"></div>
    <div class="pop-line" style="--angle: 90deg;" :style="{ backgroundColor: pastelColors[3] }"></div>
    <div class="pop-line" style="--angle: 135deg;" :style="{ backgroundColor: pastelColors[0] }"></div>
    <div class="pop-line" style="--angle: 180deg;" :style="{ backgroundColor: pastelColors[4] }"></div>
    <div class="pop-line" style="--angle: 225deg;" :style="{ backgroundColor: pastelColors[0] }"></div>
    <div class="pop-line" style="--angle: 270deg;" :style="{ backgroundColor: pastelColors[4] }"></div>
    <div class="pop-line" style="--angle: 315deg;" :style="{ backgroundColor: pastelColors[0] }"></div>
    </div>
</template>
<style scoped>
.pop-container {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.pop-line {
  position: absolute;
  z-index: 3;
  width: 6px;
  height: 24px;
  border-radius: var(--radius-sm);
  opacity: 0;
  transform: rotate(var(--angle)) translateY(0) scaleY(0);
}

.pop-container.is-active .pop-line {
  animation: popBurst 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes popBurst {
  0% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(0) scaleY(0);
  }

  15% {
    opacity: 1;
    transform: rotate(var(--angle)) translateY(3rem) scaleY(2);
  }

  100% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(5rem) scaleY(0);
  }
}
</style>
