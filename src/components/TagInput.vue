<script setup>
import { onMounted, ref } from "vue";

const formName = defineProps({ formName: String });

const placeholder = `Enter your ${formName.formName}'s name`;
const newTag = ref("");
const tags = defineModel({type: Array, default: () => []});

const pastelColors = [
  '#ffadad', // Pastel Red
  '#ffd6a5', // Pastel Orange
  '#fdffb6', // Pastel Yellow
  '#caffbf', // Pastel Green
  '#9bf6ff', // Pastel Cyan
]

function isValidName (str){
  const regex = /^[^\p{P}\p{S}\d]+$/u;

  // Trim spaces and test the name
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

function removeTag(index) {
  console.log(index);
  tags.value.splice(index, 1);
}

function removeLastTag() {
  if (newTag.value == "") {
    tags.value.pop();
  }
}

onMounted(() => {
  tags.value.push("Tất cả thầy cô");
})
</script>
<template>
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
</template>
<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background-color: var(--bg-light);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

.tag-remove {
  cursor: pointer;
}
</style>
