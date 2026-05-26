/**
 * Xuất 24 ảnh PNG cho file 17 (12 sequence + 12 activity) từ Mermaid trong 14/15.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs/final/images/17-dac-ta-chuc-nang-gop-nhom");
const tmpDir = path.join(root, "docs/final/images/.tmp");

function parseSttDiagrams(md) {
  const map = new Map();
  for (const p of md.split(/^## STT /m).slice(1)) {
    const m = p.match(/^(\d+) — ([^\n]+)\n([\s\S]*)/);
    if (!m) continue;
    const block = [...m[3].matchAll(/```mermaid\r?\n([\s\S]*?)```/g)][0];
    if (block) map.set(Number(m[1]), block[1].trim());
  }
  return map;
}

function findExisting(stt, kind) {
  const pad = String(stt).padStart(2, "0");
  const dir14 = path.join(root, "docs/final/images/14-bieu-do-trinh-tu-gop-nhom");
  const dir15 = path.join(root, "docs/final/images/15-bieu-do-hoat-dong-gop-nhom");
  const dir = kind === "sequence" ? dir14 : dir15;
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => f.startsWith(`stt-${pad}-${kind}-`) && f.endsWith(".png"));
  return hit ? path.join(dir, hit) : null;
}

function render(code, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpIn = path.join(tmpDir, path.basename(outPath, ".png") + ".mmd");
  fs.writeFileSync(tmpIn, code, "utf8");
  execSync(
    `npx -y @mermaid-js/mermaid-cli -i "${tmpIn}" -o "${outPath}" -b white -s 2`,
    { stdio: "inherit", cwd: root, shell: true }
  );
}

const seq = parseSttDiagrams(
  fs.readFileSync(path.join(root, "docs/final/14-bieu-do-trinh-tu-gop-nhom.md"), "utf8")
);
const act = parseSttDiagrams(
  fs.readFileSync(path.join(root, "docs/final/15-bieu-do-hoat-dong-gop-nhom.md"), "utf8")
);

const manifest = [];
for (let stt = 1; stt <= 12; stt++) {
  const pad = String(stt).padStart(2, "0");
  for (const [kind, map] of [
    ["sequence", seq],
    ["activity", act],
  ]) {
    const code = map.get(stt);
    if (!code) throw new Error(`Missing ${kind} STT ${stt}`);
    const name = `stt-${pad}-${kind}.png`;
    const outPath = path.join(outDir, name);
    const existing = findExisting(stt, kind);
    if (existing) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.copyFileSync(existing, outPath);
      console.log(`STT ${stt} ${kind} → ${name} (copy)`);
    } else {
      console.log(`STT ${stt} ${kind} → ${name} (render)`);
      render(code, outPath);
    }
    manifest.push({ stt, kind, file: `docs/final/images/17-dac-ta-chuc-nang-gop-nhom/${name}` });
  }
}

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ source: "17-dac-ta-chuc-nang-gop-nhom.md", images: manifest }, null, 2)
);
console.log(`\n✓ 24 PNG → ${outDir}`);
