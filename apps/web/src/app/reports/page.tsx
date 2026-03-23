"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { downloadRunPdf, getApiBase } from "@/lib/api";

interface Run {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  script: {
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
}

export default function ReportsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
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
        const res = await axios.get<Run[]>(`${apiBase}/runs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRuns(res.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải được dữ liệu runs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase]);

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

  const total = runs.length;
  const passed = runs.filter((r) => r.status === "passed").length;
  const failed = runs.filter((r) => r.status === "failed").length;

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Báo cáo &amp; thống kê</h1>
      <p className="text-sm text-slate-400 mb-6">
        Tải PDF từng lần chạy hoặc xem kết quả từng bước.
      </p>

      {loading && <p className="text-sm text-slate-300">Đang tải...</p>}
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <section className="grid gap-4 md:grid-cols-3 mb-6 text-sm">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-slate-300 mb-1">Tổng số lần chạy</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-slate-300 mb-1">Pass</div>
          <div className="text-2xl font-semibold text-emerald-400">{passed}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-slate-300 mb-1">Fail</div>
          <div className="text-2xl font-semibold text-red-400">{failed}</div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
        <h2 className="text-sm font-medium mb-3">Lần chạy</h2>
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-300">
                <th className="py-2 pr-3 text-left">Kịch bản</th>
                <th className="py-2 pr-3 text-left">Bắt đầu</th>
                <th className="py-2 pr-3 text-left">Kết thúc</th>
                <th className="py-2 pr-3 text-left">Trạng thái</th>
                <th className="py-2 pr-3 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-900">
                  <td className="py-2 pr-3">{r.script?.name}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(r.startedAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {r.finishedAt ? new Date(r.finishedAt).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        r.status === "passed"
                          ? "text-emerald-400"
                          : r.status === "failed"
                            ? "text-red-400"
                            : "text-slate-200"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pdfLoading === r.id}
                        onClick={() => handlePdf(r.id)}
                        className="text-emerald-400 hover:underline disabled:opacity-50"
                      >
                        {pdfLoading === r.id ? "Đang tải..." : "Tải PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadDetail(r.id)}
                        className="text-slate-300 hover:underline"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-auto p-5 shadow-xl">
            <div className="flex justify-between items-start gap-2 mb-3">
              <h3 className="font-medium text-sm">Chi tiết run</h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-slate-400 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
            {detailLoading && <p className="text-xs text-slate-400">Đang tải...</p>}
            {detail && !detailLoading && (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="text-slate-500">ID:</span> {detail.id}
                </p>
                <p>
                  <span className="text-slate-500">Script:</span> {detail.script?.name}
                </p>
                <p>
                  <span className="text-slate-500">Trạng thái:</span> {detail.status}
                </p>
                <div className="border-t border-slate-800 pt-2 mt-2">
                  <div className="text-slate-400 mb-1">Kết quả từng bước</div>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {(detail.results ?? []).map((x) => (
                      <li key={x.id} className="border-b border-slate-800/80 pb-1">
                        Bước {x.stepOrder}:{" "}
                        <span
                          className={
                            x.status === "passed" ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {x.status}
                        </span>
                        {x.message && <span className="text-slate-400"> — {x.message}</span>}
                        {x.screenshot && (
                          <div className="text-slate-500 mt-0.5">Screenshot: {x.screenshot}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
