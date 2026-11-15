<script>
import { ref, onMounted } from "vue";
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export function slugify(str) {
  if (!str) return "";

  return str
    .normalize("NFD") // Split combined letters
    .replace(/[\u0300-\u036f]/g, "") // Strip all accent marks
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const SAMPLE_WISHES = [
  {
    id: "sample-1",
    author: "Nguyễn Minh Anh - 11A1",
    target: ["Tất cả thầy cô"],
    message: "Nhân ngày Nhà giáo Việt Nam 20/11, em xin kính chúc các thầy cô luôn dồi dào sức khỏe, ngập tràn niềm vui và tiếp tục là người truyền lửa, dẫn lối cho chúng em trên mọi chặng đường!",
    fontStyle: "handwriting",
    createAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
  },
  {
    id: "sample-2",
    author: "Trần Tuấn Kiệt",
    target: ["Thầy hiệu trưởng", "Thầy cô bộ môn"],
    message: "Cảm ơn thầy cô đã luôn bao dung, lắng nghe và chỉ dạy từng bài học quý giá. Chúc thầy cô một ngày 20/11 thật trọn vẹn và nhiều kỷ niệm đáng nhớ ạ!",
    fontStyle: "cursive",
    createAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
  },
  {
    id: "sample-3",
    author: "Nhóm Học sinh VTEC",
    target: ["Cô chủ nhiệm"],
    message: "Gửi tới cô ngàn lời tri ân sâu sắc nhất! Cảm ơn cô vì đã luôn như một người mẹ thứ hai quan tâm và động viên chúng em trong từng hoạt động của lớp.",
    fontStyle: "typewriter",
    createAt: { seconds: Math.floor(Date.now() / 1000) - 14400 },
  },
];

export async function readWishesForTeacher(teacherName) {
  try {
    const normalized = slugify(teacherName);
    let wishes = [];

    try {
      const q = query(
        collection(db, "wishes"),
        where("targetSlugs", "array-contains", normalized),
        orderBy("createAt", "desc")
      );
      const snapshot = await getDocs(q);
      wishes = snapshot.docs.map((wish) => ({
        id: wish.id,
        ...wish.data(),
      }));
    } catch (indexError) {
      console.warn("Index query error, fallback to unindexed query:", indexError);
      const fallbackQ = query(
        collection(db, "wishes"),
        where("targetSlugs", "array-contains", normalized)
      );
      const snapshot = await getDocs(fallbackQ);
      wishes = snapshot.docs.map((wish) => ({
        id: wish.id,
        ...wish.data(),
      }));
      wishes.sort((a, b) => (b.createAt?.seconds || 0) - (a.createAt?.seconds || 0));
    }

    if (wishes.length === 0) {
      console.log("No wishes in Firestore, using sample wishes for preview");
      return SAMPLE_WISHES;
    }

    console.log("Successfully returned wishesForTeacher", wishes);
    return wishes;
  } catch (error) {
    console.error("Error in readWishesForTeacher:", error);
    return SAMPLE_WISHES;
  }
}

export async function addWish({
  author,
  message = "",
  target = [],
  invitedBy = null,
  fontStyle = "handwriting",
}) {
  try {
    const docRef = await addDoc(collection(db, "wishes"), {
      author: author,
      authorSlug: slugify(author),
      invitedBySlug: invitedBy || null,
      message: message,
      target: target,
      targetSlugs: target.map(slugify),
      fontStyle: fontStyle || "handwriting",
      createAt: serverTimestamp(),
    });
    console.log("Successfully added wish with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error in addWish", error);
    throw error;
  }
}
</script>
