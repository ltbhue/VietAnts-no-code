/**
 * Extract Mermaid blocks from markdown and render to PNG via @mermaid-js/mermaid-cli.
 * Usage: node scripts/render-mermaid-images.js [file1.md file2.md ...]
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const outRoot = path.join(root, "docs", "final", "images");

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function parseSections(md) {
  const parts = md.split(/^## STT /m);
  const sections = [];
  for (const p of parts.slice(1)) {
    const m = p.match(/^(\d+) — ([^\n]+)\n([\s\S]*)/);
    if (!m) continue;
    const blocks = [...m[3].matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].map((x) =>
      x[1].trim()
    );
    sections.push({
      stt: Number(m[1]),
      title: m[2].trim(),
      blocks,
    });
  }
  return sections;
}

function parseAllMermaid(md) {
  return [...md.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].map((x) => x[1].trim());
}

function renderOne(mermaidCode, outPath) {
  const tmpDir = path.join(outRoot, ".tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmpIn = path.join(
    tmpDir,
    `diagram-${path.basename(outPath, ".png")}.mmd`
  );
  fs.writeFileSync(tmpIn, mermaidCode, "utf8");
  const cmd = `npx -y @mermaid-js/mermaid-cli -i "${tmpIn}" -o "${outPath}" -b white -s 2`;
  execSync(cmd, { stdio: "inherit", cwd: root, env: process.env, shell: true });
}

function renderFile(mdPath) {
  const base = path.basename(mdPath, ".md");
  const outDir = path.join(outRoot, base);
  const md = fs.readFileSync(mdPath, "utf8");
  const sections = parseSections(md);
  const manifest = [];

  if (sections.length > 0) {
    for (const s of sections) {
      const kinds =
        s.blocks.length === 2
          ? ["sequence", "activity"]
          : s.blocks.length === 1
            ? [base.includes("trinh-tu") ? "sequence" : "activity"]
            : s.blocks.map((_, i) => `diagram-${i + 1}`);

      s.blocks.forEach((code, i) => {
        const kind = kinds[i] || `diagram-${i + 1}`;
        const name = `stt-${String(s.stt).padStart(2, "0")}-${kind}-${slugify(s.title)}.png`;
        const outPath = path.join(outDir, name);
        console.log(`\n[${base}] STT ${s.stt} — ${kind} → ${name}`);
        renderOne(code, outPath);
        manifest.push({ stt: s.stt, title: s.title, kind, file: path.relative(root, outPath) });
      });
    }
  } else {
    const blocks = parseAllMermaid(md);
    blocks.forEach((code, i) => {
      const name = `diagram-${String(i + 1).padStart(2, "0")}.png`;
      const outPath = path.join(outDir, name);
      console.log(`\n[${base}] #${i + 1} → ${name}`);
      renderOne(code, outPath);
      manifest.push({ index: i + 1, file: path.relative(root, outPath) });
    });
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify({ source: path.relative(root, mdPath), images: manifest }, null, 2),
    "utf8"
  );
  console.log(`\n✓ ${manifest.length} images → ${outDir}`);
  return manifest.length;
}

const files =
  process.argv.length > 2
    ? process.argv.slice(2).map((f) => path.resolve(f))
    : [
        path.join(root, "docs/final/14-bieu-do-trinh-tu-gop-nhom.md"),
        path.join(root, "docs/final/15-bieu-do-hoat-dong-gop-nhom.md"),
        path.join(root, "docs/final/16-bieu-do-gop-trinh-tu-va-hoat-dong.md"),
      ];

let total = 0;
for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error("Missing:", f);
    process.exit(1);
  }
  total += renderFile(f);
}
console.log(`\nDone. Total ${total} PNG files under docs/final/images/`);
