const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "docs/final/11-dac-ta-chuc-nang-giao-dien-web.md"), "utf8");

const groups = [
  { stt: 1, name: "Trang chủ", ucs: [1], screen: "/" },
  { stt: 2, name: "Xác thực & quản lý tài khoản", ucs: [2, 3, 4, 5, 6, 7], screen: "/login, /register, …" },
  { stt: 3, name: "Dashboard & thống kê", ucs: [8], screen: "/dashboard" },
  { stt: 4, name: "Quản lý dự án", ucs: [9, 10, 11, 12], screen: "/projects" },
  { stt: 5, name: "Quản lý kịch bản kiểm thử", ucs: [13, 14, 15, 16, 17, 18], screen: "/scripts, /scripts/[id]" },
  { stt: 6, name: "Thực thi kịch bản", ucs: [19], screen: "/scripts/[id]" },
  { stt: 7, name: "Quản lý đối tượng UI", ucs: [20, 21, 22, 23], screen: "/objects" },
  { stt: 8, name: "Quản lý bộ dữ liệu", ucs: [24, 25, 26, 27], screen: "/datasets" },
  { stt: 9, name: "Báo cáo & xuất PDF", ucs: [28, 29, 30, 31, 32], screen: "/reports, /report/[runId]" },
  { stt: 10, name: "Ghi thao tác & publish test case", ucs: [33, 34, 35, 36, 37], screen: "/recorder, /editor" },
  { stt: 11, name: "Chạy test suite", ucs: [38], screen: "/suite-runs" },
  { stt: 12, name: "Quản trị người dùng", ucs: [39, 40, 41, 42], screen: "/admin/users" },
];

const blocks = new Map();
const parts = src.split(/\n(?=### Bảng 3\.\d+)/);
for (const part of parts) {
  const header = part.match(/^### Bảng 3\.(\d+) — ĐC-(\d+): ([^\n]+)/);
  if (!header) continue;
  const dc = Number(header[2]);
  const body = part.trim();
  blocks.set(dc, {
    tableNum: header[1],
    title: header[3].trim(),
    body,
  });
}

function ucRange(arr) {
  if (arr.length === 1) return `ĐC-${String(arr[0]).padStart(2, "0")}`;
  return `ĐC-${String(arr[0]).padStart(2, "0")} → ĐC-${String(arr[arr.length - 1]).padStart(2, "0")}`;
}

let out = `# Đặc tả chức năng (gộp 12 nhóm) — Giao diện web

Tài liệu này **ánh xạ 42 use case** vào **12 nhóm**, khớp với biểu đồ trình tự/hoạt động (\`14\`, \`15\`, \`16\`).

Bản chi tiết từng bảng đầy đủ 8 cột: \`11-dac-ta-chuc-nang-giao-dien-web.md\`.

---

## Bảng ánh xạ tổng hợp (Đặc tả ↔ Biểu đồ)

| STT nhóm | Tên nhóm | Mã use case | Số UC | Bảng đặc tả (Chương 3) | Màn hình | Biểu đồ trình tự | Biểu đồ hoạt động | File |
|----------|----------|-------------|-------|------------------------|----------|------------------|-------------------|------|
`;

for (const g of groups) {
  const tables = g.ucs.map((u) => `3.${u + 2}`).join(", ");
  const dc = ucRange(g.ucs);
  out += `| ${g.stt} | ${g.name} | ${dc} | ${g.ucs.length} | Bảng ${tables} | ${g.screen} | Hình 3.5.${g.stt}a | Hình 3.5.${g.stt}b | \`16\` STT ${g.stt} |\n`;
}

out += `
**Quy ước đánh số hình trong đồ án (gợi ý):**
- **Chương 3.4** — Bảng đặc tả: Bảng 3.3 – 3.44 (file \`11\` hoặc các mục STT bên dưới).
- **Chương 3.5** — Biểu đồ: 12 nhóm × (Sequence + Activity) = 24 hình (file \`16\`).

---

`;

for (const g of groups) {
  const dc = ucRange(g.ucs);
  const tables = g.ucs.map((u) => blocks.get(u)?.tableNum).filter(Boolean).join(", ");

  out += `## Nhóm STT ${g.stt} — ${g.name}\n\n`;
  out += `| Thuộc tính nhóm | Giá trị |\n|-----------------|--------|\n`;
  out += `| **Mã use case** | ${dc} |\n`;
  out += `| **Số use case** | ${g.ucs.length} |\n`;
  out += `| **Bảng đặc tả** | Bảng 3.${g.ucs[0] + 2} – 3.${g.ucs[g.ucs.length - 1] + 2} (chi tiết: \`11\`) |\n`;
  out += `| **Màn hình** | ${g.screen} |\n`;
  out += `| **Biểu đồ trình tự** | Hình 3.5.${g.stt}a — file \`16\`, STT ${g.stt} |\n`;
  out += `| **Biểu đồ hoạt động** | Hình 3.5.${g.stt}b — file \`16\`, STT ${g.stt} |\n\n`;

  out += `### Danh sách use case trong nhóm\n\n`;
  out += `| Mã | Tên use case | Bảng |\n|----|--------------|------|\n`;
  for (const u of g.ucs) {
    const b = blocks.get(u);
    if (!b) continue;
    out += `| ĐC-${String(u).padStart(2, "0")} | ${b.title} | Bảng 3.${b.tableNum} |\n`;
  }
  out += `\n`;

  out += `### Đặc tả chi tiết (8 cột)\n\n`;
  for (const u of g.ucs) {
    const b = blocks.get(u);
    if (!b) {
      out += `*Thiếu nội dung ĐC-${String(u).padStart(2, "0")} trong file 11.*\n\n`;
      continue;
    }
    out += b.body + "\n\n---\n\n";
  }
}

out += `## Liên kết tài liệu

| File | Nội dung |
|------|----------|
| \`11-dac-ta-chuc-nang-giao-dien-web.md\` | 42 bảng đặc tả (đánh số Bảng 3.3–3.44) |
| \`17-dac-ta-chuc-nang-gop-nhom.md\` | **File này** — cùng nội dung, nhóm theo STT 1–12 |
| \`16-bieu-do-gop-trinh-tu-va-hoat-dong.md\` | 12 nhóm biểu đồ Sequence + Activity |
| \`12\`, \`13\` | Phụ lục: 42 biểu đồ tách riêng (nếu cần) |
`;

const outPath = path.join(root, "docs/final/17-dac-ta-chuc-nang-gop-nhom.md");
fs.writeFileSync(outPath, out);
console.log("Wrote", outPath, blocks.size, "use cases");
