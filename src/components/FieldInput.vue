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
  <div class="field">
    <input
      v-model="formModel"
      class="field__input"
      type="text"
      @keydown.enter.prevent
    />
  </div>
</template>
