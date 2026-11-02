<script setup>
import { ref, onMounted, onUnmounted, reactive } from "vue";
import { gsap } from "gsap";
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

  return isValid;
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
  console.log(payload);
}

onMounted(() => {
  const btn = btnRef.value;
  const txt = txtRef.value;

  if (!btn || !txt) return;

  // Use gsap.context for clean component lifecycle management in Vue
  ctx = gsap.context(() => {

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
    <form class="container" @submit.prevent="handleSubmit">
      <div class="form-section">
        <label for="author">Tên người viết</label>
        <FieldInput v-model="author" form-name="name" id="author" />
        <label class="error-element">{{ errors.author }}</label>
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
      <div class="form-section">
        <label for="teacher">Tên giáo viên cụ thể nếu muốn</label>
        <TagInput v-model="tags" form-name="teacher" id="teacher" />
        <label class="error-element">{{ errors.tags }}</label>
      </div>
      <!-- Attached ref="btnRef" to link element with script -->
      <button ref="btnRef" class="submit-button" type="submit">
        <label ref="txtRef" class="submit-button-label">Gửi lời chúc</label>
      </button>
    </form>
  </main>
</template>
<style scoped>
main {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100dvh; /* Uses full screen height on desktop & mobile browsers */
  box-sizing: border-box;
}

.container {
  display: flex;
  width: 80%;
  flex-direction: column;
  gap: var(--space-md);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

#message {
  width: 100%;
  min-height: 120px; /* Adjust height as needed */
  padding: var(--space-sm);
  background-color: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 1rem;
  resize: vertical; /* Allows vertical resizing while keeping width fixed */
  box-sizing: border-box;
  outline: none;
}

.submit-button {
  font-family: inherit;
  font-size: 1rem;
  color: var(--text);
  background-color: var(--bg-light);
  align-self: center;
  cursor: pointer;
  padding: 1rem 2rem;
  border: solid 1px var(--border);
  border-radius: var(--radius-sm);
  display: inline-block;
  will-change: transform; /* Optimizes GSAP transform rendering */
  margin-top: 1rem;
}

.submit-button-label {
  display: inline-block;
  pointer-events: none;
  will-change: transform;
}
</style>
