<script>
import { ref, onMounted } from "vue";
import { db } from "../firebase.js";
import { slugify } from "../lib/slugify.js";
import { clean } from "../lib/wishes.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export { slugify } from "../lib/slugify.js";

export async function readWishesForTeacher(teacherName) {
  const q = query(
    collection(db, "wishes"),
    where("targetSlugs", "array-contains", teacherName),
    orderBy("createAt", "desc"),
  );

  const snapshot = await getDocs(q);
  const wishesForTeacher = snapshot.docs.map((wish) => ({
    id: wish.id,
    ...wish.data(),
  }));

  console.log("Successfully returned wishesForTeacher");
  return wishesForTeacher;
}

// Every wish for the tree on the homepage, oldest first, so each wish keeps its spot on the
// tree when new ones arrive. Ordering by a single field needs no composite index.
export async function readAllWishes(max = 2000) {
  const q = query(
    collection(db, "wishes"),
    orderBy("createAt", "asc"),
    limit(max),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((wish) => ({
    id: wish.id,
    ...wish.data(),
  }));
}

// Returns the new document's id.
export async function addWish({author, campus="", message ="", target=[], invitedBy=null}) {
  try {
    const docRef = await addDoc(collection(db,"wishes"),{
        author: author,
        campus: clean(campus),
        authorSlug: slugify(author),
        invitedBySlug: invitedBy || null,
        message: message,
        target: target,
        targetSlugs: target.map(slugify),
        createAt: serverTimestamp(),
    })
    console.log(`Successfully added wish with ID: `, docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error in addWish", error)
    throw error
  }
}
</script>
