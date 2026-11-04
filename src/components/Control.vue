<script>
import { ref, onMounted } from "vue";
import { db } from "../firebase.js";
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

export function slugify(str) {
    if (!str) return

    return str
        .normalize('NFD')                    // Split combined letters (e.g., "ê" -> "e" + "^")
        .replace(/[\u0300-\u036f]/g, '')     // Strip all accent marks
        .replace(/đ/g, 'd')                  // Convert lowercase 'đ' -> 'd'
        .replace(/Đ/g, 'd')                  // Convert uppercase 'Đ' -> 'd'
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')         // Remove punctuation
        .replace(/\s+/g, '-')                // Replace spaces with hyphens
        .replace(/-+/g, '-')                 // Replace multiple hyphens with single hyphen
}

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
export async function addWish({author, message ="", target=[], invitedBy=null}) {
  try {
    const docRef = await addDoc(collection(db,"wishes"),{
        author: author,
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
