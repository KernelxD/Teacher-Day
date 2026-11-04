<script setup>
// Homepage: the wishing tree (design "Teacher Day Wish Tree", option A).
// Every wish in Firestore hangs on the tree as a small tag. From here students can read wishes,
// browse them all on the board, and hang a new one.
// Add ?demo to the address to fill the tree with 512 sample wishes. Demo mode saves nothing.
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import TreeScene from "../components/tree/TreeScene.vue";
import WishReader from "../components/tree/WishReader.vue";
import WishBoard from "../components/tree/WishBoard.vue";
import WishComposer from "../components/tree/WishComposer.vue";
import { addWish, readAllWishes, slugify } from "../components/Control.vue";
import { buildSampleWishes } from "../lib/sampleWishes.js";
import { TAG_SPOTS } from "../lib/tree.js";
import { ACCENT, MINE_COLOR, PALETTE, fold } from "../lib/wishes.js";

const route = useRoute();
const demo = "demo" in route.query;

// Oldest first, so each wish keeps its place on the tree when new ones arrive.
const wishes = ref([]);
const loading = ref(true);
const loadError = ref(false);
const mineId = ref(null);

const openId = ref(null);
const boardOpen = ref(false);
const composing = ref(false);
const composeFor = ref(null);
const composerKey = ref(0);
const sending = ref(false);
const sendError = ref("");

const query = ref("");
const teacher = ref("");
const board = ref(null);

function fromFirestore(doc) {
  return {
    id: doc.id,
    name: doc.author || "",
    to: Array.isArray(doc.target) ? doc.target : [],
    content: doc.message || "",
  };
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  if (demo) {
    wishes.value = buildSampleWishes();
    loading.value = false;
    return;
  }
  try {
    const docs = await readAllWishes();
    wishes.value = docs.map(fromFirestore);
  } catch (error) {
    console.error("Error loading wishes:", error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => window.removeEventListener("keydown", onKeydown));

// Each wish gets a color from its tag's spot on the tree; the board and reader reuse it.
const toneById = computed(() => {
  const tones = {};
  wishes.value.forEach((wish, i) => {
    const spot = TAG_SPOTS[i % TAG_SPOTS.length];
    tones[wish.id] = Math.min(PALETTE.length - 1, Math.floor(spot.tone * PALETTE.length));
  });
  return tones;
});

const filtered = computed(() => {
  const q = fold(query.value);
  return wishes.value.filter((wish) => {
    const matchesQuery =
      !q || fold(wish.name).includes(q) || fold(wish.content).includes(q) || wish.to.some((t) => fold(t).includes(q));
    const matchesTeacher = !teacher.value || wish.to.some((t) => (slugify(t) || fold(t)) === teacher.value);
    return matchesQuery && matchesTeacher;
  });
});

// Previous / next in the reader walk through the board's results when the board is open.
const readList = computed(() => (boardOpen.value ? filtered.value : wishes.value));

const selected = computed(() => wishes.value.find((w) => w.id === openId.value) || null);

const selectedHue = computed(() => {
  if (!selected.value) return PALETTE[0];
  if (selected.value.id === mineId.value) return MINE_COLOR;
  return PALETTE[toneById.value[selected.value.id] ?? 0];
});

const selectedPosition = computed(() => {
  const i = readList.value.findIndex((w) => w.id === openId.value);
  return i >= 0 ? `${i + 1} / ${readList.value.length}` : "";
});

function step(direction) {
  const list = readList.value;
  if (!list.length) return;
  const current = Math.max(0, list.findIndex((w) => w.id === openId.value));
  openId.value = list[(current + direction + list.length) % list.length].id;
}

function openBoard(focusSearch = false) {
  boardOpen.value = true;
  if (focusSearch) nextTick(() => board.value?.focusSearch());
}

function openComposer(teacherName = null) {
  composeFor.value = teacherName;
  sendError.value = "";
  openId.value = null;
  composing.value = true;
}

async function hangWish({ name, to, content }) {
  sending.value = true;
  sendError.value = "";
  try {
    const id = demo
      ? "mine-" + Date.now()
      : await addWish({ author: name, message: content, target: to, invitedBy: "VTEC" });
    wishes.value = [...wishes.value, { id, name, to, content }];
    mineId.value = id;
    composing.value = false;
    composeFor.value = null;
    composerKey.value++; // the next composer starts empty
    openId.value = id;
  } catch (error) {
    sendError.value = "Chưa gửi được lời chúc. Kiểm tra kết nối mạng rồi thử lại nhé.";
  } finally {
    sending.value = false;
  }
}

// Escape closes whatever is on top.
function onKeydown(event) {
  if (event.key !== "Escape") return;
  if (composing.value) composing.value = false;
  else if (openId.value !== null) openId.value = null;
  else if (boardOpen.value) boardOpen.value = false;
}
</script>

<template>
  <div class="tree-home" :style="{ '--accent': ACCENT }">
    <TreeScene
      :wishes="wishes"
      :mine-id="mineId"
      :tone-by-id="toneById"
      :peek-enabled="openId === null && !composing && !boardOpen"
      @open="openId = $event"
    />

    <header class="masthead">
      <div class="pills">
        <span class="pill pill-accent">VTEC</span>
        <span class="pill pill-light">xin chúc mừng</span>
      </div>
      <h1>
        <span class="date">20/11</span>
        <span class="day">Ngày Nhà giáo Việt Nam</span>
      </h1>
    </header>

    <p class="total" aria-live="polite">
      <span class="total-number">{{ loading ? "…" : wishes.length }}</span>
      <span class="total-label">lời chúc<br />trên cây</span>
    </p>

    <nav class="side-menu" aria-label="Lời chúc">
      <button type="button" class="menu-item" @click="openBoard(false)">
        <span class="menu-label">Xem tất cả</span>
        <span class="ring">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>
        </span>
      </button>
      <button type="button" class="menu-item" @click="openBoard(true)">
        <span class="menu-label">Tìm lời chúc</span>
        <span class="ring">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        </span>
      </button>
    </nav>

    <div class="bottom">
      <p v-if="loadError" class="status">Chưa tải được lời chúc. Hãy thử tải lại trang.</p>
      <p v-else-if="!loading && wishes.length === 0" class="status">Cây đang chờ lời chúc đầu tiên.</p>
      <p v-else-if="demo" class="status">Chế độ xem thử: lời chúc mẫu, không lưu lại.</p>
      <button type="button" class="compose press" @click="openComposer()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
        Viết lời chúc
      </button>
    </div>

    <WishBoard
      v-if="boardOpen"
      ref="board"
      v-model:query="query"
      v-model:teacher="teacher"
      :all="wishes"
      :filtered="filtered"
      :mine-id="mineId"
      :tone-by-id="toneById"
      @close="boardOpen = false"
      @compose="openComposer"
    />

    <WishReader
      v-if="selected && !composing"
      :wish="selected"
      :hue="selectedHue"
      :mine="selected.id === mineId"
      :position="selectedPosition"
      @prev="step(-1)"
      @next="step(1)"
      @close="openId = null"
    />

    <!-- KeepAlive keeps a half-written wish if the composer is closed by accident. -->
    <KeepAlive :max="1">
      <WishComposer
        v-if="composing"
        :key="composerKey"
        :preset-teacher="composeFor"
        :sending="sending"
        :send-error="sendError"
        @close="composing = false"
        @submit="hangWish"
      />
    </KeepAlive>
  </div>
</template>

<style scoped>
div {
  font-family: inherit;
}

button {
  font: inherit;
  color: inherit;
}

.tree-home {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 640px;
  overflow: hidden;
  background: linear-gradient(to bottom, #A7AEDB 0%, #C9C4E3 30%, #EBD6DC 60%, #FCE5CC 100%);
  color: #231B42;
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

.tree-home :deep(:focus-visible) {
  outline: 3px solid #231B42;
  outline-offset: 3px;
}

.masthead {
  position: absolute;
  z-index: 3;
  top: 28px;
  left: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  pointer-events: none;
}

.pills {
  display: flex;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 16px;
  border-radius: 9999px;
  font-size: 15px;
}

.pill-accent {
  background: var(--accent);
  font-weight: 800;
}

.pill-light {
  background: rgba(255, 255, 255, 0.72);
  font-weight: 700;
}

.masthead h1 {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date {
  display: block;
  font-family: "Horizon", "Be Vietnam Pro", sans-serif;
  font-size: 64px;
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.day {
  display: block;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.total {
  position: absolute;
  z-index: 3;
  top: 30px;
  right: 32px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-number {
  font-family: "Horizon", "Be Vietnam Pro", sans-serif;
  font-size: 40px;
  font-weight: 900;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.total-label {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  color: #3F3858;
}

.side-menu {
  position: absolute;
  z-index: 3;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.menu-item {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}

.menu-label {
  padding: 3px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 700;
}

.ring {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border-radius: 9999px;
  box-shadow: 0 6px 16px rgba(35, 27, 66, 0.16);
  transition: transform 0.15s ease, background 0.15s ease;
}

.menu-item:hover .ring {
  transform: scale(1.08);
  background: #FDEBCB;
}

.bottom {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.status {
  margin: 0;
  padding: 4px 14px;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.compose {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 0 34px;
  background: var(--accent);
  border: none;
  border-radius: 9999px;
  box-shadow: 0 10px 24px rgba(35, 27, 66, 0.18);
  font-size: 18px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
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

@media (max-width: 600px) {
  .tree-home {
    min-height: 560px;
  }

  .masthead {
    top: 16px;
    left: 16px;
    gap: 8px;
  }

  .pill {
    padding: 4px 12px;
    font-size: 13px;
  }

  .date {
    font-size: 44px;
  }

  .day {
    font-size: 16px;
  }

  .total {
    top: 18px;
    right: 16px;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    text-align: right;
  }

  .total-number {
    font-size: 30px;
  }

  .total-label {
    font-size: 12px;
  }

  .side-menu {
    top: auto;
    bottom: 132px;
    right: 16px;
    transform: none;
    flex-direction: row;
    gap: 10px;
  }

  .menu-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .ring {
    width: 48px;
    height: 48px;
  }

  .bottom {
    bottom: 20px;
    width: calc(100% - 32px);
  }

  .status {
    white-space: normal;
    text-align: center;
  }

  .compose {
    min-height: 54px;
    padding: 0 28px;
    font-size: 17px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ring,
  .press {
    transition: none;
  }
}
</style>
