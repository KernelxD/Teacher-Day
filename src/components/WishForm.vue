<script setup>
import { ref, onMounted, onUnmounted, reactive } from "vue";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import InertiaPlugin from "gsap/InertiaPlugin";
import PopFX from "./PopFX.vue";
import TagInput from "./TagInput.vue";
import FieldInput from "./FieldInput.vue";
import { addWish } from "./Control.vue";
import Magnetic from "./Magnetic.vue";
import MarkerText from "./MarkerText.vue";

const author = ref("");
const message = ref("");
const invitedBy = "VTEC";
const tags = ref([]); //selected teacher

const fontOptions = [
  { id: "handwriting", name: "Nắn nót" },
  { id: "cursive", name: "Bay bổng" },
  { id: "typewriter", name: "Đánh máy" },
  { id: "modern", name: "Chuẩn mực" },
];
const selectedFont = ref("handwriting");

const errors = reactive({
  author: "",
  message: "",
  tags: "",
});

let isValid = ref(false);

const isMobile = window.innerWidth <= 600;

const PopFXRef = ref(null);
let btnColor = "var(--color-yellow)";
let ctx; //Holds GSAP context for automatic cleanup

function isValidName(str) {
  const regex = /^[^\p{P}\p{S}\d]+$/u;

  // Trim spaces and test the name
  return regex.test(str.trim());
}

function validateForm() {
  // Clear previous errors
  errors.author = "";
  errors.message = "";
  errors.tags = "";

  isValid.value = true;

  if (!author.value.trim() || !isValidName(author.value)) {
    errors.author = "Vui lòng nhập lại tên của bạn.";
    isValid.value = false;
  }

  if (!message.value.trim()) {
    errors.message = "Vui lòng nhập lại lời chúc.";
    isValid.value = false;
  }

  if (tags.value.length === 0) {
    errors.tags = "Vui lòng chọn ít nhất một giáo viên hợp lệ.";
    isValid.value = false;
  }

  return isValid.value;
}

function handleSubmit() {
  if (!validateForm()) return;
  const payload = {
    author: author.value,
    invitedBy: invitedBy || null,
    message: message.value,
    target: tags.value,
    fontStyle: selectedFont.value,
  };

  addWish(payload);
  PopFXRef.value?.play();
  console.log(payload);
}

const container = document.querySelector(".pop-container");
function handleClick() {
  btnColor = "var(--color-blue)";
}

onMounted(() => {
  gsap.registerPlugin(Draggable, InertiaPlugin);

  ctx = gsap.context(() => {
    // Initialize sticky note rotation with GSAP so dragging preserves tilt
    gsap.set("#d1", { rotation: -5 });
    gsap.set("#d2", { rotation: 5 });

    // ── Entrance animations ───────────────────────────────────
    // Letter paper slides up from below
    gsap.from(".letter-paper", {
      y: 55, opacity: 0,
      duration: 0.8, ease: "power3.out",
      delay: 0.1,
    });

    // Sticky notes fly in from above, staggered
    gsap.from(".decorative-note", {
      y: -28, opacity: 0,
      duration: 0.65, stagger: 0.18,
      ease: "back.out(1.5)",
      delay: 0.05,
    });

    Draggable.create(".decorative-note", {
      type: "x,y",
      bounds: isMobile ? undefined : "main",
      inertia: true,
      edgeResistance: 0.3,
      onPress() {
        gsap.to(this.target, { scale: 1.04, duration: 0.15, zIndex: 10 });
      },
      onRelease() {
        gsap.to(this.target, { scale: 1, duration: 0.2, zIndex: 1 });
      },
    });
  });
});

onUnmounted(() => {
  if (ctx) ctx.revert();
});
</script>

<template>
  <main>
    <div class="decorative-board"></div>
    <div class="letter-paper">
      <div class="decorative-note" id="d1">
        <div class="washi-tape"></div>
        Ghi nhớ: Chia sẻ những lời chúc chân thành, không cần sử dụng A.I
      </div>
      <div class="decorative-note" id="d2">
        <div class="washi-tape"></div>
        Ghi đầy đủ họ tên và lời chúc. Đảm bảo lời chúc lễ phép, tuân thủ <MarkerText color1="#FDA4AF" color2="#FDE68A" :subtle="true">nội quy Vinschool</MarkerText>
      </div>
      <form class="container" @submit.prevent="handleSubmit">
        <div class="form-section">
          <label for="author">Tên người viết</label>
          <FieldInput v-model="author" form-name="name" id="author" />
          <label class="error-element">{{ errors.author }}</label>
        </div>
        <div class="form-section">
          <label for="teacher">Gửi tới: </label>
          <TagInput v-model="tags" form-name="teacher" id="teacher" />
          <label class="error-element">{{ errors.tags }}</label>
        </div>

        <div class="form-section">
          <div class="message-header-row">
            <label for="message">Lời chúc của bạn tới <MarkerText color1="#77D6F2" color2="#FDE68A" :subtle="true">thầy cô</MarkerText></label>

            <!-- Custom Font Selector -->
            <div class="font-selector">
              <span class="font-selector-title">Kiểu chữ:</span>
              <div class="font-chips">
                <button
                  v-for="font in fontOptions"
                  :key="font.id"
                  type="button"
                  class="font-chip"
                  :class="[
                    'font-' + font.id,
                    { 'is-active': selectedFont === font.id },
                  ]"
                  @click="selectedFont = font.id"
                >
                  <span>{{ font.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <textarea
            placeholder="Viết những lời tri ân sâu sắc nhất tới thầy cô..."
            v-model="message"
            form-name="message"
            id="message"
            :class="'font-' + selectedFont"
          ></textarea>
          <label class="error-element">{{ errors.message }}</label>
        </div>

        <div class="button-container">
          <Magnetic
            as="button"
            class="submit-button glass-card"
            type="submit"
            @click="handleClick"
            text="Gửi lời chúc"
          />
          <PopFX ref="PopFXRef" />
        </div>
      </form>
    </div>
  </main>
</template>

<style scoped>
main {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4rem 0;
  margin-bottom: 10rem;
}

.letter-paper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(55%, 900px);
  margin-top: 169px;
  padding: 2rem 3rem;
  font-size: 1rem;
  background-color: var(--bg-light);
  border: 2px solid var(--ink);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.message-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.font-selector {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.font-selector-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
}

.font-chips {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.font-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ink);
  background: var(--bg-card);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-full);
  box-shadow: 1px 1px 0 0 var(--ink);
  cursor: pointer;
  transition: all var(--transition);
}

.font-chip:hover {
  background: var(--color-yellow);
  transform: translateY(-1px);
}

.font-chip.is-active {
  background: var(--color-yellow);
  box-shadow: 2px 2px 0 0 var(--ink);
  border-width: 2px;
}

#message {
  width: 100%;
  min-height: 140px;
  padding: 2rem 2rem 2rem 4rem;
  font-size: 1.15rem;
  line-height: 2rem;
  color: var(--text);
  background-color: var(--bg-card);
  background-image:
    linear-gradient(to right, transparent 3.5rem, #ff8080 3.5rem, #ff8080 3.6rem, transparent 3.6rem),
    repeating-linear-gradient(transparent, transparent calc(2rem - 1px), #a1c4fd calc(2rem - 1px), #a1c4fd 2rem);
  background-size: 100% 2rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  outline: none;
  resize: vertical;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition), transform var(--transition);
}

#message.font-cursive {
  font-size: 1.35rem;
}

#message.font-typewriter {
  font-size: 1rem;
}

#message:hover,
#message:focus {
  box-shadow: var(--shadow-md);
  transform: translate(-1px, -1px);
}

.decorative-board {
  position: absolute;
  z-index: -2;
  top: 60%;
  left: 50%;
  width: 90%;
  height: 90%;
  max-width: 1200px;
  max-height: 800px;
  background-color: #e6b894;
  border: 3px solid var(--ink);
  border-radius: 1.5rem;
  box-shadow: 6px 8px 0px 0px var(--ink);
  transform: translate(-50%, -50%) rotate(-2.5deg);
  pointer-events: none;
}

.decorative-note {
  position: absolute;
  z-index: 0;
  width: 12rem;
  height: 14rem;
  padding: 1.5rem;
  font-weight: 400;
  border: 3px solid var(--ink);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s ease;
}

/* Washi tape on note */
.washi-tape {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%) rotate(-1deg);
  width: 65px;
  height: 22px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(2px);
  border-left: 2px dashed rgba(24, 40, 59, 0.2);
  border-right: 2px dashed rgba(24, 40, 59, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 3;
}

#d1 {
  top: -2rem;
  left: -11rem;
  background-color: var(--color-pink);
}

/* Partially lifted effect with angled shadow for #d1 (bottom-left lifted) */
#d1::after {
  box-shadow: 2px 2px 2px var(--shadow-md);
  content: "";
  position: absolute;
  z-index: -1;
  bottom: 10px;
  left: 6px;
  width: 72%;
  height: 38%;
  background: transparent;
  transform: rotate(-7deg) skew(-7deg);
  transform-origin: bottom left;
  pointer-events: none;
  border-radius: 4px;
  transition: all 0.25s ease;
}

#d2 {
  right: -10rem;
  bottom: -5rem;
  background-color: var(--color-green);
}

/* Partially lifted effect with angled shadow for #d2 (bottom-right lifted) */
#d2::after {
  content: "";
  position: absolute;
  z-index: -1;
  bottom: 10px;
  right: 6px;
  width: 72%;
  height: 38%;
  background: transparent;
  transform: rotate(7deg) skew(7deg);
  transform-origin: bottom right;
  pointer-events: none;
  border-radius: 4px;
  transition: all 0.25s ease;
}

#d1:hover {
  box-shadow: solid 1px 1px 1px var(--shadow-md);
}

.button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .letter-paper {
    width: calc(100% - 2rem);
    margin-top: 10rem;
    padding: 1.25rem 1rem;
  }

  .decorative-board {
    width: 100%;
    height: calc(100% - 5rem);
  }

  .message-header-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
