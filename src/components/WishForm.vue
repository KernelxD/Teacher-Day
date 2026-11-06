<script setup>
import { ref, onMounted, onUnmounted, reactive } from "vue";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import InertiaPlugin from "gsap/InertiaPlugin";
import PopFX from "./PopFX.vue";
import TagInput from "./TagInput.vue";
import FieldInput from "./FieldInput.vue";
import { addWish } from "./Control.vue";

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

const PopFXRef = ref(null)
let btnColor = "var(--color-yellow)"

const btnRef = ref(null);
const txtRef = ref(null);
const strength = 0.4; //magnetic sentivity multiplier
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

const container = document.querySelector(".pop-container")
function handleClick() {
  btnColor = "var(--color-blue)";
}

onMounted(() => {
  gsap.registerPlugin(Draggable);
  gsap.registerPlugin(InertiaPlugin);

  const btn = btnRef.value;
  // const btn = document.querySelectorAll('.magneticBtn')
  const txt = txtRef.value;

  if (!btn || !txt) return;

  // Use gsap.context for clean component lifecycle management in Vue
  ctx = gsap.context(() => {

    Draggable.create(".decorative-note", {
      type: "x,y",
      bounds: isMobile ? undefined : ".decorative-board",
      inertia: true,
      edgeResistance: 0.3,
    });
    
    // Magnetic pull tracking
    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);

      gsap.to(btn, {
        x: x * strength,
        y: y * strength,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });

      gsap.to(txt, {
        x: x * strength * 0.9,
        y: y * strength * 1.5,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)",
        overwrite: "auto",
      });

      gsap.to(txt, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)",
        overwrite: "auto",
      });
    };

    btn.addEventListener("mousemove", handleMouseMove);
    btn.addEventListener("mouseleave", handleMouseLeave);
  });
});
onUnmounted(() => {
  if (ctx) ctx.revert(); // Reverts all GSAP animations and removes listeners when unmounted
});
</script>
<template>
  <main>
    <div class="decorative-board"></div>
    <div class="letter-paper">
      <div class="decorative-note" id="d1">
        Ghi nhớ: Chia sẻ những lời chúc chân thành, không cần sử dụng A.I
      </div>
      <div class="decorative-note" id="d2">Ghi đầy đủ họ tên và lời chúc
Đảm bảo lời chúc lễ phép, tuân thủ nội quy Vinschool</div>
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
        <!-- Attached ref="btnRef" to link element with script -->
        <button ref="btnRef" class="submit-button" type="submit" @click="handleClick" :style="{  backgroundColor: btnColor }">
          <label ref="txtRef" class="submit-button-label">Gửi lời chúc</label>
          <PopFX ref="PopFXRef"/>
        </button>
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
  background-color: var(--bg-light);
  background-image:
    linear-gradient(to right, transparent 3.5rem, #ff8080 3.5rem, #ff8080 3.6rem, transparent 3.6rem),
    repeating-linear-gradient(transparent, transparent calc(2rem - 1px), #a1c4fd calc(2rem - 1px), #a1c4fd 2rem);
  background-size: 100% 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-inset);
  outline: none;
  resize: vertical;
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
  background-color: #e4b083;
  border: 2px solid var(--text);
  border-radius: 1.5rem;
  box-shadow: 4px 10px 15px 3px rgba(0, 0, 0, 0.38);
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
  box-shadow: var(--shadow-lg);
}

#d1 {
  top: -2rem;
  left: -11rem;
  background-color: var(--color-pink);
  transform: rotate(-5deg);
}

#d2 {
  right: -10rem;
  bottom: -5rem;
  background-color: var(--color-green);
  transform: rotate(5deg);
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
