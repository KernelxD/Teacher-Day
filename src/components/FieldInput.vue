<script setup>
import { stringConcat } from "firebase/firestore/pipelines";
import { ref } from "vue";

const formName = defineProps({ formName: String });
const formModel = defineModel({
  type: String,
  default: "John Doe",
  required: true,
});

const placeholder = `Enter your ${formName.formName}`;
</script>
<template>
  <div class="input">
    <input
      v-model="formModel"
      class="input-field"
      type="text"
      :placeholder
      @keydown.enter.prevent
    />
  </div>
</template>
<style>
/* :global(:root) {

} */
.input {
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

.input-field {
  font-family: inherit;
  color: var(--text);
  font-size: 1rem;
  flex: 1;
  border: none;
  background-color: var(--bg);
  outline: none;
  min-width: 120px; /*Keep the input useable even if the tags fill the row */
}
</style>
