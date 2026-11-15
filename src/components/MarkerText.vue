<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  color1: {
    type: String,
    default: "#77D6F2", // Basica bright cyan
  },
  color2: {
    type: String,
    default: "#F17AC0", // Basica vivid pink
  },
  delay: {
    type: Number,
    default: 150,
  },
  // Subtle = pastel sweep only, no dark ink layer — text keeps its natural color
  subtle: {
    type: Boolean,
    default: false,
  },
});

const markerRef = ref(null);
const isActive = ref(false);

onMounted(() => {
  const el = markerRef.value;
  if (!el) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            isActive.value = true;
          }, props.delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  observer.observe(el);
});
</script>

<template>
  <span
    ref="markerRef"
    class="marker-text"
    :class="{ 'is-active': isActive, 'is-subtle': subtle }"
    :style="{
      '--marker-color-1': color1,
      '--marker-color-2': color2,
    }"
  >
    <span class="marker-layer1">
      <span class="marker-layer2">
        <span class="marker-layer3">
          <slot />
        </span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.marker-text {
  position: relative;
  display: inline;
  color: #ffffff;
  font-weight: inherit;
  white-space: nowrap;
}

.marker-text.is-subtle {
  position: relative;
  display: inline;
  color: var(--text);
  font-weight: inherit;
  white-space: nowrap;
}

.marker-text .marker-layer1,
.marker-text .marker-layer2,
.marker-text .marker-layer3 {
  position: relative;
  display: inline;
  background-repeat: no-repeat;
  background-size: 0 100%;
  background-position: 0;
  transition: background-size 0.55s cubic-bezier(0.76, 0.01, 0.18, 0.99);
}

.marker-text.is-active .marker-layer1 {
  transition-delay: 0s;
  background-size: 100% 100%;
}

.marker-text.is-active .marker-layer2 {
  transition-delay: 0.06s;
  background-size: 100% 100%;
}

.marker-text.is-active .marker-layer3 {
  transition-delay: 0.12s;
  background-size: 100% 100%;
}

.marker-layer1 {
  background: linear-gradient(
    transparent 12%,
    var(--marker-color-1, #77d6f2) 12%,
    var(--marker-color-1, #77d6f2) 92%,
    transparent 92%
  );
}

.marker-layer2 {
  background: linear-gradient(
    transparent 12%,
    var(--marker-color-2, #f17ac0) 12%,
    var(--marker-color-2, #f17ac0) 92%,
    transparent 92%
  );
}

.marker-layer3 {
  /* background: linear-gradient(
    transparent 12%,
    #18283b 0,
    #18283b 92%,
    transparent 0
  ); */
  background: linear-gradient(
    transparent 12%,
    #18283b 0,
    #18283b 92%,
    transparent 0
  );
  padding-left: 0.25em;
  padding-right: 0.35em;
  border-radius: 4px;
}
</style>
