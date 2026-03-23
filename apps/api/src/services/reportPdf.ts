import { chromium } from "playwright";
import type { PrismaClient } from "../generated/prisma/client";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function generateRunPdf(opts: {
  prisma: PrismaClient;
  runId: string;
  userId: string;
}) {
  const { prisma, runId, userId } = opts;

  const run = await prisma.testRun.findFirst({
    where: { id: runId, userId },
    include: {
      script: true,
      results: true,
      dataSet: true,
    },
  });
  if (!run) return null;

  const total = run.results.length;
  const results = run.results as any[];
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;

  const rowsHtml = results
    .sort((a: any, b: any) => a.stepOrder - b.stepOrder)
    .map((r: any) => {
      const statusClass =
        r.status === "passed" ? "badge badge-pass" : r.status === "failed" ? "badge badge-fail" : "badge";
      return `
        <tr>
          <td class="mono">${r.stepOrder}</td>
          <td><span class="${statusClass}">${escapeHtml(r.status)}</span></td>
          <td>${escapeHtml(r.message ?? "")}</td>
          <td class="mono small">${escapeHtml(r.screenshot ?? "")}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>TestRun Report</title>
      <style>
        :root { --fg:#0f172a; --muted:#475569; --border:#e2e8f0; --bg:#ffffff; --pass:#16a34a; --fail:#dc2626; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; color: var(--fg); background: var(--bg); margin: 0; padding: 32px; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        .sub { color: var(--muted); font-size: 12px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
        .card { border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
        .k { color: var(--muted); font-size: 11px; margin-bottom: 2px; }
        .v { font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border-bottom: 1px solid var(--border); padding: 8px; font-size: 12px; vertical-align: top; }
        th { text-align: left; color: var(--muted); font-weight: 600; }
        .badge { display:inline-block; padding:2px 8px; border-radius: 999px; font-size: 11px; border: 1px solid var(--border); }
        .badge-pass { border-color: rgba(22,163,74,.4); color: var(--pass); }
        .badge-fail { border-color: rgba(220,38,38,.4); color: var(--fail); }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .small { font-size: 10px; color: var(--muted); }
        .footer { margin-top: 18px; font-size: 10px; color: var(--muted); }
      </style>
    </head>
    <body>
      <h1>Báo cáo kiểm thử (TestRun)</h1>
      <div class="sub">Xuất lúc: ${escapeHtml(new Date().toLocaleString("vi-VN"))}</div>

      <div class="grid">
        <div class="card">
          <div class="k">Script</div>
          <div class="v">${escapeHtml(run.script?.name ?? "")}</div>
          <div class="k" style="margin-top:8px">Run ID</div>
          <div class="v mono">${escapeHtml(run.id)}</div>
          <div class="k" style="margin-top:8px">Status</div>
          <div class="v">${escapeHtml(run.status)}</div>
        </div>
        <div class="card">
          <div class="k">Browser</div>
          <div class="v">${escapeHtml(run.browser ?? "")}</div>
          <div class="k" style="margin-top:8px">Started</div>
          <div class="v">${escapeHtml(new Date(run.startedAt).toLocaleString("vi-VN"))}</div>
          <div class="k" style="margin-top:8px">Finished</div>
          <div class="v">${run.finishedAt ? escapeHtml(new Date(run.finishedAt).toLocaleString("vi-VN")) : "-"}</div>
        </div>
      </div>

      <div class="card">
        <div class="k">Summary</div>
        <div class="v">Total steps: <b>${total}</b> — Pass: <b style="color:var(--pass)">${passed}</b> — Fail: <b style="color:var(--fail)">${failed}</b></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:80px">Step</th>
            <th style="width:110px">Status</th>
            <th>Message</th>
            <th style="width:220px">Screenshot</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="4" class="small">Không có dữ liệu kết quả.</td></tr>`}
        </tbody>
      </table>

      <div class="footer">
        Vietants No-code Testing – Báo cáo export PDF (đồ án tốt nghiệp).
      </div>
    </body>
  </html>
  `;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });
    return { run, pdf };
  } finally {
    await browser.close();
  }
}

