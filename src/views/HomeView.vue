<script setup>
import { RouterLink } from "vue-router";
import WishForm from "../components/WishForm.vue";
</script>

<template>
  <section class="hero">
    <div class="decorative-blob blur b1"></div>
    <div class="decorative-blob blur b2"></div>
    <div class="hero-text">
      <div class="top">
        <h3 id="t-1">VTEC</h3>
        <h3 id="t-2">xin chúc mừng</h3>
      </div>
      <h1>20/11</h1>
      <h2>Ngày nhà giáo Việt Nam</h2>
    </div>
  </section>
  <section class="wish-view-new">
    <WishForm />
  </section>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-main);
}

.hero {
  position: relative;
}

.blur {
  filter: blur(100px);
  position: absolute;
}

.decorative-blob {
  position: absolute;
  z-index: -2;
}

.b1 {
  width: min(100% - 1rem, 1000px);
  top: -10rem;
  left: -10rem;
  transform: translateX(-50%) translateY(-50%);
  height: 45rem;
  background: oklch(83.79% 0.09886 357.502);
}

.b2 {
  width: min(70% - 2rem, 700px);
  height: 45rem;
  left: auto;
  right: 0;
  top: 7rem;
  transform: none;
  background: oklch(97.321% 0.0596 100.251);
}

.hero-text {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  padding: 0 2rem;
}

.hero-text .top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 800px;
}

.hero-text h3 {
  font-size: 1.8rem;
  display: inline-flex;
  align-items: center;
  border: solid 1px var(--shadow);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-lg);
  gap: var(--space-sm);
}

#t-1 {
  background: var(--color-pink);
  /* box-shadow: 0px 3px 0px 0px var(--shadow); */
}

#t-2 {
  background: var(--color-yellow);
  /* box-shadow:0px 3px 0px 0px var(--shadow); */
}

.hero-text h1 {
  text-transform: uppercase;
  font-family: "Horizon", sans-serif;
  font-size: clamp(6rem, 20vw, 15rem);
  font-weight: 900;
  line-height: 1;
}

.hero-text h2 {
  font-size: clamp(2rem, 7vw, 4.5rem);
  font-weight: 700;
  text-align: center;
  letter-spacing: clamp(-0.15rem, -0.5vw, -0.25rem);
  line-height: 1;
  letter-spacing: -0.3rem;
  width: 100%;
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
