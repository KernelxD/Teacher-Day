// 512 made-up wishes for demo mode (open the site with ?demo at the end of the address).
// They let you see a full tree before real wishes arrive. Nothing here is saved to Firestore.

function makeRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const TEACHERS = [
  ["Cô Lan", "cô"], ["Cô Lan", "cô"], ["Cô Lan", "cô"], ["Thầy Minh", "thầy"], ["Thầy Minh", "thầy"],
  ["Cô Hằng", "cô"], ["Cô Hằng", "cô"], ["Cô Mai", "cô"], ["Thầy Tuấn", "thầy"], ["Thầy Hùng", "thầy"],
  ["Cô Thảo", "cô"], ["Cô Hương", "cô"], ["Thầy Nam", "thầy"], ["Cô Trang", "cô"], ["Thầy Phong", "thầy"],
  ["Cô Ngân", "cô"], ["Cô Vân", "cô"], ["Thầy Dũng", "thầy"], ["Cô Yến", "cô"], ["Thầy Khải", "thầy"],
];

const NAMES = [
  "Nguyễn Minh An", "Trần Gia Huy", "Lê Bảo Ngọc", "Phạm Thu Hà", "Hoàng Đức Anh", "Vũ Khánh Linh",
  "Đặng Quang Minh", "Bùi Hoàng Nam", "Đỗ Phương Vy", "Ngô Tuấn Kiệt", "Nguyễn Ngọc Hân", "Trần Anh Thư",
  "Lê Bảo Long", "Phạm Mai Chi", "Hoàng Nhật Minh", "Vũ Hà My", "Đặng Trung Kiên", "Bùi Diệu Linh",
  "Đỗ Minh Khoa", "Ngô Thảo Nguyên", "Nguyễn Gia Bảo", "Trần Lan Anh", "Lê Hải Đăng", "Phạm Yến Nhi",
  "Hoàng Thành Đạt", "Vũ Khánh Vy", "Đặng Phúc An", "Bùi Minh Thư", "Đỗ Quốc Huy", "Ngô Ngọc Ánh",
  "Nguyễn Đăng Khoa", "Trần Bích Ngọc", "Lê Tuệ Lâm", "Phạm Hữu Phước", "Hoàng Thanh Trúc", "Vũ Duy Anh",
  "Đặng Kim Ngân", "Bùi Thiên Ân", "Đỗ Bảo Châu", "Ngô Hồng Nhung",
];

// {p} is replaced with "cô" or "thầy", {P} with the capitalised form.
const TEMPLATES = [
  "Em cảm ơn {p} vì đã luôn kiên nhẫn với cả lớp. Chúc {p} 20/11 thật nhiều niềm vui ạ!",
  "Chúc {p} luôn mạnh khoẻ và giữ mãi nụ cười mỗi giờ lên lớp ạ.",
  "Nhờ {p} mà em thấy môn học này không còn khó nữa. Em chúc {p} luôn hạnh phúc.",
  "Cảm ơn {p} đã tin em ngay cả khi em chưa tin vào chính mình.",
  "Em sẽ cố gắng học tốt hơn để không phụ lòng {p}.",
  "Những lời {p} dặn dò em vẫn nhớ hết. Chúc {p} luôn bình an.",
  "Cảm ơn {p} vì những tiết học không bao giờ nhàm chán.",
  "Lớp mình thương {p} nhiều lắm. Chúc {p} 20/11 vui vẻ!",
  "Chúc {p} mãi trẻ trung và yêu nghề như bây giờ ạ.",
  "{P} là người đầu tiên khiến em thích đi học. Em cảm ơn {p}!",
  "Chúc {p} có thật nhiều sức khoẻ để tiếp tục truyền lửa cho tụi em.",
  "Chúc {p} 20/11 thật vui và bớt phải nhắc tụi em làm bài tập ạ.",
  "{P} là lý do mỗi sáng em muốn đến trường. Em cảm ơn {p}!",
  "Cảm ơn {p} đã kiên nhẫn giảng lại cho em đến khi em hiểu.",
  "Em xin lỗi vì những lần làm {p} buồn. Em cảm ơn {p} nhiều lắm.",
  "Chúc {p} một ngày 20/11 thật ấm áp bên gia đình và học trò.",
  "{P} dạy em cách suy nghĩ chứ không chỉ cách giải bài. Cảm ơn {p}!",
  "Mong {p} luôn giữ được ngọn lửa yêu nghề như ngày đầu.",
  "Chúc {p} luôn bình an và hạnh phúc ạ.",
  "Cảm ơn {p} đã cho em can đảm để phát biểu trước lớp.",
  "Những giờ học của {p} là khoảng thời gian em mong chờ nhất.",
  "Chúc {p} luôn vui vẻ, và mong {p} sẽ dạy em thêm nhiều năm nữa.",
  "Em cảm ơn {p} đã luôn công bằng với cả lớp.",
  "{P} ơi, tụi em thương {p} nhiều lắm!",
  "Chúc {p} ngủ ngon hơn và chấm bài nhẹ nhàng hơn ạ.",
  "Cảm ơn {p} vì những lời khen đúng lúc em cần nhất.",
  "Một năm học với {p} là một năm em thấy mình lớn hơn.",
  "Em cảm ơn {p} vì đã dạy em yêu những trang sách.",
  "Chúc {p} 20/11 thật nhiều sức khoẻ và niềm vui ạ!",
  "Cảm ơn {p} đã luôn lắng nghe tụi em, kể cả những chuyện nhỏ nhất.",
  "Hôm nào {p} cũng đến lớp với nụ cười, em thấy vui lây. Cảm ơn {p}!",
  "Em mong năm sau vẫn được học {p}.",
  "Cảm ơn {p} vì đã không bỏ cuộc với em.",
  "Chúc {p} luôn khoẻ, luôn vui và luôn là {p} của tụi em.",
  "Mỗi bài kiểm tra {p} chấm đều có một lời động viên. Em cảm ơn {p} nhiều.",
];

export function buildSampleWishes(count = 512) {
  const r = makeRandom(20112025);
  const wishes = [];
  for (let i = 0; i < count; i++) {
    const [teacher, pronoun] = TEACHERS[Math.floor(r() * TEACHERS.length)];
    const template = TEMPLATES[Math.floor(r() * TEMPLATES.length)];
    const Pronoun = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
    wishes.push({
      id: "sample-" + (i + 1),
      name: NAMES[Math.floor(r() * NAMES.length)],
      to: [teacher],
      content: template.split("{p}").join(pronoun).split("{P}").join(Pronoun),
    });
  }
  return wishes;
}
