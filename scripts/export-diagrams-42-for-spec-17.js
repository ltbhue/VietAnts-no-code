/**
 * Render 84 PNG (42 sequence + 42 activity) từ file 12, 13 → images/17-.../dc-XX-*.png
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs/final/images/17-dac-ta-chuc-nang-gop-nhom");
const tmpDir = path.join(root, "docs/final/images/.tmp");

function parseDcDiagrams(md, prefix) {
  const map = new Map();
  const re = new RegExp(
    `### ${prefix}-(\\d+) \\u2014 ĐC-(\\d+): ([^\\r\\n]+)\\r?\\n\\r?\\n\`\`\`mermaid\\r?\\n([\\s\\S]*?)\`\`\``,
    "g"
  );
  let m;
  while ((m = re.exec(md)) !== null) {
    const dc = Number(m[2]);
    map.set(dc, { title: m[3].trim(), code: m[4].trim() });
  }
  return map;
}

function sanitizeMermaid(code) {
  if (!/^\s*flowchart/i.test(code)) return code;
  return code.replace(
    /(\b\w+\[)([^\]\n"]*\[\][^\]\n"]*)(\])/g,
    (_, id, label, end) => `${id}"${label.replace(/"/g, "'")}"${end}`
  );
}

function render(code, outPath) {
  code = sanitizeMermaid(code);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpIn = path.join(tmpDir, path.basename(outPath, ".png") + ".mmd");
  fs.writeFileSync(tmpIn, code, "utf8");
  execSync(
    `npx -y @mermaid-js/mermaid-cli -i "${tmpIn}" -o "${outPath}" -b white -s 2`,
    { stdio: "inherit", cwd: root, shell: true }
  );
}

const seq = parseDcDiagrams(
  fs.readFileSync(path.join(root, "docs/final/12-bieu-do-trinh-tu-42-usecase.md"), "utf8"),
  "SD"
);
const act = parseDcDiagrams(
  fs.readFileSync(path.join(root, "docs/final/13-bieu-do-hoat-dong-42-usecase.md"), "utf8"),
  "AD"
);

const manifest = [];
for (let dc = 1; dc <= 42; dc++) {
  const pad = String(dc).padStart(2, "0");
  for (const [kind, map] of [
    ["sequence", seq],
    ["activity", act],
  ]) {
    const item = map.get(dc);
    if (!item) throw new Error(`Thiếu ${kind} cho ĐC-${pad}`);
    const name = `dc-${pad}-${kind}.png`;
    const outPath = path.join(outDir, name);
    if (fs.existsSync(outPath)) {
      console.log(`ĐC-${pad} ${kind} → ${name} (skip)`);
    } else {
      console.log(`ĐC-${pad} ${kind} → ${name}`);
      render(item.code, outPath);
    }
    manifest.push({ dc, kind, title: item.title, file: `docs/final/images/17-dac-ta-chuc-nang-gop-nhom/${name}` });
  }
}

const prev = fs.existsSync(path.join(outDir, "manifest.json"))
  ? JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"))
  : {};
fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ ...prev, perUseCase: manifest }, null, 2)
);
console.log(`\n✓ 84 PNG (42×2) → ${outDir}`);
