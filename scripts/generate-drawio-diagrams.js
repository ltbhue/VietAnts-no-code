/**
 * Sinh file .drawio (diagrams.net / draw.io) từ biểu đồ Mermaid gộp nhóm (file 14, 15).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs/final/drawio");

function parseSttSections(md) {
  const map = new Map();
  for (const p of md.split(/^## STT /m).slice(1)) {
    const m = p.match(/^(\d+) — ([^\r\n]+)\r?\n([\s\S]*)/);
    if (!m) continue;
    const block = [...m[3].matchAll(/```mermaid\r?\n([\s\S]*?)```/g)][0];
    if (block) map.set(Number(m[1]), { title: m[2].trim(), code: block[1].trim() });
  }
  return map;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapDrawio(name, cells) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="vietants-spec" version="24.0.0">
  <diagram id="${name}" name="${esc(name)}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${cells.join("\n")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function parseSequenceMermaid(code) {
  const participants = [];
  const messages = [];
  let note = null;

  for (const raw of code.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === "sequenceDiagram") continue;

    const actor = line.match(/^actor\s+(\w+)\s+as\s+(.+)$/i);
    const part = line.match(/^participant\s+(\w+)\s+as\s+(.+)$/i);
    if (actor) {
      participants.push({ id: actor[1], label: actor[2].trim(), kind: "actor" });
      continue;
    }
    if (part) {
      participants.push({ id: part[1], label: part[2].trim(), kind: "participant" });
      continue;
    }
    const noteM = line.match(/^Note over .+:\s*(.+)$/i);
    if (noteM) {
      note = noteM[1].trim();
      continue;
    }
    if (/^(rect|alt|else|end|opt|loop)\b/i.test(line)) continue;

    const msg = line.match(/^(\w+)\s*(->>|-->>|->|--)\s*(\w+)\s*:\s*(.+)$/);
    if (msg) {
      messages.push({
        from: msg[1],
        to: msg[3],
        text: msg[4].trim(),
        dashed: msg[2].includes("--"),
      });
    }
  }

  const ids = new Set();
  for (const p of participants) ids.add(p.id);
  for (const m of messages) {
    ids.add(m.from);
    ids.add(m.to);
  }
  for (const id of ids) {
    if (!participants.find((p) => p.id === id)) {
      participants.push({ id, label: id, kind: "participant" });
    }
  }
  return { participants, messages, note };
}

function buildSequenceDrawio(stt, title, code) {
  const { participants, messages, note } = parseSequenceMermaid(code);
  const cells = [];
  let cid = 2;
  const colW = 160;
  const startX = 80;
  const topY = 60;
  const lifelineBottom = 100 + messages.length * 55 + 100;
  const pos = new Map();

  participants.forEach((p, i) => {
    const x = startX + i * colW;
    pos.set(p.id, x + colW / 2);
    const boxId = cid++;
    const style =
      p.kind === "actor"
        ? "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;"
        : "rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;";
    const h = p.kind === "actor" ? 60 : 40;
    const w = p.kind === "actor" ? 40 : 120;
    cells.push(
      `        <mxCell id="${boxId}" value="${esc(p.label)}" style="${style}" vertex="1" parent="1">
          <mxGeometry x="${x + (colW - w) / 2}" y="${topY}" width="${w}" height="${h}" as="geometry"/>
        </mxCell>`
    );
    const lineId = cid++;
    cells.push(
      `        <mxCell id="${lineId}" value="" style="endArrow=none;dashed=1;html=1;strokeColor=#999999;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${x + colW / 2}" y="${topY + h}" as="sourcePoint"/>
            <mxPoint x="${x + colW / 2}" y="${lifelineBottom}" as="targetPoint"/>
          </mxGeometry>
        </mxCell>`
    );
  });

  if (note) {
    cells.push(
      `        <mxCell id="${cid++}" value="${esc(note)}" style="shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
        <mxGeometry x="40" y="16" width="300" height="32" as="geometry"/>
      </mxCell>`
    );
  }

  let y = topY + 100;
  for (const m of messages) {
    const x1 = pos.get(m.from) ?? startX;
    const x2 = pos.get(m.to) ?? startX + colW;
    const dashed = m.dashed ? "dashed=1;" : "";
    cells.push(
      `        <mxCell id="${cid++}" value="${esc(m.text)}" style="endArrow=block;html=1;${dashed}" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${x1}" y="${y}" as="sourcePoint"/>
            <mxPoint x="${x2}" y="${y}" as="targetPoint"/>
          </mxGeometry>
        </mxCell>`
    );
    y += 55;
  }

  const fileName = `stt-${String(stt).padStart(2, "0")}-sequence`;
  return { fileName, xml: wrapDrawio(`${fileName}: ${title}`, cells) };
}

function parseFlowMermaid(code) {
  const nodes = new Map();
  const edges = [];

  for (const raw of code.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^flowchart/i.test(line)) continue;

    const edge = line.match(/^(\w+)\s*(-->|\-.->)\s*(?:\|([^|]+)\|\s*)?(\w+)/);
    if (edge) {
      edges.push({ from: edge[1], to: edge[4], label: edge[3]?.trim() || "" });
      continue;
    }

    // A([Bắt đầu]) — terminator
    const term = line.match(/^(\w+)\(\[([^\]]+)\]\)/);
    if (term) {
      nodes.set(term[1], { label: term[2].trim(), type: "terminator" });
      continue;
    }

    const decision = line.match(/^(\w+)\{([^}]+)\}/);
    if (decision) {
      nodes.set(decision[1], { label: decision[2].trim(), type: "decision" });
      continue;
    }

    const data = line.match(/^(\w+)\[\/([^/]+)\/\]/);
    if (data) {
      nodes.set(data[1], { label: data[2].trim(), type: "data" });
      continue;
    }

    const proc = line.match(/^(\w+)\[([^\]]+)\]/);
    if (proc) {
      nodes.set(proc[1], { label: proc[2].trim(), type: "process" });
      continue;
    }
  }

  for (const e of edges) {
    if (!nodes.has(e.from)) nodes.set(e.from, { label: e.from, type: "process" });
    if (!nodes.has(e.to)) nodes.set(e.to, { label: e.to, type: "process" });
  }
  return { nodes, edges };
}

function nodeStyle(type) {
  switch (type) {
    case "terminator":
      return "ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;";
    case "decision":
      return "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;";
    case "data":
      return "shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;";
    default:
      return "rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;";
  }
}

function layoutFlow(nodes, edges) {
  const ids = [...nodes.keys()];
  const start =
    ids.find((id) => /bắt đầu/i.test(nodes.get(id).label)) ||
    ids.find((id) => id === "A") ||
    ids[0];
  const levels = new Map();
  const queue = [[start, 0]];
  const seen = new Set();
  while (queue.length) {
    const [id, lvl] = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    levels.set(id, Math.max(levels.get(id) ?? 0, lvl));
    for (const e of edges.filter((x) => x.from === id)) {
      queue.push([e.to, lvl + 1]);
    }
  }
  for (const id of ids) if (!levels.has(id)) levels.set(id, 0);

  const byLevel = new Map();
  for (const [id, lvl] of levels) {
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl).push(id);
  }

  const pos = new Map();
  for (const [lvl, list] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
    list.forEach((id, i) => {
      pos.set(id, { x: 60 + i * 190, y: 60 + lvl * 95 });
    });
  }
  return pos;
}

function buildActivityDrawio(stt, title, code) {
  const { nodes, edges } = parseFlowMermaid(code);
  const pos = layoutFlow(nodes, edges);
  const cells = [];
  let cid = 2;
  const idMap = new Map();

  for (const [nid, node] of nodes) {
    const p = pos.get(nid) || { x: 80, y: 80 };
    const cellId = cid++;
    idMap.set(nid, cellId);
    const w = node.type === "decision" ? 130 : 170;
    const h = node.type === "decision" ? 85 : 52;
    cells.push(
      `        <mxCell id="${cellId}" value="${esc(node.label)}" style="${nodeStyle(node.type)}" vertex="1" parent="1">
          <mxGeometry x="${p.x}" y="${p.y}" width="${w}" height="${h}" as="geometry"/>
        </mxCell>`
    );
  }

  for (const e of edges) {
    const from = idMap.get(e.from);
    const to = idMap.get(e.to);
    if (!from || !to) continue;
    const label = e.label ? `value="${esc(e.label)}" ` : "";
    cells.push(
      `        <mxCell id="${cid++}" ${label}style="endArrow=block;html=1;" edge="1" parent="1" source="${from}" target="${to}">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>`
    );
  }

  const fileName = `stt-${String(stt).padStart(2, "0")}-activity`;
  return { fileName, xml: wrapDrawio(`${fileName}: ${title}`, cells) };
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const seqMap = parseSttSections(
    fs.readFileSync(path.join(root, "docs/final/14-bieu-do-trinh-tu-gop-nhom.md"), "utf8")
  );
  const actMap = parseSttSections(
    fs.readFileSync(path.join(root, "docs/final/15-bieu-do-hoat-dong-gop-nhom.md"), "utf8")
  );

  const manifest = [];
  for (let stt = 1; stt <= 12; stt++) {
    const seq = seqMap.get(stt);
    const act = actMap.get(stt);
    if (!seq || !act) throw new Error(`Thiếu STT ${stt}`);

    const s = buildSequenceDrawio(stt, seq.title, seq.code);
    const a = buildActivityDrawio(stt, act.title, act.code);
    fs.writeFileSync(path.join(outDir, `${s.fileName}.drawio`), s.xml, "utf8");
    fs.writeFileSync(path.join(outDir, `${a.fileName}.drawio`), a.xml, "utf8");
    manifest.push({ stt, sequence: `${s.fileName}.drawio`, activity: `${a.fileName}.drawio` });
    console.log(`STT ${stt}: ${s.fileName}.drawio, ${a.fileName}.drawio`);
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n✓ 24 file .drawio → ${outDir}`);
}

main();
