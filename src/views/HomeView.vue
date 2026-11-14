<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import WishForm from "../components/WishForm.vue";
import Magnetic from "../components/Magnetic.vue";
import RailToc from "../components/RailToc.vue";

gsap.registerPlugin(SplitText);

const tocItems = [
  { id: "hero", label: "20/11 VTEC", depth: 0 },
  { id: "invitation", label: "Lời mở đầu", depth: 1 },
  { id: "wish-section", label: "Gửi lời chúc", depth: 0 },
];

const heroRef = ref(null);
const titleEl = ref(null);
const subEl = ref(null);
const wishSectionRef = ref(null);

function scrollToForm() {
  wishSectionRef.value?.scrollIntoView({ behavior: "smooth" });
}

let split, tween, ro, lastW = 0;

function rebuild() {
  const hero = heroRef.value, h1 = titleEl.value, h2 = subEl.value;
  if (!hero || !h1 || !h2) return;

  const W = h1.getBoundingClientRect().width;      // the date's glyph width
  if (!W || Math.abs(W - lastW) < 0.5) return;     // ignore no-op resizes
  lastW = W;

  split?.revert();   // restore real text before measuring
  tween?.kill();

  // natural subtitle width, normalised back to scale 1
  const cur = parseFloat(getComputedStyle(h2).getPropertyValue("--sub-scale")) || 1;
  h2.style.width = "max-content";
  const natural = h2.getBoundingClientRect().width / cur;
  h2.style.width = "";

  // shrink to fit the date; never enlarge past the clamp() size
  hero.style.setProperty("--title-w", `${W}px`);
  hero.style.setProperty("--sub-scale", String(Math.min(1, W / natural)));

  split = SplitText.create(h2, { type: "words", wordsClass: "split-word" });
  tween = gsap.from(split.words, {
    yPercent: 60,
    opacity: 0,
    duration: 0.7,
    stagger: 0.06,
    ease: "power3.out",
  });
}

onMounted(async () => {
  await document.fonts.ready;      // Horizon is a webfont — measure after it lands
  rebuild();
  ro = new ResizeObserver(rebuild); // fires when 20vw / the font changes the width
  ro.observe(titleEl.value);
});

onUnmounted(() => {
  ro?.disconnect();
  tween?.kill();
  split?.revert();
});
</script>

<template>  
  <!-- <RailToc :items="tocItems" title="Mục lục" /> -->
  <section class="hero" id="hero" ref="heroRef">
    <div class="decorative-blob b1"></div>
    <div class="decorative-blob b2"></div>
    <div class="hero-text">
      <div class="top">
        <Magnetic as="h3" id="t-1" class="subtitle1 glass-card">VTEC</Magnetic>
        <Magnetic as="h3" id="t-2" class="subtitle1 glass-card">xin chúc mừng</Magnetic>
      </div>
      <h1 ref="titleEl" class="title">20/11</h1>
      <h2 ref="subEl" class="subtitle2">Ngày nhà giáo Việt Nam</h2>
    </div>
  </section>
  <div class="magnetic-container" id="invitation">
    <Magnetic text="Gửi lời chúc ngay" class="glass-card" @click="scrollToForm" />
  </div>
  <section class="wish-view-new" id="wish-section" ref="wishSectionRef">
    <WishForm />
  </section>
</template>

<style scoped>
.magnetic-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2.5rem 0;
  position: relative;
  z-index: 5;
}

.hero {
  position: relative;
}

.decorative-blob {
  position: absolute;
  z-index: -2;
  height: 35rem;
  filter: blur(80px);
  opacity: 0.25;
  pointer-events: none;
}

.b1 {
  top: -6rem;
  left: -6rem;
  width: min(100% - 1rem, 750px);
  background-color: var(--color-blue);
  transform: translate(-30%, -30%);
}

.b2 {
  top: 8rem;
  right: -5rem;
  width: min(70% - 2rem, 600px);
  background-color: var(--color-yellow);
}

.hero-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 2rem;
}

.hero-text .top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
}

.hero-text h3 {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0.35rem 1.4rem;
  font-size: 1.4rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  font-weight: 700;
  color: var(--ink);
}

#t-1 {
  background-color: var(--color-blue);
}

#t-2 {
  background-color: var(--color-pink);
}

.hero-text h1 {
  color: var(--ink);
  width: fit-content;
  margin-inline: auto;
  font-family: var(--font-display);
  font-size: clamp(6rem, 20vw, 15rem);
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.hero-text h2 {
  color: var(--ink);
  display: flex;
  justify-content: space-between;
  width: var(--title-w, 100%);
  font-size: calc(clamp(2rem, 7vw, 4.5rem) * var(--sub-scale, 1));
  font-weight: 800;
  letter-spacing: -0.2rem;
  line-height: 1.1;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .hero-text {
    padding: 0 1rem;
  }

  .hero-text .top {
    gap: var(--space-sm);
  }

  .hero-text h3 {
    font-size: clamp(0.85rem, 4vw, 1.2rem);
  }
}
</style>
