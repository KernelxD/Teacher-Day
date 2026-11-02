<script setup>
import { useRoute } from "vue-router";
import { readWishesForTeacher } from "../components/Control.vue";
import { onMounted } from "vue";

const route = useRoute();

const targetSlug = route.params.teacher;

onMounted(async () => {
try {
    // Await the fetch and assign it to the reactive variable
    const result = await readWishesForTeacher(targetSlug);
    console.log(result)
  } catch (error) {
    console.error("Error fetching wishes:", error);
  }
})

</script>

<template>

</template>

<style scoped>

</style>