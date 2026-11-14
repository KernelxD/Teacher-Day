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

const author = ref("");
const message = ref("");
const invitedBy = "VTEC";
const tags = ref([]); //selected teacher

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
        Ghi đầy đủ họ tên và lời chúc
        Đảm bảo lời chúc lễ phép, tuân thủ nội quy Vinschool
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
          <label for="message">Lời chúc của bạn tới thầy cô</label>
          <textarea
            placeholder="Enter your wishes"
            v-model="message"
            form-name="message"
            id="message"
          ></textarea>
          <label class="error-element">{{ errors.message }}</label>
        </div>
        <div class="button-container">
          <Magnetic as="button"
          class="submit-button glass-card"
          type="submit"
          @click="handleClick"
          text='Gửi lời chúc'>
          </Magnetic>
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

#message {
  width: 100%;
  min-height: 120px;
  padding: 2rem 2rem 2rem 4rem;
  font-family: inherit;
  font-size: 1rem;
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
  background-color: #E6B894;
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
  justify-content: center;
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
}
</style>
