<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import WishForm from "../components/WishForm.vue";

gsap.registerPlugin(SplitText);

const heroRef = ref(null);
const titleEl = ref(null);
const subEl = ref(null);

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
  <section class="hero" ref="heroRef">
    <div class="decorative-blob b1"></div>
    <div class="decorative-blob b2"></div>
    <div class="hero-text">
      <div class="top">
        <h3 id="t-1" class="subtitle1">VTEC</h3>
        <h3 id="t-2" class="subtitle1">xin chúc mừng</h3>
      </div>
      <h1 ref="titleEl" class="title">20/11</h1>
      <h2 ref="subEl" class="subtitle2">Ngày nhà giáo Việt Nam</h2>
    </div>
  </section>
  <section class="wish-view-new">
    <WishForm />
  </section>
</template>

<style scoped>
.hero {
  position: relative;
}

.decorative-blob {
  position: absolute;
  z-index: -2;
  height: 45rem;
  filter: blur(100px);
}

.b1 {
  top: -10rem;
  left: -10rem;
  width: min(100% - 1rem, 1000px);
  background-color: oklch(83.79% 0.09886 357.502);
  transform: translate(-50%, -50%);
}

.b2 {
  top: 7rem;
  right: 0;
  width: min(70% - 2rem, 700px);
  background-color: oklch(97.321% 0.0596 100.251);
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
  padding: var(--space-xs) var(--space-lg);
  font-size: 1.8rem;
  border: 1px solid var(--ink);
  border-radius: var(--radius-full);
}

#t-1 {
  background-color: var(--color-blue);
}

#t-2 {
  background-color: var(--color-pink);
}

.hero-text h1 {
  width: fit-content;
  margin-inline: auto;
  font-family: var(--font-display);
  font-size: clamp(6rem, 20vw, 15rem);
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}

.hero-text h2 {
  display: flex;
  justify-content: space-between;
  width: var(--title-w, 100%);
  font-size: calc(clamp(2rem, 7vw, 4.5rem) * var(--sub-scale, 1));
  font-weight: 700;
  letter-spacing: -0.3rem;
  line-height: 1;
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
    font-size: clamp(0.85rem, 4vw, 1.8rem);
  }
}
</style>
