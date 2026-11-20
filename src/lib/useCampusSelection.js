import { onBeforeUnmount, onMounted, ref } from "vue";
import { suggestCampus } from "./campus.js";

export function useCampusSelection({ lookup = suggestCampus } = {}) {
  const campus = ref("");
  let manuallyChosen = false;
  let disposed = false;
  const markCampusChosen = () => { manuallyChosen = true; };

  onMounted(async () => {
    const suggestion = await lookup();
    if (!disposed && !manuallyChosen && !campus.value) campus.value = suggestion;
  });
  onBeforeUnmount(() => { disposed = true; });

  return { campus, markCampusChosen };
}
