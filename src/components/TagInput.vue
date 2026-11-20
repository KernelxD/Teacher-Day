<script setup>
import { ref } from "vue";
import TeacherNameInput from "./TeacherNameInput.vue";
import { isValidTeacherName, resolveTeacherName, uniqueTeacherNames } from "../lib/teachers.js";

const props = defineProps({ formName: String, options: { type: Array, default: () => [] }, inputId: { type: String, default: "teacher" },
  campus: { type: String, default: "" }, campusesByTeacher: { type: Object, default: () => ({}) } });
const newTag = ref("");
const tags = defineModel({type: Array, default: () => []});
const error = ref("");

function getRecipients() {
  const pending = resolveTeacherName(newTag.value, props.options);
  if (pending && !isValidTeacherName(pending)) throw new Error("Tên thầy cô chỉ gồm chữ cái; có thể thêm môn học hoặc vai trò trong ngoặc.");
  return uniqueTeacherNames([...tags.value, pending], props.options);
}

function addTag(value) {
  newTag.value = value;
  try {
    tags.value = getRecipients();
    newTag.value = "";
    error.value = "";
  } catch (failure) { error.value = failure.message; }
}

function removeTag(index) {
  tags.value.splice(index, 1);
}

function removeLastTag() {
  if (newTag.value == "") {
    tags.value.pop();
  }
}

defineExpose({ getRecipients });
</script>
<template>
  <div>
    <div class="tag-input">
      <div v-for="(tag, index) in tags" :key="tag" class="tag">
        {{ tag }}
        <button type="button" :aria-label="`Bỏ ${tag}`" @click="removeTag(index)">&times;</button>
      </div>
      <TeacherNameInput :id="inputId" v-model="newTag" :options="options" :selected="tags" :campus="campus" :campuses-by-teacher="campusesByTeacher"
        @commit="addTag" @remove-last="removeLastTag" />
    </div>
    <p v-if="error" class="tag-error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped>
/* :global(:root) {

} */
.tag-input {
  color: var(--text);
  background-color: var(--bg);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  border: solid 1px var(--border);
  border-radius: var(--space-sm);
  min-height: 45px;
  padding: var(--space-xs) var(--space-sm);
  width: 100%;
  box-sizing: border-box; /* box-sizing: border-box includes the padding and border when calculating the size */
}

.tag-input-field {
  font-family: inherit;
  font-size: 1rem;
  color: var(--text);
  flex: 1;
  border: none;
  background-color: var(--bg);
  outline: none;
  min-width: 120px; /*Keep the input useable even if the tags fill the row */
}

.tag {
  display: inline-flex;
  align-items: center;
  background: var(--bg-light);
  border: solid 1px var(--border-muted);
  border-radius: var(--radius-sm);
  /* box-shadow: 1px 1px 0px 0px var(--primary); */
  padding: var(--space-xs) var(--space-sm);
  gap: var(--space-sm);
}

.tag > button {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.tag-error { color: #B42318; font-size: 14px; }
</style>
