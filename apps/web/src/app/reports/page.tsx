"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { downloadRunPdf, getApiBase } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";

interface Run {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  scriptId?: string;
  script: {
    id?: string;
    name: string;
  };
}

interface RunDetail extends Run {
  results?: Array<{
    id: string;
    stepOrder: number;
    status: string;
    message?: string | null;
    screenshot?: string | null;
  }>;
  stepMeta?: Array<{
    order: number;
    keyword: string;
    targetId?: string | null;
  }>;
  objectMap?: Array<{
    id: string;
    name: string;
    locator: string;
  }>;
}

function viStatus(status: string): string {
  if (status === "passed") return "Thành công";
  if (status === "failed") return "Thất bại";
  if (status === "queued") return "Đang chờ";
  if (status === "running") return "Đang chạy";
  return status;
}

export default function ReportsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [scripts, setScripts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const apiBase = getApiBase();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedStatus) params.set("status", selectedStatus);
        if (selectedScriptId) params.set("scriptId", selectedScriptId);
        const res = await axios.get<Run[]>(`${apiBase}/runs${params.toString() ? `?${params.toString()}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRuns(res.data);
        const map = new Map<string, string>();
        for (const r of res.data) {
          const sid = r.script?.id ?? r.scriptId;
          if (sid) map.set(sid, r.script?.name ?? sid);
        }
        setScripts([...map.entries()].map(([id, name]) => ({ id, name })));
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải được dữ liệu runs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, selectedScriptId, selectedStatus]);

  async function loadDetail(id: string) {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setDetailLoading(true);
    setError(null);
    try {
      const res = await axios.get<RunDetail>(`${apiBase}/runs/${id}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetail(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải chi tiết");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handlePdf(runId: string) {
    setPdfLoading(runId);
    setError(null);
    try {
      await downloadRunPdf(runId);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e?.message ?? "Không tải được PDF");
    } finally {
      setPdfLoading(null);
    }
  }

  function getScreenshotUrl(screenshotPath: string): string {
    if (/^https?:\/\//i.test(screenshotPath)) return screenshotPath;
    const normalized = screenshotPath.startsWith("/") ? screenshotPath : `/${screenshotPath}`;
    return `${apiBase}${normalized}`;
  }

  const total = runs.length;
  const passed = runs.filter((r) => r.status === "passed").length;
  const failed = runs.filter((r) => r.status === "failed").length;

  return (
    <main className={ui.content}>
      <div className={ui.wide}>
        <PageHeader
          title="Báo cáo"
          subtitle="Tải PDF từng lần chạy, xem trạng thái và chi tiết kết quả từng bước."
        />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
      {error && <p className={`${ui.alertError} mb-4`}>{error}</p>}

      <section className="grid gap-4 md:grid-cols-3 mb-6 text-sm">
        <div className={ui.statCard}>
          <div className="text-slate-400 mb-1">Tổng số lần chạy</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className={ui.statCard}>
          <div className="text-slate-400 mb-1">Thành công</div>
          <div className="text-2xl font-semibold text-emerald-400">{passed}</div>
        </div>
        <div className={ui.statCard}>
          <div className="text-slate-400 mb-1">Thất bại</div>
          <div className="text-2xl font-semibold text-red-400">{failed}</div>
        </div>
      </section>

      <section className={`${ui.card} mb-6`}>
        <p className={`${ui.sectionTitle} mb-3`}>Bộ lọc báo cáo</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className={ui.select} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="passed">Thành công</option>
            <option value="failed">Thất bại</option>
            <option value="queued">Đang chờ</option>
          </select>
          <select className={ui.select} value={selectedScriptId} onChange={(e) => setSelectedScriptId(e.target.value)}>
            <option value="">Tất cả kịch bản</option>
            {scripts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus("");
              setSelectedScriptId("");
            }}
            className={ui.btnSecondary}
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      <section className={`${ui.card} text-sm`}>
        <p className={`${ui.sectionTitle} mb-4`}>Lần chạy gần đây</p>
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wide">
                <th className="py-3 px-4 text-left">Kịch bản</th>
                <th className="py-3 px-4 text-left">Bắt đầu</th>
                <th className="py-3 px-4 text-left">Kết thúc</th>
                <th className="py-3 px-4 text-left">Trạng thái</th>
                <th className="py-3 px-4 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-medium text-white">{r.script?.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                    {new Date(r.startedAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                    {r.finishedAt ? new Date(r.finishedAt).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        r.status === "passed"
                          ? "text-emerald-400"
                          : r.status === "failed"
                            ? "text-red-400"
                            : "text-slate-200"
                      }
                    >
                      {viStatus(r.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pdfLoading === r.id}
                        onClick={() => handlePdf(r.id)}
                        className={`${ui.btnSm} text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-50`}
                      >
                        {pdfLoading === r.id ? "Đang tải…" : "Tải PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadDetail(r.id)}
                        className={`${ui.btnSm} text-slate-300 hover:bg-slate-800`}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-3 text-slate-300">
                    Chưa có lần chạy. Vào <strong>Kịch bản</strong> → chọn kịch bản → <strong>Chạy kịch bản</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(detail || detailLoading) && (
        <div className={ui.modalOverlay}>
          <div className="max-w-2xl w-full max-h-[85vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50">
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 className="text-lg font-semibold text-white">Chi tiết run</h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white text-xl leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            {detailLoading && <p className="text-sm text-slate-400">Đang tải…</p>}
            {detail && !detailLoading && (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="text-slate-500">ID:</span> {detail.id}
                </p>
                <p>
                  <span className="text-slate-500">Script:</span> {detail.script?.name}
                </p>
                <p>
                  <span className="text-slate-500">Trạng thái:</span> {viStatus(detail.status)}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={pdfLoading === detail.id}
                    onClick={() => handlePdf(detail.id)}
                    className={`${ui.btnSm} text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-50`}
                  >
                    {pdfLoading === detail.id ? "Đang tải PDF…" : "Tải PDF báo cáo"}
                  </button>
                </div>
                <div className="border-t border-slate-800 pt-2 mt-2">
                  <div className="text-slate-400 mb-1">Kết quả từng bước</div>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {(detail.results ?? []).map((x) => (
                      <li key={x.id} className="border-b border-slate-800/80 pb-1">
                        {(() => {
                          const meta = (detail.stepMeta ?? []).find((m) => m.order === x.stepOrder);
                          const obj = meta?.targetId
                            ? (detail.objectMap ?? []).find((o) => o.id === meta.targetId)
                            : undefined;
                          return (
                            <>
                        Bước {x.stepOrder}:{" "}
                        <span
                          className={
                            x.status === "passed" ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {viStatus(x.status)}
                        </span>
                              {meta?.keyword ? <span className="text-slate-500"> ({meta.keyword})</span> : null}
                        {x.message && <span className="text-slate-400"> — {x.message}</span>}
                              {obj ? (
                                <div className="text-emerald-400 mt-0.5">
                                  Object: {obj.name} <span className="text-slate-500">({obj.id})</span>
                                </div>
                              ) : null}
                              {x.screenshot && (
                                <div className="mt-2 space-y-1.5">
                                  <a
                                    href={getScreenshotUrl(x.screenshot)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-400 hover:underline text-[11px]"
                                  >
                                    Mở ảnh lỗi: {x.screenshot}
                                  </a>
                                  <img
                                    src={getScreenshotUrl(x.screenshot)}
                                    alt={`Screenshot bước ${x.stepOrder}`}
                                    className="max-h-64 w-auto rounded-md border border-slate-700 bg-slate-950"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
