/**
 * Nhúng biểu đồ trình tự + hoạt động (từ file 14, 15) vào từng nhóm trong
 * docs/final/17-dac-ta-chuc-nang-gop-nhom.md
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const specPath = path.join(root, "docs/final/17-dac-ta-chuc-nang-gop-nhom.md");
const seqPath = path.join(root, "docs/final/14-bieu-do-trinh-tu-gop-nhom.md");
const actPath = path.join(root, "docs/final/15-bieu-do-hoat-dong-gop-nhom.md");
const imgRel = "images/17-dac-ta-chuc-nang-gop-nhom";

function parseSttDiagrams(md) {
  const map = new Map();
  const parts = md.split(/^## STT /m).slice(1);
  for (const p of parts) {
    const m = p.match(/^(\d+) — ([^\n]+)\n([\s\S]*)/);
    if (!m) continue;
    const block = [...m[3].matchAll(/```mermaid\r?\n([\s\S]*?)```/g)][0];
    if (block) map.set(Number(m[1]), { title: m[2].trim(), code: block[1].trim() });
  }
  return map;
}

function diagramBlock(stt, title, kind, figLabel, code) {
  const pad = String(stt).padStart(2, "0");
  const png = `${imgRel}/stt-${pad}-${kind}.png`;
  const heading =
    kind === "sequence"
      ? `### Biểu đồ trình tự (Sequence) — ${figLabel}`
      : `### Biểu đồ hoạt động (Activity) — ${figLabel}`;
  return `
${heading}

> **Hình ${figLabel}** — ${title}

![${figLabel} — ${title}](${png})

\`\`\`mermaid
${code}
\`\`\`
`;
}

function embed() {
  const seqMap = parseSttDiagrams(fs.readFileSync(seqPath, "utf8"));
  const actMap = parseSttDiagrams(fs.readFileSync(actPath, "utf8"));
  let md = fs.readFileSync(specPath, "utf8");

  md = md.replace(
    /\n### Biểu đồ trình tự[\s\S]*?\n### Đặc tả chi tiết/g,
    "\n### Đặc tả chi tiết"
  );

  const re = /^## Nhóm STT (\d+) — ([^\n]+)\n([\s\S]*?)(?=^## Nhóm STT |\n## Liên kết tài liệu|\Z)/gm;
  md = md.replace(re, (full, sttStr, title, body) => {
    const stt = Number(sttStr);
    const seq = seqMap.get(stt);
    const act = actMap.get(stt);
    if (!seq || !act) throw new Error(`Thiếu biểu đồ STT ${stt}`);

    const figA = `3.5.${stt}a`;
    const figB = `3.5.${stt}b`;
    const diagrams =
      diagramBlock(stt, title.trim(), "sequence", figA, seq.code) +
      diagramBlock(stt, title.trim(), "activity", figB, act.code);

    const updated = body.replace(/(\n### Đặc tả chi tiết)/, `${diagrams}$1`);
  return `## Nhóm STT ${sttStr} — ${title}\n${updated}`;
  });

  const headerNote =
    "Mỗi nhóm STT bên dưới gồm **đặc tả** + **biểu đồ trình tự** + **biểu đồ hoạt động** (Mermaid + ảnh PNG trong `docs/final/images/17-dac-ta-chuc-nang-gop-nhom/`).";
  if (!md.includes(headerNote)) {
    md = md.replace(
      /(Bản chi tiết từng bảng đầy đủ 8 cột: `11-dac-ta-chuc-nang-giao-dien-web.md`\.)\n/,
      `$1\n\n${headerNote}\n`
    );
  }

  fs.writeFileSync(specPath, md, "utf8");
  console.log("Updated", specPath);
}

embed();
