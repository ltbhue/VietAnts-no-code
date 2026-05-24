const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const seq = fs.readFileSync(path.join(root, "docs/final/14-bieu-do-trinh-tu-gop-nhom.md"), "utf8");
const act = fs.readFileSync(path.join(root, "docs/final/15-bieu-do-hoat-dong-gop-nhom.md"), "utf8");

function sections(md) {
  const parts = md.split(/^## STT /m).slice(1);
  const map = new Map();
  for (const p of parts) {
    const m = p.match(/^(\d+) — ([^\n]+)\n/);
    if (!m) continue;
    const body = p.slice(m[0].length).trim();
    const firstBlock = body.split("\n---\n")[0].trim();
    map.set(Number(m[1]), { title: m[2].trim(), body: firstBlock });
  }
  return map;
}

const seqMap = sections(seq);
const actMap = sections(act);

const header = `# Biểu đồ trình tự & hoạt động (gộp nhóm) — Giao diện web

Mỗi **nhóm chức năng** gồm **2 hình**: biểu đồ trình tự (Sequence) + biểu đồ hoạt động (Activity).

Tham chiếu đặc tả: \`11-dac-ta-chuc-nang-giao-dien-web.md\`.

| STT | Nhóm | Use case | Hình trình tự | Hình hoạt động |
|-----|------|----------|---------------|----------------|
| 1 | Trang chủ | ĐC-01 | Hình 3.5.1a | Hình 3.5.1b |
| 2 | Xác thực & tài khoản | ĐC-02 → ĐC-07 | Hình 3.5.2a | Hình 3.5.2b |
| 3 | Dashboard | ĐC-08 | Hình 3.5.3a | Hình 3.5.3b |
| 4 | Quản lý dự án | ĐC-09 → ĐC-12 | Hình 3.5.4a | Hình 3.5.4b |
| 5 | Quản lý kịch bản | ĐC-13 → ĐC-18 | Hình 3.5.5a | Hình 3.5.5b |
| 6 | Thực thi kịch bản | ĐC-19 | Hình 3.5.6a | Hình 3.5.6b |
| 7 | Đối tượng UI | ĐC-20 → ĐC-23 | Hình 3.5.7a | Hình 3.5.7b |
| 8 | Bộ dữ liệu | ĐC-24 → ĐC-27 | Hình 3.5.8a | Hình 3.5.8b |
| 9 | Báo cáo | ĐC-28 → ĐC-32 | Hình 3.5.9a | Hình 3.5.9b |
| 10 | Ghi thao tác & publish | ĐC-33 → ĐC-37 | Hình 3.5.10a | Hình 3.5.10b |
| 11 | Chạy suite | ĐC-38 | Hình 3.5.11a | Hình 3.5.11b |
| 12 | Quản trị người dùng | ĐC-39 → ĐC-42 | Hình 3.5.12a | Hình 3.5.12b |

**Tổng: 12 nhóm × 2 = 24 hình** (thay cho 84 hình khi tách từng use case).

---

`;

let out = header;
for (let i = 1; i <= 12; i++) {
  const s = seqMap.get(i);
  const a = actMap.get(i);
  if (!s || !a) throw new Error(`Missing section ${i}`);
  out += `## STT ${i} — ${s.title}\n\n`;
  out += `### Biểu đồ trình tự (Sequence)\n\n${s.body}\n\n`;
  out += `### Biểu đồ hoạt động (Activity)\n\n${a.body}\n\n---\n\n`;
}

out += `## Tài liệu liên quan

| File | Mô tả |
|------|--------|
| \`11-dac-ta-chuc-nang-giao-dien-web.md\` | 42 bảng đặc tả chức năng |
| \`14-bieu-do-trinh-tu-gop-nhom.md\` | Chỉ biểu đồ trình tự (12 nhóm) |
| \`15-bieu-do-hoat-dong-gop-nhom.md\` | Chỉ biểu đồ hoạt động (12 nhóm) |
| \`12-bieu-do-trinh-tu-42-usecase.md\` | Phụ lục: 42 sequence chi tiết |
| \`13-bieu-do-hoat-dong-42-usecase.md\` | Phụ lục: 42 activity chi tiết |
`;

const outPath = path.join(root, "docs/final/16-bieu-do-gop-trinh-tu-va-hoat-dong.md");
fs.writeFileSync(outPath, out);
console.log("Wrote", outPath, "(" + out.length + " chars)");
