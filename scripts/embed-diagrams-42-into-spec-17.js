/**
 * Nhúng biểu đồ trình tự + hoạt động (42 use case) sau mỗi Bảng đặc tả trong file 17.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const specPath = path.join(root, "docs/final/17-dac-ta-chuc-nang-gop-nhom.md");
const imgRel = "images/17-dac-ta-chuc-nang-gop-nhom";

function parseDcDiagrams(md, prefix) {
  const map = new Map();
  const re = new RegExp(
    `### ${prefix}-(\\d+) \\u2014 ĐC-(\\d+): ([^\\r\\n]+)\\r?\\n\\r?\\n\`\`\`mermaid\\r?\\n([\\s\\S]*?)\`\`\``,
    "g"
  );
  let m;
  while ((m = re.exec(md)) !== null) {
    map.set(Number(m[2]), { title: m[3].trim(), code: m[4].trim() });
  }
  return map;
}

function dcDiagrams(dc, title, seq, act) {
  const pad = String(dc).padStart(2, "0");
  return `
#### Biểu đồ trình tự — ĐC-${pad}

![Biểu đồ trình tự ĐC-${pad} — ${title}](${imgRel}/dc-${pad}-sequence.png)

\`\`\`mermaid
${seq.code}
\`\`\`

#### Biểu đồ hoạt động — ĐC-${pad}

![Biểu đồ hoạt động ĐC-${pad} — ${title}](${imgRel}/dc-${pad}-activity.png)

\`\`\`mermaid
${act.code}
\`\`\`
`;
}

function embed() {
  const seqMap = parseDcDiagrams(
    fs.readFileSync(path.join(root, "docs/final/12-bieu-do-trinh-tu-42-usecase.md"), "utf8"),
    "SD"
  );
  const actMap = parseDcDiagrams(
    fs.readFileSync(path.join(root, "docs/final/13-bieu-do-hoat-dong-42-usecase.md"), "utf8"),
    "AD"
  );

  let md = fs.readFileSync(specPath, "utf8");

  md = md.replace(
    /\n#### Biểu đồ trình tự — ĐC-\d+[\s\S]*?(?=\n---|\n\n### Bảng |\n\n## Nhóm|\n\n## Liên kết|\Z)/g,
    ""
  );

  const bảngRe =
    /(### Bảng 3\.\d+ \u2014 ĐC-(\d+): ([^\r\n]+)\r?\n\r?\n)(\| Cột \| Nội dung \|[\s\S]*?\| \*\*Các yêu cầu đặc biệt\*\* \| [^\r\n]+\|)\r?\n/g;

  md = md.replace(bảngRe, (full, head, dcStr, title, tableBody) => {
    const dc = Number(dcStr);
    const seq = seqMap.get(dc);
    const act = actMap.get(dc);
    if (!seq || !act) throw new Error(`Thiếu biểu đồ cho ĐC-${dcStr}`);
    return `${head}${tableBody}\n${dcDiagrams(dc, title.trim(), seq, act)}\n`;
  });

  const note =
    "Sau **mỗi bảng đặc tả** (Bảng 3.3–3.44) có **biểu đồ trình tự + hoạt động riêng** (42×2); mỗi **nhóm STT** có thêm biểu đồ gộp (Hình 3.5.xa/b). Ảnh: `docs/final/images/17-dac-ta-chuc-nang-gop-nhom/dc-XX-*.png`.";
  if (!md.includes("42×2")) {
    md = md.replace(
      /(Mỗi nhóm STT bên dưới gồm[\s\S]*?\.)\n/,
      `$1\n\n${note}\n`
    );
  }

  fs.writeFileSync(specPath, md, "utf8");
  console.log("Đã nhúng 42×2 biểu đồ vào", specPath);
}

embed();
