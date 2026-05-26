/**
 * Chuyển file 17 → .docx có ảnh nhúng (Pandoc). Bỏ khối mermaid (giữ ảnh PNG).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const finalDir = path.join(root, "docs/final");
const input = path.join(finalDir, "17-dac-ta-chuc-nang-gop-nhom.md");
const tempMd = path.join(finalDir, "17-dac-ta-chuc-nang-gop-nhom-for-docx.md");
const output = path.join(finalDir, "17-dac-ta-chuc-nang-gop-nhom.docx");

let md = fs.readFileSync(input, "utf8");
md = md.replace(/```mermaid\r?\n[\s\S]*?```\r?\n?/g, "");
fs.writeFileSync(tempMd, md, "utf8");

const pandoc =
  process.env.LOCALAPPDATA
    ? `"${path.join(process.env.LOCALAPPDATA, "Pandoc", "pandoc.exe")}"`
    : "pandoc";

execSync(
  `${pandoc} "${tempMd}" -o "${output}" --resource-path="${finalDir}" --standalone`,
  { stdio: "inherit", cwd: finalDir, shell: true }
);

fs.unlinkSync(tempMd);
console.log("Wrote", output);
