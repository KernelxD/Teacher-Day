<script setup>
import { onMounted, ref } from "vue";

const formName = defineProps({ formName: String });

const placeholder = `Enter your ${formName.formName}'s name`;
const newTag = ref("");
const tags = defineModel({ type: Array, default: () => [] });

const pastelColors = [
  "#ffadad", // Pastel Red
  "#ffd6a5", // Pastel Orange
  "#fdffb6", // Pastel Yellow
  "#caffbf", // Pastel Green
  "#9bf6ff", // Pastel Cyan
];

const quickSuggestions = [
  "Tất cả thầy cô",
  "Cô chủ nhiệm",
  "Thầy hiệu trưởng",
  "Thầy cô bộ môn",
];

function isValidName(str) {
  const regex = /^[^\p{P}\p{S}\d]+$/u;
  return regex.test(str.trim());
}

function addTag(event) {
  if (event.code == "Comma" || event.code == "Enter") {
    event.preventDefault();
    const val = newTag.value.trim();

    if (val.length > 0 && !tags.value.includes(val) && isValidName(val)) {
      tags.value.push(val);
      newTag.value = "";
    }
  }
}

function toggleSuggestion(suggestion) {
  const idx = tags.value.indexOf(suggestion);
  if (idx > -1) {
    tags.value.splice(idx, 1);
  } else {
    tags.value.push(suggestion);
  }
}

function removeTag(index) {
  tags.value.splice(index, 1);
}

function removeLastTag() {
  if (newTag.value == "") {
    tags.value.pop();
  }
}

onMounted(() => {
  tags.value.push("Tất cả thầy cô");
});
</script>

<template>
  <div class="tag-container">
    <div class="field">
      <div
        v-for="(tag, index) in tags"
        :key="tag"
        class="tag"
        :style="{ backgroundColor: pastelColors[index % pastelColors.length] }"
      >
        {{ tag }}
        <span class="tag-remove" @click="removeTag(index)">&times;</span>
      </div>
      <input
        v-model="newTag"
        @keydown="addTag"
        @keydown.delete="removeLastTag"
        class="field__input"
        type="text"
      />
    </div>

    <!-- Quick suggestions -->
    <div class="quick-suggestions">
      <span class="quick-title">Gợi ý nhanh:</span>
      <button
        v-for="item in quickSuggestions"
        :key="item"
        type="button"
        class="quick-chip"
        :class="{ 'is-selected': tags.includes(item) }"
        @click="toggleSuggestion(item)"
      >
        <span class="plus-icon">{{ tags.includes(item) ? '✓' : '+' }}</span>
        {{ item }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.tag-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 3px 8px;
  background-color: var(--bg-light);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ink);
}

.tag-remove {
  cursor: pointer;
  font-weight: 700;
  margin-left: 2px;
}

.quick-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.8rem;
  margin-top: 2px;
}

.quick-title {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.quick-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--text);
  background: var(--bg-light);
  border: 1px dashed var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition);
}

.quick-chip:hover {
  background: var(--color-yellow);
  border-style: solid;
}

.quick-chip.is-selected {
  background: var(--color-green);
  border-style: solid;
  border-color: var(--ink);
}

.plus-icon {
  font-weight: 700;
}
</style>
