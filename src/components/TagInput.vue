<script setup>
import { ref } from "vue";

const formName = defineProps({ formName: String });

const placeholder = `Enter your ${formName.formName}'s name`;
const newTag = ref("");
const tags = defineModel({type: Array, default: () => []});

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
</script>
<template>
  <div class="tag-input">
    <div v-for="(tag, index) in tags" :key="tag" class="tag">
      {{ tag }}
      <span @click="removeTag(index)">&times;</span>
    </div>
    <input
      v-model="newTag"
      @keydown="addTag"
      @keydown.delete="removeLastTag"
      class="tag-input-field"
      type="text"
      :placeholder
    />
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

.tag > span {
  cursor: pointer;
}
</style>
