<script setup>
// "Viết lời chúc": the form for hanging a new wish on the tree.
// It only checks the input and emits "submit"; HomeView saves the wish to Firestore.
import { computed, nextTick, onActivated, onMounted, ref } from "vue";
import { ACCENT, clean, isValidName } from "../../lib/wishes.js";

const props = defineProps({
  presetTeacher: { type: String, default: null },
  sending: { type: Boolean, default: false },
  sendError: { type: String, default: "" },
});
const emit = defineEmits(["close", "submit"]);

const MAX_LENGTH = 300;
const TEACHER_ERROR = "Tên thầy cô chỉ gồm chữ cái, không có số hay ký hiệu.";

const name = ref("");
const draft = ref("");
const tags = ref([]);
const content = ref("");
const errors = ref({});

const nameInput = ref(null);
const contentInput = ref(null);

// When opened from a teacher's column on the board, start with that teacher filled in.
function applyPreset() {
  if (props.presetTeacher) {
    tags.value = [props.presetTeacher];
    draft.value = "";
  }
  nextTick(() => (name.value ? contentInput.value : nameInput.value)?.focus());
}
onMounted(applyPreset);
onActivated(applyPreset);

function addDraftTag() {
  const value = clean(draft.value);
  if (!value) return;
  if (!isValidName(value)) {
    errors.value = { ...errors.value, to: TEACHER_ERROR };
    return;
  }
  if (!tags.value.includes(value)) tags.value = [...tags.value, value];
  draft.value = "";
  errors.value = { ...errors.value, to: "" };
}

function removeTag(i) {
  tags.value = tags.value.filter((_, j) => j !== i);
}

function onTeacherKey(event) {
  // Vietnamese keyboards (Telex, VNI) are still composing a letter: let them finish.
  if (event.isComposing) return;
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    addDraftTag();
  } else if (event.key === "Backspace" && draft.value === "" && tags.value.length) {
    tags.value = tags.value.slice(0, -1);
  }
}

function submit() {
  if (props.sending) return;
  const next = {};
  const author = clean(name.value);
  if (!author) next.name = "Hãy ghi tên của bạn nhé.";
  else if (!isValidName(author)) next.name = "Tên chỉ gồm chữ cái, không có số hay ký hiệu.";

  // A teacher name typed but not confirmed with Enter still counts.
  const to = [...tags.value];
  const pending = clean(draft.value);
  if (pending) {
    if (isValidName(pending)) {
      if (!to.includes(pending)) to.push(pending);
    } else next.to = TEACHER_ERROR;
  }
  if (!next.to && to.length === 0) next.to = "Hãy thêm ít nhất một thầy cô nhé.";

  const message = content.value.trim();
  if (!message) next.content = "Bạn chưa viết lời chúc.";

  tags.value = to;
  if (!next.to) draft.value = "";
  errors.value = next;
  if (next.name || next.to || next.content) return;

  emit("submit", { name: author, to, content: message });
}

const hint = computed(() => ({
  name: errors.value.name || "Ghi đầy đủ họ tên để thầy cô biết bạn là ai.",
  to: errors.value.to || "Nhấn Enter sau mỗi tên. Có thể gửi cho nhiều thầy cô.",
  content: errors.value.content || "Viết bằng lời của chính bạn, ngắn thôi cũng được.",
}));
</script>

<template>
  <div class="overlay" :style="{ '--accent': ACCENT }">
    <button type="button" class="backdrop" aria-label="Đóng" @click="emit('close')"></button>
    <div class="composer">
      <div class="notes">
        <aside class="note note-memo" aria-label="Ghi nhớ">
          <div class="tape" aria-hidden="true"></div>
          <strong>Ghi nhớ</strong>
          <p>Chân thành là đủ. Hãy viết bằng lời của chính bạn, không cần dùng A.I.</p>
        </aside>
        <aside class="note note-rules" aria-label="Lưu ý">
          <div class="tape" aria-hidden="true"></div>
          <strong>Lưu ý</strong>
          <ul>
            <li>Ghi đầy đủ họ tên.</li>
            <li>Lời chúc lễ phép, đúng nội quy Vinschool.</li>
          </ul>
        </aside>
      </div>

      <form class="form" role="dialog" aria-modal="true" aria-labelledby="compose-title" novalidate @submit.prevent="submit">
        <div class="form-head">
          <h2 id="compose-title">Viết lời chúc</h2>
          <button type="button" class="round" aria-label="Đóng" @click="emit('close')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div class="group">
          <label for="w-name" class="label">Tên của bạn</label>
          <div class="field" :class="{ invalid: errors.name }">
            <input id="w-name" ref="nameInput" v-model="name" type="text" autocomplete="name" placeholder="Họ và tên" aria-describedby="w-name-hint" @input="errors = { ...errors, name: '' }" />
          </div>
          <p id="w-name-hint" class="hint" :class="{ error: errors.name }" aria-live="polite">{{ hint.name }}</p>
        </div>

        <div class="group">
          <label for="w-to" class="label">Gửi tới</label>
          <div class="field chips-field" :class="{ invalid: errors.to }">
            <span v-for="(tag, i) in tags" :key="tag" class="chip">
              {{ tag }}
              <button type="button" class="chip-remove" :aria-label="`Bỏ ${tag}`" @click="removeTag(i)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </span>
            <input id="w-to" v-model="draft" type="text" autocomplete="off" placeholder="Ví dụ: Cô Lan" aria-describedby="w-to-hint" @keydown="onTeacherKey" />
          </div>
          <p id="w-to-hint" class="hint" :class="{ error: errors.to }" aria-live="polite">{{ hint.to }}</p>
        </div>

        <div class="group">
          <div class="label-row">
            <label for="w-content" class="label">Lời chúc</label>
            <span class="counter">{{ content.length }}/{{ MAX_LENGTH }}</span>
          </div>
          <textarea
            id="w-content"
            ref="contentInput"
            v-model="content"
            class="field lined"
            :class="{ invalid: errors.content }"
            rows="4"
            :maxlength="MAX_LENGTH"
            placeholder="Điều bạn muốn nói với thầy cô…"
            aria-describedby="w-content-hint"
            @input="errors = { ...errors, content: '' }"
          ></textarea>
          <p id="w-content-hint" class="hint" :class="{ error: errors.content }" aria-live="polite">{{ hint.content }}</p>
        </div>

        <p v-if="sendError" class="send-error" role="alert">{{ sendError }}</p>

        <div class="form-foot">
          <p>Lời chúc sẽ hiển thị công khai trên cây.</p>
          <button type="submit" class="submit press" :disabled="sending">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#231B42" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12 12 4H5v7l8 8Z" /><circle cx="8.5" cy="7.5" r="1.4" /></svg>
            {{ sending ? "Đang treo…" : "Treo lên cây" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
div {
  font-family: inherit;
}

button,
input,
textarea {
  font: inherit;
  color: inherit;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  padding: 24px;
  overflow-y: auto;
  animation: fade 0.2s ease both;
}

.backdrop {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: rgba(35, 27, 66, 0.28);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  cursor: default;
}

.composer {
  position: relative;
  width: min(600px, 100%);
  margin: auto;
  animation: rise 0.3s cubic-bezier(0.2, 1.2, 0.4, 1) both;
}

/* On wide screens the two sticky notes stick out on either side of the form. */
.notes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.note {
  position: absolute;
  z-index: 1;
  padding: 24px 18px 18px;
  border-radius: 4px;
  box-shadow: 0 12px 28px rgba(35, 27, 66, 0.2);
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: auto;
}

.note strong {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.note p,
.note ul {
  margin: 0;
  font-family: "Mali", "Be Vietnam Pro", cursive;
  font-size: 16px;
  line-height: 1.45;
}

.note ul {
  padding: 0 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-memo {
  top: 40px;
  left: -164px;
  width: 178px;
  background: #FFF0A6;
  transform: rotate(-6deg);
}

.note-rules {
  bottom: 76px;
  right: -158px;
  width: 174px;
  background: #D8F5D6;
  transform: rotate(5deg);
}

.tape {
  position: absolute;
  top: -11px;
  left: 50%;
  width: 64px;
  height: 22px;
  margin-left: -32px;
}

.note-memo .tape {
  background: rgba(233, 235, 248, 0.9);
  transform: rotate(-4deg);
}

.note-rules .tape {
  background: rgba(255, 255, 255, 0.85);
  transform: rotate(3deg);
}

.form {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0;
  padding: 28px 32px 26px;
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(35, 27, 66, 0.3);
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.round {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #F3F1F8;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  color: #231B42;
  font-size: 15px;
  font-weight: 700;
}

.label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.counter {
  font-size: 13px;
  font-weight: 600;
  color: #5E5874;
  font-variant-numeric: tabular-nums;
}

.field {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 8px;
  background: #F8F7FC;
  border: 1.5px solid #8E86A6;
  border-radius: 14px;
}

.field:focus-within,
.field:focus {
  border-color: #231B42;
  box-shadow: 0 0 0 4px #E9EBF8;
}

.field.invalid {
  border-color: #B42318;
}

.field input {
  flex: 1 1 160px;
  min-width: 120px;
  min-height: 44px;
  padding: 0 8px;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
}

.field input::placeholder,
.field::placeholder {
  color: #5E5874;
  opacity: 1;
}

.chips-field {
  flex-wrap: wrap;
  gap: 6px;
  min-height: 56px;
  padding: 4px 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  padding: 0 2px 0 14px;
  background: #E9EBF8;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 700;
}

.chip-remove {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
}

/* The wish box looks like ruled letter paper. */
.lined {
  display: block;
  width: 100%;
  min-height: 164px;
  padding: 2px 16px;
  resize: none;
  background-color: #F8F7FC;
  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 39px, #E3E5F5 39px, #E3E5F5 40px);
  background-attachment: local;
  font-family: "Mali", "Be Vietnam Pro", cursive;
  font-size: 19px;
  line-height: 40px;
  outline: none;
}

.hint {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  color: #5E5874;
}

.hint.error {
  color: #B42318;
}

.send-error {
  margin: 0;
  padding: 10px 14px;
  background: #FDECEA;
  border-radius: 12px;
  color: #B42318;
  font-size: 14px;
  font-weight: 700;
}

.form-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 2px;
}

.form-foot p {
  margin: 0;
  flex: 1 1 200px;
  font-size: 13px;
  color: #5E5874;
}

.submit {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 0 26px;
  background: var(--accent);
  border: none;
  border-radius: 9999px;
  box-shadow: 0 8px 20px rgba(35, 27, 66, 0.16);
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}

.submit:disabled {
  opacity: 0.7;
  cursor: progress;
}

.press {
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.press:not(:disabled):hover {
  transform: translateY(-2px);
}

.press:not(:disabled):active {
  transform: translateY(1px);
}

@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Not enough room beside the form: the notes sit above it instead. */
@media (max-width: 960px) {
  .notes {
    position: static;
    display: flex;
    gap: 12px;
    margin: 8px 0 16px;
  }

  .note {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
    flex: 1 1 0;
    width: auto;
    padding: 20px 14px 14px;
  }

  .note-memo {
    transform: rotate(-2deg);
  }

  .note-rules {
    transform: rotate(2deg);
  }

  .note p,
  .note ul {
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .overlay {
    padding: 16px;
  }

  .form {
    padding: 22px 18px 20px;
  }

  .form-head h2 {
    font-size: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay,
  .composer,
  .press {
    animation: none;
    transition: none;
  }
}
</style>
