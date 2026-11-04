<script setup>
// "Tất cả lời chúc": every wish in one column per teacher, newest first, with search and a teacher filter.
// Teachers are grouped by slugify(name), the same key the teacher pages use, so "Cô Lan" and
// "cô lan" land in one column.
import { computed, onMounted, ref } from "vue";
import { slugify } from "../Control.vue";
import { ACCENT, PALETTE, SOFT, TINTS, MINE_COLOR, fold, initials, joinNames } from "../../lib/wishes.js";

const props = defineProps({
  all: { type: Array, required: true },
  filtered: { type: Array, required: true },
  mineId: { type: [String, Number], default: null },
  toneById: { type: Object, required: true },
});
const emit = defineEmits(["close", "compose"]);

const query = defineModel("query", { type: String, default: "" });
const teacher = defineModel("teacher", { type: String, default: "" });

const teacherKey = (name) => slugify(name) || fold(name);

// How many wishes each teacher has, keyed by slug, with the first spelling we saw.
const teachers = computed(() => {
  const byKey = {};
  for (const wish of props.all) {
    for (const key of new Set(wish.to.map(teacherKey))) {
      if (!key) continue;
      if (!byKey[key]) {
        const name = wish.to.find((t) => teacherKey(t) === key);
        byKey[key] = { key, name, count: 0 };
      }
      byKey[key].count++;
    }
  }
  return Object.values(byKey).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
});

const columns = computed(() => {
  const groups = {};
  const newestFirst = [...props.filtered].reverse();
  for (const wish of newestFirst) {
    for (const key of new Set(wish.to.map(teacherKey))) {
      if (!key || (teacher.value && key !== teacher.value)) continue;
      (groups[key] = groups[key] || []).push(wish);
    }
  }

  const shown = teachers.value.filter((t) => groups[t.key]?.length);
  const single = shown.length === 1;

  return shown.map((t, i) => ({
    key: t.key,
    name: t.name,
    count: groups[t.key].length,
    tint: TINTS[i % TINTS.length],
    single,
    cards: groups[t.key].map((wish) => {
      const mine = wish.id === props.mineId;
      const tone = props.toneById[wish.id] ?? 0;
      return {
        id: wish.id,
        name: wish.name,
        initials: initials(wish.name),
        toLine: "gửi " + joinNames(wish.to),
        content: wish.content,
        mine,
        avatar: mine ? "#FFE7A3" : SOFT[tone],
        swatch: mine ? MINE_COLOR : PALETTE[tone],
      };
    }),
  }));
});

const hasFilter = computed(() => !!fold(query.value) || !!teacher.value);

const subtitle = computed(() => {
  const total = props.all.length;
  const shown = props.filtered.length;
  const count = shown === total ? `${total} lời chúc` : `${shown} / ${total} lời chúc`;
  return `${count} · ${columns.value.length} thầy cô · 20/11`;
});

function clearFilters() {
  query.value = "";
  teacher.value = "";
}

const searchInput = ref(null);
const shelf = ref(null);

function scrollShelf(dx) {
  shelf.value?.scrollBy({ left: dx, behavior: "smooth" });
}

function focusSearch() {
  searchInput.value?.focus();
}

defineExpose({ focusSearch });

const closeButton = ref(null);
onMounted(() => closeButton.value?.focus());
</script>

<template>
  <section class="board" role="dialog" aria-modal="true" aria-labelledby="board-title" :style="{ '--accent': ACCENT }">
    <header class="board-header">
      <div class="title-group">
        <span class="title-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>
        </span>
        <div class="title-text">
          <h2 id="board-title">Tất cả lời chúc</h2>
          <p aria-live="polite">{{ subtitle }}</p>
        </div>
      </div>

      <div class="filters" role="search">
        <label for="board-q" class="sr-only">Tìm theo tên, thầy cô hoặc nội dung</label>
        <div class="field search-field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E5874" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input id="board-q" ref="searchInput" v-model="query" type="search" autocomplete="off" placeholder="Tìm theo tên, thầy cô, nội dung…" />
        </div>

        <label for="board-t" class="sr-only">Lọc theo thầy cô</label>
        <div class="field select-field">
          <select id="board-t" v-model="teacher">
            <option value="">Tất cả thầy cô ({{ all.length }})</option>
            <option v-for="t in teachers" :key="t.key" :value="t.key">{{ t.name }} ({{ t.count }})</option>
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </div>

        <button v-if="hasFilter" type="button" class="clear-link" @click="clearFilters">Xoá bộ lọc</button>
        <button ref="closeButton" type="button" class="round-white" aria-label="Đóng, về cây" @click="emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </header>

    <div class="board-body">
      <template v-if="columns.length">
        <div ref="shelf" class="shelf" tabindex="0" aria-label="Lời chúc theo từng thầy cô, cuộn ngang để xem thêm">
          <div class="shelf-row">
            <section
              v-for="col in columns"
              :key="col.key"
              class="column"
              :class="{ single: col.single }"
              :aria-label="`${col.name}, ${col.count} lời chúc`"
            >
              <header class="column-header">
                <h3>{{ col.name }}</h3>
                <span class="count" :style="{ background: col.tint }">{{ col.count }}</span>
                <button type="button" class="add" :aria-label="`Viết lời chúc cho ${col.name}`" @click="emit('compose', col.name)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </header>
              <div class="cards">
                <article v-for="card in col.cards" :key="card.id" class="card" :class="{ mine: card.mine }">
                  <div class="card-head">
                    <span class="avatar" aria-hidden="true" :style="{ background: card.avatar }">{{ card.initials }}</span>
                    <div class="who">
                      <span class="who-name">{{ card.name }}</span>
                      <span class="who-to">{{ card.toLine }}</span>
                    </div>
                    <span class="swatch" aria-hidden="true" :style="{ background: card.swatch }"></span>
                  </div>
                  <p class="card-text">{{ card.content }}</p>
                  <span v-if="card.mine" class="mine-pill">Của bạn</span>
                </article>
              </div>
            </section>
          </div>
        </div>
        <button type="button" class="round-white scroll-btn left" aria-label="Cuộn sang trái" @click="scrollShelf(-640)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button type="button" class="round-white scroll-btn right" aria-label="Cuộn sang phải" @click="scrollShelf(640)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </template>

      <div v-else class="empty">
        <template v-if="all.length">
          <p class="empty-title">Không tìm thấy lời chúc nào</p>
          <p class="empty-text">Thử một từ khác, hoặc xem lời chúc cho tất cả thầy cô.</p>
          <button type="button" class="pill-button press" @click="clearFilters">Xoá bộ lọc</button>
        </template>
        <template v-else>
          <p class="empty-title">Chưa có lời chúc nào</p>
          <p class="empty-text">Hãy là người đầu tiên treo lời chúc lên cây.</p>
        </template>
      </div>
    </div>

    <button type="button" class="pill-button press compose-fab" @click="emit('compose', null)">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      Viết lời chúc
    </button>
  </section>
</template>

<style scoped>
div {
  font-family: inherit;
}

button,
input,
select {
  font: inherit;
  color: inherit;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.board {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: rgba(246, 243, 252, 0.3);
  backdrop-filter: blur(14px) saturate(1.1);
  -webkit-backdrop-filter: blur(14px) saturate(1.1);
  animation: fade 0.25s ease both;
}

.board-header {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 24px;
  padding: 24px 32px 16px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.title-icon {
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(35, 27, 66, 0.16);
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title-text h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.title-text p {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #3F3858;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.field {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 48px;
  background: #FFFFFF;
  border: 1.5px solid #8E86A6;
  border-radius: 9999px;
}

.field:focus-within {
  border-color: #231B42;
  box-shadow: 0 0 0 4px #E9EBF8;
}

.search-field {
  gap: 8px;
  width: 340px;
  max-width: 100%;
  padding: 0 8px 0 16px;
}

.search-field svg {
  flex: 0 0 auto;
}

.search-field input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
}

.search-field input::placeholder {
  color: #5E5874;
  opacity: 1;
}

.select-field select {
  appearance: none;
  -webkit-appearance: none;
  min-height: 44px;
  max-width: 260px;
  padding: 0 42px 0 16px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
}

.select-field svg {
  position: absolute;
  right: 16px;
  pointer-events: none;
}

.clear-link {
  min-height: 48px;
  padding: 0 12px;
  background: transparent;
  border: none;
  font-size: 15px;
  font-weight: 700;
  color: #1F2B73;
  text-decoration: underline;
  cursor: pointer;
}

.round-white {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #FFFFFF;
  border: none;
  border-radius: 9999px;
  box-shadow: 0 6px 16px rgba(35, 27, 66, 0.16);
  cursor: pointer;
}

.board-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.shelf {
  position: absolute;
  inset: 0;
  overflow: auto;
  padding: 6px 76px 120px;
  scrollbar-width: auto;
  scrollbar-color: #5E5874 #E6E3F0;
}

.shelf::-webkit-scrollbar {
  height: 14px;
}

.shelf::-webkit-scrollbar-track {
  background: #E6E3F0;
  border-radius: 9999px;
}

.shelf::-webkit-scrollbar-thumb {
  background: #5E5874;
  border-radius: 9999px;
  border: 3px solid #E6E3F0;
}

.shelf-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: max-content;
  min-width: 100%;
}

.column {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column.single {
  flex-basis: min(1180px, calc(100vw - 152px));
}

.column-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 14px;
  background: rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
}

.column-header h3 {
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.add {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #FFFFFF;
  border: none;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(35, 27, 66, 0.14);
  cursor: pointer;
}

.cards {
  column-gap: 14px;
}

.column.single .cards {
  column-width: 270px;
}

.card {
  break-inside: avoid;
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(35, 27, 66, 0.08), 0 6px 16px rgba(35, 27, 66, 0.07);
}

.card.mine {
  background: #FFFBEF;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.who {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.who-name {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.who-to {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: #5E5874;
}

.swatch {
  flex: 0 0 auto;
  width: 9px;
  height: 20px;
  border-radius: 1.5px;
  transform: rotate(12deg);
}

.card-text {
  margin: 0;
  font-family: "Mali", "Be Vietnam Pro", cursive;
  font-size: 16px;
  line-height: 1.5;
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.mine-pill {
  align-self: flex-start;
  padding: 2px 10px;
  background: #FFE7A3;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
}

.scroll-btn {
  position: absolute;
  z-index: 2;
  top: 50%;
  margin-top: -24px;
  box-shadow: 0 6px 16px rgba(35, 27, 66, 0.18);
}

.scroll-btn.left {
  left: 14px;
}

.scroll-btn.right {
  right: 14px;
}

.empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  text-align: center;
}

.empty-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.empty-text {
  margin: 0;
  font-size: 16px;
  color: #5E5874;
}

.pill-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 24px;
  background: var(--accent);
  border: none;
  border-radius: 9999px;
  box-shadow: 0 8px 20px rgba(35, 27, 66, 0.16);
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.compose-fab {
  position: absolute;
  z-index: 3;
  right: 32px;
  bottom: 32px;
  min-height: 60px;
  padding: 0 26px 0 20px;
  box-shadow: 0 10px 24px rgba(35, 27, 66, 0.22);
  font-size: 17px;
}

.press {
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.press:hover {
  transform: translateY(-2px);
}

.press:active {
  transform: translateY(1px);
}

@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 600px) {
  .board-header {
    padding: 16px 16px 12px;
  }

  .title-icon {
    width: 44px;
    height: 44px;
  }

  .title-text h2 {
    font-size: 22px;
  }

  .filters {
    width: 100%;
  }

  .search-field {
    width: 100%;
  }

  .select-field {
    flex: 1 1 auto;
  }

  .select-field select {
    width: 100%;
    max-width: none;
  }

  .shelf {
    padding: 4px 16px 120px;
  }

  .column {
    flex-basis: calc(100vw - 48px);
  }

  .column.single {
    flex-basis: calc(100vw - 32px);
  }

  .scroll-btn {
    display: none;
  }

  .compose-fab {
    right: 16px;
    bottom: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .board,
  .press {
    animation: none;
    transition: none;
  }
}
</style>
