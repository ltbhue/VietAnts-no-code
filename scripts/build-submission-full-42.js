/**
 * Tạo bản nộp đầy đủ 42 use case: bỏ sơ đồ gộp 12 nhóm, giữ 42×2 sơ đồ chi tiết + đặc tả.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const finalDir = path.join(root, "docs/final");
const input = path.join(finalDir, "17-dac-ta-chuc-nang-gop-nhom.md");
const outputMd = path.join(finalDir, "17-dac-ta-chuc-nang-day-du-42-uc.md");
const tempMd = path.join(finalDir, "17-dac-ta-chuc-nang-day-du-42-uc-for-docx.md");
const outputDocx = path.join(finalDir, "17-dac-ta-chuc-nang-day-du-42-uc.docx");

let md = fs.readFileSync(input, "utf8");

// Bỏ biểu đồ gộp nhóm (3.5.xa/b) trước mỗi "Đặc tả chi tiết"
md = md.replace(
  /\n### Biểu đồ trình tự \(Sequence\) — 3\.5\.\d+a[\s\S]*?\n### Đặc tả chi tiết/g,
  "\n### Đặc tả chi tiết"
);

const header = `# Đặc tả chức năng — Bản đầy đủ 42 use case

**Phiên bản nộp (mức 2):** mỗi Bảng 3.3–3.44 có **1 sơ đồ trình tự + 1 sơ đồ hoạt động** riêng (84 hình).

- Ảnh: \`images/17-dac-ta-chuc-nang-gop-nhom/dc-XX-sequence.png\`, \`dc-XX-activity.png\`
- Bản gộp 12 nhóm (ít hình hơn): \`17-dac-ta-chuc-nang-gop-nhom.md\`

---

`;

md = md.replace(/^# Đặc tả chức năng \(gộp 12 nhóm\)[^\n]*\n/, header);

fs.writeFileSync(outputMd, md, "utf8");
console.log("Wrote", outputMd);

let docxMd = md.replace(/```mermaid\r?\n[\s\S]*?```\r?\n?/g, "");
fs.writeFileSync(tempMd, docxMd, "utf8");

const pandoc =
  process.env.LOCALAPPDATA
    ? `"${path.join(process.env.LOCALAPPDATA, "Pandoc", "pandoc.exe")}"`
    : "pandoc";

execSync(
  `${pandoc} "${tempMd}" -o "${outputDocx}" --resource-path="${finalDir}" --standalone`,
  { stdio: "inherit", cwd: finalDir, shell: true }
);

fs.unlinkSync(tempMd);
console.log("Wrote", outputDocx);
