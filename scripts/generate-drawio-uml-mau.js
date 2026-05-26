/**
 * Sinh file .drawio theo mẫu đồ án UML:
 * - Sequence: Actor + GD (Boundary) + Ctr (Control) + E (Entity), message đánh số, return nét đứt
 * - Activity: Swimlane Người dùng | Hệ thống, ô vàng viền đỏ
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs/final/drawio/uml-mau");

const STYLE = {
  actor:
    "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;",
  boundary:
    "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;fontStyle=1",
  control:
    "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;",
  entity:
    "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;",
  lifeline: "endArrow=none;dashed=1;html=1;strokeColor=#666666;",
  call: "endArrow=block;html=1;strokeColor=#000000;fontSize=11;",
  ret: "endArrow=open;dashed=1;html=1;strokeColor=#000000;fontSize=11;",
  activation: "html=1;points=[];perimeter=rectanglePerimeter;fillColor=#f5f5f5;strokeColor=#666666;",
  step:
    "rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#FF0000;strokeWidth=2;fontSize=11;",
  start: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=none;",
  end: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#FF0000;strokeWidth=2;",
  swimCol:
    "swimlane;horizontal=1;startSize=28;fillColor=none;strokeColor=#000000;strokeWidth=2;fontStyle=1;fontSize=12;",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapDrawio(name, cells, pageH = 827) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="vietants-uml-mau" version="24.0.0">
  <diagram id="${name}" name="${esc(name)}">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="${pageH}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${cells.join("\n")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function parseDcDiagrams(md, prefix) {
  const map = new Map();
  const re = new RegExp(
    `### ${prefix}-(\\d+) \\u2014 ĐC-(\\d+): ([^\\r\\n]+)\\r?\\n\\r?\\n\`\`\`mermaid\\r?\\n([\\s\\S]*?)\`\`\``,
    "g"
  );
  let m;
  while ((m = re.exec(md)) !== null) {
    map.set(Number(m[2]), { sd: Number(m[1]), title: m[3].trim(), code: m[4].trim() });
  }
  return map;
}

function parseSequence(code) {
  const participants = [];
  const messages = [];
  for (const raw of code.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === "sequenceDiagram") continue;
    const actor = line.match(/^actor\s+(\w+)\s+as\s+(.+)$/i);
    const part = line.match(/^participant\s+(\w+)\s+as\s+(.+)$/i);
    if (actor) {
      participants.push({ id: actor[1], label: actor[2].trim(), role: "actor" });
      continue;
    }
    if (part) {
      let role = "boundary";
      const lbl = part[2].trim();
      if (/API|auth|Ctr/i.test(lbl)) role = "control";
      else if (/PostgreSQL|DB|Database/i.test(lbl)) role = "entity";
      else if (/Frontend|Next/i.test(lbl)) role = "boundary";
      participants.push({ id: part[1], label: lbl, role });
      continue;
    }
    if (/^(rect|alt|else|end|opt|loop|Note)\b/i.test(line)) continue;
    const msg = line.match(/^(\w+)\s*(->>|-->>|->|--)\s*(\w+)(?:\s*:\s*(.+))?$/);
    if (msg) {
      messages.push({
        from: msg[1],
        to: msg[3],
        text: (msg[4] || "").trim() || `${msg[1]} → ${msg[3]}`,
        ret: msg[2].includes("--"),
      });
    }
  }
  return { participants, messages };
}

function mapToUmlLayers(participants, dc, title) {
  const layers = [
    { id: "actor", label: "Người dùng", role: "actor", w: 40, h: 60 },
    {
      id: "gd",
      label: `GD_${shortName(title)}`,
      role: "boundary",
      w: 56,
      h: 56,
    },
    { id: "ctr", label: `Ctr_${shortName(title)}`, role: "control", w: 56, h: 56 },
    { id: "e", label: `E_${entityName(title)}`, role: "entity", w: 56, h: 56 },
  ];

  const idToLayer = new Map();
  for (const p of participants) {
    if (p.role === "actor") idToLayer.set(p.id, "actor");
    else if (p.role === "entity") idToLayer.set(p.id, "e");
    else if (p.role === "control") idToLayer.set(p.id, "ctr");
    else idToLayer.set(p.id, "gd");
  }
  return { layers, idToLayer };
}

function shortName(title) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 22) || "ChucNang";
}

function entityName(title) {
  const t = title.toLowerCase();
  if (t.includes("đăng nhập") || t.includes("đăng ký") || t.includes("mật khẩu"))
    return "User";
  if (t.includes("dự án")) return "Project";
  if (t.includes("kịch bản")) return "Script";
  if (t.includes("báo cáo") || t.includes("run")) return "TestRun";
  if (t.includes("đối tượng")) return "UiObject";
  if (t.includes("dữ liệu") || t.includes("dataset")) return "DataSet";
  return "DuLieu";
}

function buildSequenceDrawio(dc, title, code) {
  const { participants, messages } = parseSequence(code);
  const { layers, idToLayer } = mapToUmlLayers(participants, dc, title);
  const cells = [];
  let cid = 2;
  const colW = 150;
  const x0 = 40;
  const topY = 50;
  const xPos = new Map();

  layers.forEach((L, i) => {
    const x = x0 + i * colW;
    xPos.set(L.id, x + colW / 2);
    const style = STYLE[L.role] || STYLE.boundary;
    const boxId = cid++;
    cells.push(
      `        <mxCell id="${boxId}" value="${esc(L.label)}" style="${style}" vertex="1" parent="1">
          <mxGeometry x="${x + (colW - L.w) / 2}" y="${topY}" width="${L.w}" height="${L.h}" as="geometry"/>
        </mxCell>`
    );
    const lineId = cid++;
    const bottom = topY + 120 + messages.length * 48;
    cells.push(
      `        <mxCell id="${lineId}" style="${STYLE.lifeline}" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${x + colW / 2}" y="${topY + L.h}" as="sourcePoint"/>
            <mxPoint x="${x + colW / 2}" y="${bottom}" as="targetPoint"/>
          </mxGeometry>
        </mxCell>`
    );
  });

  let step = 1;
  let y = topY + 100;
  const resolveLayer = (pid) => {
    const layer = idToLayer.get(pid);
    return xPos.get(layer || "gd") ?? xPos.get("gd");
  };

  for (const m of messages) {
    const x1 = resolveLayer(m.from);
    const x2 = resolveLayer(m.to);
    const num = m.ret ? `${step}` : `${step}`;
    const label = m.ret ? `${num}. return ${m.text}` : `${num}. ${m.text}`;
    const style = m.ret ? STYLE.ret : STYLE.call;
    cells.push(
      `        <mxCell id="${cid++}" value="${esc(label)}" style="${style}" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${x1}" y="${y}" as="sourcePoint"/>
            <mxPoint x="${x2}" y="${y}" as="targetPoint"/>
          </mxGeometry>
        </mxCell>`
    );
    if (!m.ret) step += 1;
    y += 48;
  }

  const pad = String(dc).padStart(2, "0");
  const fileName = `dc-${pad}-sequence-uml`;
  return {
    fileName,
    xml: wrapDrawio(`ĐC-${pad}: ${title}`, cells, Math.max(600, y + 80)),
  };
}

function isUserStep(label) {
  return /^(Mở|Nhập|Nhấn|Chọn|Truy cập|Điền|Click|Chuyển|Quay|Đóng|Xóa local)/i.test(
    label
  );
}

function flowToSwimlaneSteps(code) {
  const steps = [];
  let n = 0;
  for (const raw of code.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^flowchart/i.test(line)) continue;
    const edge = line.match(/^(\w+)\s*-->\s*(?:\|([^|]+)\|\s*)?(\w+)/);
    if (edge) continue;

    const term = line.match(/^(\w+)\(\[([^\]]+)\]\)/);
    if (term) {
      if (/bắt đầu/i.test(term[2])) continue;
      if (/kết thúc/i.test(term[2])) continue;
    }

    const dec = line.match(/^(\w+)\{([^}]+)\}/);
    if (dec) {
      n++;
      steps.push({
        n,
        lane: /khóa|sai|không|lỗi/i.test(dec[2]) ? "system" : "user",
        text: dec[2].trim(),
        type: "decision",
      });
      continue;
    }

    const proc = line.match(/^(\w+)\[([^\]]+)\]/);
    if (proc) {
      n++;
      const label = proc[2].trim();
      steps.push({
        n,
        lane: isUserStep(label) ? "user" : "system",
        text: label,
        type: "process",
      });
    }
  }
  if (steps.length === 0) {
    steps.push({ n: 1, lane: "user", text: "Thực hiện thao tác", type: "process" });
    steps.push({ n: 2, lane: "system", text: "Xử lý và phản hồi", type: "process" });
  }
  return steps.slice(0, 12);
}

function buildActivityDrawio(dc, title, code) {
  const steps = flowToSwimlaneSteps(code);
  const cells = [];
  let cid = 2;
  const poolX = 40;
  const poolY = 40;
  const laneW = 280;
  const poolW = laneW * 2 + 4;
  const rowH = 70;
  const poolH = 60 + steps.length * rowH + 40;

  cells.push(
    `        <mxCell id="${cid++}" value="" style="${STYLE.swimCol}" vertex="1" parent="1">
          <mxGeometry x="${poolX}" y="${poolY}" width="${poolW}" height="${poolH}" as="geometry"/>
        </mxCell>`
  );
  const poolId = cid - 1;

  const laneUser = cid++;
  cells.push(
    `        <mxCell id="${laneUser}" value="Người dùng" style="${STYLE.swimCol}" vertex="1" parent="${poolId}">
      <mxGeometry x="0" y="0" width="${laneW}" height="${poolH}" as="geometry"/>
    </mxCell>`
  );
  const laneSys = cid++;
  cells.push(
    `        <mxCell id="${laneSys}" value="Hệ thống" style="${STYLE.swimCol}" vertex="1" parent="${poolId}">
      <mxGeometry x="${laneW}" y="0" width="${laneW}" height="${poolH}" as="geometry"/>
    </mxCell>`
  );

  const startId = cid++;
  cells.push(
    `        <mxCell id="${startId}" value="" style="${STYLE.start}" vertex="1" parent="${laneUser}">
      <mxGeometry x="${laneW / 2 - 8}" y="36" width="16" height="16" as="geometry"/>
    </mxCell>`
  );

  let prevId = startId;
  let prevLane = laneUser;
  let py = 36;

  steps.forEach((s) => {
    const laneParent = s.lane === "user" ? laneUser : laneSys;
    py += rowH;
    const stepId = cid++;
    const boxW = laneW - 40;
    const label = `${s.n}. ${s.text}`;
    const style =
      s.type === "decision"
        ? "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#FF0000;strokeWidth=2;fontSize=11;"
        : STYLE.step;
    const boxH = s.type === "decision" ? 70 : 48;
    cells.push(
      `        <mxCell id="${stepId}" value="${esc(label)}" style="${style}" vertex="1" parent="${laneParent}">
        <mxGeometry x="20" y="${py}" width="${boxW}" height="${boxH}" as="geometry"/>
      </mxCell>`
    );
    cells.push(
      `        <mxCell id="${cid++}" style="endArrow=block;html=1;strokeColor=#FF0000;strokeWidth=2;edgeStyle=orthogonalEdgeStyle;" edge="1" parent="${poolId}" source="${prevId}" target="${stepId}">
        <mxGeometry relative="1" as="geometry"/>
      </mxCell>`
    );
    prevId = stepId;
    prevLane = laneParent;
  });

  const endId = cid++;
  cells.push(
    `        <mxCell id="${endId}" value="" style="${STYLE.end}" vertex="1" parent="${laneSys}">
      <mxGeometry x="${laneW / 2 - 10}" y="${py + rowH}" width="20" height="20" as="geometry"/>
    </mxCell>`
  );
  cells.push(
    `        <mxCell id="${cid++}" style="endArrow=block;html=1;strokeColor=#FF0000;strokeWidth=2;" edge="1" parent="${poolId}" source="${prevId}" target="${endId}">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>`
  );

  const pad = String(dc).padStart(2, "0");
  const fileName = `dc-${pad}-activity-uml`;
  return {
    fileName,
    xml: wrapDrawio(`ĐC-${pad}: ${title}`, cells, poolY + poolH + 40),
  };
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const seqMd = fs.readFileSync(
    path.join(root, "docs/final/12-bieu-do-trinh-tu-42-usecase.md"),
    "utf8"
  );
  const actMd = fs.readFileSync(
    path.join(root, "docs/final/13-bieu-do-hoat-dong-42-usecase.md"),
    "utf8"
  );
  const seqMap = parseDcDiagrams(seqMd, "SD");
  const actMap = parseDcDiagrams(actMd, "AD");
  const manifest = [];

  for (let dc = 1; dc <= 42; dc++) {
    const pad = String(dc).padStart(2, "0");
    const seq = seqMap.get(dc);
    const act = actMap.get(dc);
    if (!seq || !act) throw new Error(`Thiếu ĐC-${pad}`);

    const s = buildSequenceDrawio(dc, seq.title, seq.code);
    const a = buildActivityDrawio(dc, act.title, act.code);
    fs.writeFileSync(path.join(outDir, `${s.fileName}.drawio`), s.xml, "utf8");
    fs.writeFileSync(path.join(outDir, `${a.fileName}.drawio`), a.xml, "utf8");
    manifest.push({
      dc,
      title: seq.title,
      sequence: `${s.fileName}.drawio`,
      activity: `${a.fileName}.drawio`,
    });
    console.log(`ĐC-${pad}: ${s.fileName}.drawio, ${a.fileName}.drawio`);
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n✓ 84 file .drawio (UML mẫu) → ${outDir}`);
}

main();
