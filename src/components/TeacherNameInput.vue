<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from "vue";
import { teacherOptionsForCampus, teacherSuggestions } from "../lib/teachers.js";
import { teacherKey } from "../lib/wishes.js";

const props = defineProps({
  id: { type: String, required: true },
  options: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  campus: { type: String, default: "" },
  campusesByTeacher: { type: Object, default: () => ({}) },
  describedBy: { type: String, default: undefined },
  invalid: { type: Boolean, default: false },
});
const value = defineModel({ type: String, default: "" });
const emit = defineEmits(["commit", "remove-last"]);
const root = ref(null);
const input = ref(null);
const focused = ref(false);
const active = ref(-1);
const dismissed = ref(false);
const availableOptions = computed(() => teacherOptionsForCampus(props.options, props.campus, props.campusesByTeacher));
const suggestions = computed(() => teacherSuggestions(availableOptions.value, value.value, props.selected));
const expanded = computed(() => focused.value && !!value.value.trim() && !dismissed.value && suggestions.value.length > 0);
const listId = computed(() => `${props.id}-suggestions`);
watch(value, () => { active.value = -1; dismissed.value = false; });
watch(suggestions, () => { active.value = -1; });

// Use the same database-backed recipients as autocomplete, including the school-wide group.
const exampleNames = computed(() => {
  const selectedKeys = new Set(props.selected.map(teacherKey));
  const names = availableOptions.value
    .filter((name) => !selectedKeys.has(teacherKey(name)));
  // Shuffle once per updated name list, keeping the order steady while the user types.
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names;
});
const typedExample = ref("");
const animating = ref(false);
const reducedMotion = ref(false);
let motionPreference;
const updateMotionPreference = () => { reducedMotion.value = motionPreference.matches; };

onMounted(() => {
  motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  updateMotionPreference();
  motionPreference.addEventListener("change", updateMotionPreference);
  animating.value = true;
});
onActivated(() => { animating.value = true; });
onDeactivated(() => { animating.value = false; });
onBeforeUnmount(() => {
  animating.value = false;
  motionPreference?.removeEventListener("change", updateMotionPreference);
});

watch([exampleNames, value, animating, reducedMotion], ([names, entered, enabled, reduce], _, onCleanup) => {
  typedExample.value = "";
  if (!names.length || entered || !enabled) return;
  if (reduce) {
    typedExample.value = names[0];
    return;
  }

  let timer;
  let index = 0;
  let length = 0;
  let erasing = false;
  function tick() {
    // Array.from keeps Unicode characters intact, including Vietnamese letters.
    const letters = Array.from(names[index]);
    length += erasing ? -1 : 1;
    typedExample.value = letters.slice(0, length).join("");
    let delay = erasing ? 45 : 90;
    if (!erasing && length === letters.length) {
      erasing = true;
      delay = 1800;
    } else if (erasing && length === 0) {
      erasing = false;
      index = (index + 1) % names.length;
      delay = 350;
    }
    timer = setTimeout(tick, delay);
  }
  timer = setTimeout(tick, 500);
  onCleanup(() => clearTimeout(timer));
});

function choose(name) {
  value.value = name;
  emit("commit", name);
  input.value?.focus();
  active.value = -1;
  dismissed.value = true;
}

function onKeydown(event) {
  if (event.isComposing) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    if (!value.value.trim() || !suggestions.value.length) return;
    event.preventDefault();
    dismissed.value = false;
    const count = suggestions.value.length;
    active.value = active.value < 0 ? (event.key === "ArrowDown" ? 0 : count - 1)
      : (active.value + (event.key === "ArrowDown" ? 1 : -1) + count) % count;
  } else if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    choose(expanded.value && active.value >= 0 && active.value < suggestions.value.length ? suggestions.value[active.value] : value.value);
  } else if (event.key === "Backspace" && !value.value) {
    emit("remove-last");
  } else if (event.key === "Escape" && expanded.value) {
    event.preventDefault();
    event.stopPropagation();
    dismissed.value = true;
  }
}

defineExpose({ focus: () => input.value?.focus() });
</script>

<template>
  <div ref="root" class="teacher-entry" @focusout="focused = !!root?.contains($event.relatedTarget)">
    <input
      :id="id" ref="input" v-model="value" type="text" role="combobox" autocomplete="off"
      placeholder="Nhập tên thầy cô" :class="{ 'has-example': exampleNames.length }" :aria-describedby="describedBy" :aria-invalid="invalid || undefined"
      aria-autocomplete="list" :aria-expanded="expanded" :aria-controls="listId"
      :aria-activedescendant="expanded && active >= 0 ? `${listId}-${active}` : undefined"
      @focus="focused = true; dismissed = false" @keydown="onKeydown"
    />
    <span v-if="!value && exampleNames.length" class="example-placeholder" aria-hidden="true">
      Ví dụ: {{ typedExample }}<span class="typing-cursor"></span>
    </span>
    <ul v-if="expanded" :id="listId" class="suggestions" role="listbox" aria-label="Tên thầy cô đã có">
      <li v-for="(name, i) in suggestions" :key="name" role="presentation">
        <button :id="`${listId}-${i}`" type="button" role="option" :aria-selected="i === active"
          :class="{ active: i === active }" tabindex="-1" @mousedown.prevent @click="choose(name)">{{ name }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.teacher-entry { position: relative; flex: 1 1 180px; min-width: 120px; font-family: inherit; }
input { width: 100%; min-height: 44px; box-sizing: border-box; padding: 0 8px; border: none; outline: none; background: transparent; color: inherit; font: inherit; font-size: 16px; }
input::placeholder { color: #5E5874; opacity: 1; }
input.has-example::placeholder { opacity: 0; }
.example-placeholder { position: absolute; top: 50%; left: 8px; right: 8px; transform: translateY(-50%); overflow: hidden; white-space: nowrap; pointer-events: none; color: #5E5874; font: inherit; font-size: 16px; }
.typing-cursor { display: inline-block; height: 1em; margin-left: 2px; border-right: 1.5px solid currentColor; vertical-align: -0.12em; animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .typing-cursor { display: none; animation: none; } }
.suggestions { position: absolute; z-index: 5; top: calc(100% + 8px); left: 0; width: 100%; max-height: 260px; overflow-y: auto; box-sizing: border-box; margin: 0; padding: 6px; list-style: none; color: #231B42; background: #FFFFFF; border: 1px solid #C8C3D7; border-radius: 12px; box-shadow: 0 8px 24px rgba(35, 27, 66, 0.18); }
li { margin: 0; }
button { display: block; width: 100%; padding: 10px; border: none; border-radius: 8px; text-align: left; white-space: normal; background: transparent; color: inherit; font: inherit; font-size: 14px; cursor: pointer; }
button:hover, button.active, button:focus-visible { background: #E9EBF8; }
</style>
