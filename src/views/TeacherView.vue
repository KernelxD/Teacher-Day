<script setup>
import { useRoute } from "vue-router";
import { readWishesForTeacher } from "../components/Control.vue";
import { onMounted, ref, computed, nextTick } from "vue";
import InteractiveEnvelope from "../components/InteractiveEnvelope.vue";
import MarkerText from "../components/MarkerText.vue";
import gsap from "gsap";

const route = useRoute();

const targetSlug = computed(() => route.params.teacher || "vtec");
const teacherData = ref([]);
const isLoading = ref(true);

const teacherName = computed(() => {
  if (teacherData.value.length > 0 && Array.isArray(teacherData.value[0].target)) {
    return teacherData.value[0].target[0];
  }
  return "Thầy Cô";
});

onMounted(async () => {
  try {
    isLoading.value = true;
    teacherData.value = await readWishesForTeacher(targetSlug.value);
    console.log("Teacher wishes loaded:", teacherData.value);

    // Stagger-animate envelopes in after they render
    if (teacherData.value.length > 0) {
      await nextTick();
      gsap.from(".wish-container > *", {
        y: 45, opacity: 0, scale: 0.95,
        duration: 0.55, stagger: 0.1,
        ease: "power2.out",
      });
    }
  } catch (error) {
    console.error("Error fetching wishes:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <main class="teacher-view-main">
    <!-- Header Section -->
    <header class="teacher-header" v-if="teacherData.length > 0">
      <div class="header-badge">
        <span>Hòm Thư Tri Ân 20/11</span>
      </div>
      <h1 class="header-title">
        Chúng con cảm ơn
        <span class="squiggle" style="--squiggle-color: #F17AC0">
          <MarkerText color1="#FFF25C" color2="#97EC8C" :subtle="false">{{ teacherName }}</MarkerText>
        </span>
        vì đã luôn tận tụy dẫn dắt chúng con!
      </h1>
      <p class="header-sub">
        Chạm vào phong bì thư để mở đọc những dòng tâm sự và lời chúc chân thành nhất từ các bạn học sinh.
      </p>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang mở hòm thư gửi gắm tới thầy cô...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="teacherData.length === 0" class="empty-state">
      <h2>Chưa có lá thư nào được gửi tới {{ teacherName }}</h2>
      <p>Hãy là người đầu tiên gửi trao lời chúc thân thương tới thầy cô nhé!</p>
      <RouterLink to="/" class="write-wish-btn">
        Viết lời chúc ngay
      </RouterLink>
    </div>

    <!-- Envelopes Grid -->
    <section v-else class="wish-container">
      <InteractiveEnvelope
        v-for="wish in teacherData"
        :key="wish.id"
        :wish="wish"
      />
    </section>
  </main>
</template>

<style scoped>
.teacher-view-main {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.teacher-header {
  text-align: center;
  max-width: 820px;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.header-badge {
  display: inline-flex;
  padding: 0.35rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink);
  background: var(--color-yellow);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.header-title {
  font-family: var(--font-main);
  font-size: clamp(1.6rem, 3.8vw, 2.4rem);
  font-weight: 800;
  line-height: 1.35;
  color: var(--ink);
  letter-spacing: -0.02em;
}

.header-sub {
  font-size: 1rem;
  color: var(--text-muted);
  max-width: 620px;
}

/* Envelopes Grid Layout */
.wish-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 3rem 2rem;
  width: 100%;
  justify-items: center;
  align-items: start;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-state h2 {
  font-size: 1.5rem;
  color: var(--ink);
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.write-wish-btn {
  display: inline-flex;
  padding: 0.8rem 1.8rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
  background: var(--color-yellow);
  border: 2px solid var(--ink);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  text-decoration: none;
  transition: all var(--transition);
}

.write-wish-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-lg);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(24, 40, 59, 0.2);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .wish-container {
    grid-template-columns: 1fr;
    gap: 2.5rem 1rem;
  }
}
</style>
